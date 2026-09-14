#!/usr/bin/env bash
set -Eeuo pipefail

# ==============================================================================
# FutureFund Classroom - DigitalOcean bootstrap/deployment script
# ==============================================================================
#
# PURPOSE
# -------
# This script creates (or reuses) the DigitalOcean infrastructure needed to run
# FutureFund Classroom:
#
#   1. A DigitalOcean Managed PostgreSQL cluster.
#   2. A dedicated application database and database user.
#   3. A DigitalOcean App Platform application sourced from GitHub.
#   4. Runtime secrets used for sessions, cron authentication, observability,
#      and encrypted market-provider credentials.
#   5. A scheduled App Platform job that calls /api/market/poll during school
#      hours.
#
# This script is intentionally verbose and heavily commented so it can serve as
# a future operations reference, not just a one-time installer.
#
# IMPORTANT
# ---------
# Run this script FROM THE ROOT OF THE FUTUREFUND REPOSITORY after applying the
# DigitalOcean package files. It expects to find:
#
#   package.json
#   Dockerfile
#   .do/app.template.yaml
#   scripts/digitalocean-migrate.mjs
#   scripts/market-poll.mjs
#   app/api/health/route.ts
#
# DigitalOcean must also have GitHub access to the private repository. This is
# a separate authorization from the ChatGPT GitHub connection.
#
# The script is designed to be safe to re-run:
#   - Existing DB clusters/apps are reused by name.
#   - Existing encrypted App Platform secrets are preserved when possible.
#   - The credential-encryption key is NOT automatically rotated.
#
# ==============================================================================

# ------------------------------------------------------------------------------
# Section 1 - Helper functions
# ------------------------------------------------------------------------------
# These small functions keep the rest of the script readable and provide
# consistent output/error handling.

info() {
  printf '\n\033[1;34m[INFO]\033[0m %s\n' "$*"
}

success() {
  printf '\033[1;32m[OK]\033[0m %s\n' "$*"
}

warn() {
  printf '\033[1;33m[WARN]\033[0m %s\n' "$*"
}

die() {
  printf '\n\033[1;31m[ERROR]\033[0m %s\n' "$*" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Required command '$1' was not found in PATH."
}

prompt_default() {
  local prompt="$1"
  local default="$2"
  local value
  read -r -p "$prompt [$default]: " value
  printf '%s' "${value:-$default}"
}

prompt_secret() {
  local prompt="$1"
  local value
  read -r -s -p "$prompt: " value
  printf '\n' >&2
  printf '%s' "$value"
}

confirm() {
  local prompt="$1"
  local answer
  read -r -p "$prompt [y/N]: " answer
  [[ "$answer" =~ ^[Yy]$ ]]
}

# Render a shell value as a JSON string. JSON quoted strings are valid YAML
# scalars, which makes this a safe way to insert user-entered values into the
# generated App Platform YAML spec.
yaml_string() {
  VALUE="$1" node --input-type=module -e \
    'process.stdout.write(JSON.stringify(process.env.VALUE ?? ""))'
}

# Look up a database cluster ID by exact cluster name.
find_database_id() {
  local name="$1"
  doctl databases list --format ID,Name --no-header 2>/dev/null \
    | awk -v target="$name" '$2 == target { print $1; exit }'
}

# Look up an App Platform app ID by exact app name.
find_app_id() {
  local name="$1"
  doctl apps list --format ID,Spec.Name --no-header 2>/dev/null \
    | awk -v target="$name" '$2 == target { print $1; exit }'
}

# Pull one environment-variable value from an existing App Platform spec.
# DigitalOcean returns already-encrypted secrets as EV[...] values. Reusing
# those values on updates prevents accidental secret rotation.
existing_env_value() {
  local spec_file="$1"
  local key="$2"

  node --input-type=module - "$spec_file" "$key" <<'NODE'
import fs from "node:fs";

const [, , file, key] = process.argv;
const spec = JSON.parse(fs.readFileSync(file, "utf8"));

const envs = [
  ...(spec.envs ?? []),
  ...((spec.services ?? []).flatMap((component) => component.envs ?? [])),
  ...((spec.jobs ?? []).flatMap((component) => component.envs ?? [])),
];

const match = envs.find((entry) => entry.key === key);
process.stdout.write(match?.value ?? "");
NODE
}

# ------------------------------------------------------------------------------
# Section 2 - Preflight checks
# ------------------------------------------------------------------------------
# Fail early before creating billable resources if the local checkout does not
# contain the expected deployment files or required CLI tools.

info "Running local preflight checks..."

require_cmd bash
require_cmd doctl
require_cmd node
require_cmd npm
require_cmd awk
require_cmd mktemp

[[ -f package.json ]] || die "package.json not found. Run this script from the FutureFund repository root."
[[ -f Dockerfile ]] || die "Dockerfile not found in the repository root."
[[ -f .do/app.template.yaml ]] || die ".do/app.template.yaml is missing. Apply the DigitalOcean package first."
[[ -f scripts/digitalocean-migrate.mjs ]] || die "scripts/digitalocean-migrate.mjs is missing."
[[ -f scripts/market-poll.mjs ]] || die "scripts/market-poll.mjs is missing."
[[ -f app/api/health/route.ts ]] || die "app/api/health/route.ts is missing."

if ! grep -q "CREDENTIAL_ENCRYPTION_KEY" lib/server/secrets.ts 2>/dev/null; then
  die "lib/server/secrets.ts does not contain the DigitalOcean encrypted credential-store support."
fi

# FutureFund currently declares Node >= 22.13.0. We enforce Node 22+ here.
NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
if (( NODE_MAJOR < 22 )); then
  die "Node.js 22 or later is required. Current version: $(node --version)"
fi

success "Repository files and local tooling look good."

# ------------------------------------------------------------------------------
# Section 3 - DigitalOcean authentication
# ------------------------------------------------------------------------------
# doctl stores an API token in an authentication context. If no working context
# exists, we launch doctl's normal interactive authentication flow.
#
# The token should have enough permission to create/manage:
#   - Managed Databases
#   - App Platform applications
#
# DigitalOcean API tokens are created in the DigitalOcean control panel.

info "Checking DigitalOcean CLI authentication..."

if ! doctl account get >/dev/null 2>&1; then
  warn "doctl is not currently authenticated."
  info "Starting 'doctl auth init'. Paste a DigitalOcean API token when prompted."
  doctl auth init
fi

DO_ACCOUNT_EMAIL="$(doctl account get --format Email --no-header 2>/dev/null || true)"
success "Authenticated to DigitalOcean${DO_ACCOUNT_EMAIL:+ as $DO_ACCOUNT_EMAIL}."

# ------------------------------------------------------------------------------
# Section 4 - Collect deployment settings
# ------------------------------------------------------------------------------
# The defaults are a sensible small-pilot configuration. Nothing is created
# until after the summary/confirmation later in the script.
#
# App Platform uses regional slugs such as "nyc".
# Managed Databases use datacenter slugs such as "nyc1".

printf '\n'
echo "FutureFund deployment settings"
echo "------------------------------"

APP_NAME="$(prompt_default "App Platform application name" "futurefund-classroom")"
GITHUB_REPO="$(prompt_default "GitHub repository (owner/repo)" "soco104/investing")"
GITHUB_BRANCH="$(prompt_default "GitHub branch" "main")"

APP_REGION="$(prompt_default "App Platform region" "nyc")"
APP_INSTANCE_SIZE="$(prompt_default "Web service instance size" "apps-s-1vcpu-1gb-fixed")"

DB_CLUSTER_NAME="$(prompt_default "Managed PostgreSQL cluster name" "futurefund-postgres")"
DB_REGION="$(prompt_default "Managed PostgreSQL datacenter region" "nyc1")"
DB_SIZE="$(prompt_default "Managed PostgreSQL size" "db-s-1vcpu-1gb")"
DB_NAME="$(prompt_default "Application database name" "futurefund")"
DB_USER="$(prompt_default "Application database user" "futurefund_app")"

DISTRICT_NAME="$(prompt_default "Bootstrap district name" "FutureFund Pilot")"
DISTRICT_STATE="$(prompt_default "Bootstrap district state" "MI")"
ADMIN_EMAIL="$(prompt_default "Bootstrap administrator email" "${USER:-admin}@example.com")"
PRIVACY_CONTACT_EMAIL="$(prompt_default "Privacy contact email" "$ADMIN_EMAIL")"

MARKET_TIME_ZONE="$(prompt_default "Market polling timezone" "America/Detroit")"
MARKET_CRON="$(prompt_default "Market polling cron expression" "*/15 8-15 * * 1-5")"

# ------------------------------------------------------------------------------
# Section 5 - Detect an existing App Platform app
# ------------------------------------------------------------------------------
# If the app already exists, the script reads its current App Platform spec.
# Existing DigitalOcean-encrypted secret values are carried forward so routine
# re-deployments do NOT invalidate sessions or make encrypted provider tokens
# unreadable.

APP_ID="$(find_app_id "$APP_NAME" || true)"
CURRENT_SPEC_JSON=""

if [[ -n "$APP_ID" ]]; then
  info "Existing App Platform app '$APP_NAME' found ($APP_ID)."
  CURRENT_SPEC_JSON="$(mktemp)"
  doctl apps spec get "$APP_ID" --format json > "$CURRENT_SPEC_JSON"
else
  info "No existing App Platform app named '$APP_NAME' was found; this will be a first deployment."
fi

# ------------------------------------------------------------------------------
# Section 6 - Generate or preserve application secrets
# ------------------------------------------------------------------------------
#
# SESSION_SECRET
#   HMAC key used to sign FutureFund login sessions.
#
# CRON_SECRET
#   Shared secret used by the scheduled market-poll job when calling the API.
#
# OBSERVABILITY_INGEST_SECRET
#   Protects production observability ingestion endpoints.
#
# CREDENTIAL_ENCRYPTION_KEY
#   256-bit key used to AES-GCM encrypt market/provider credentials before they
#   are stored in PostgreSQL. THIS KEY MUST REMAIN STABLE. Rotating it without
#   re-encrypting existing rows would make stored credentials unreadable.
#
# BOOTSTRAP_ADMIN_PASSWORD_HASH
#   bcrypt hash used only to seed the initial administrator if one does not
#   already exist.

generate_secret() {
  node --input-type=module -e \
    'import { randomBytes } from "node:crypto"; console.log(randomBytes(48).toString("base64url"));'
}

generate_encryption_key() {
  node --input-type=module -e \
    'import { randomBytes } from "node:crypto"; console.log(randomBytes(32).toString("base64"));'
}

SESSION_SECRET=""
CRON_SECRET=""
OBSERVABILITY_INGEST_SECRET=""
CREDENTIAL_ENCRYPTION_KEY=""
BOOTSTRAP_ADMIN_PASSWORD_HASH=""

if [[ -n "$CURRENT_SPEC_JSON" ]]; then
  SESSION_SECRET="$(existing_env_value "$CURRENT_SPEC_JSON" "SESSION_SECRET")"
  CRON_SECRET="$(existing_env_value "$CURRENT_SPEC_JSON" "CRON_SECRET")"
  OBSERVABILITY_INGEST_SECRET="$(existing_env_value "$CURRENT_SPEC_JSON" "OBSERVABILITY_INGEST_SECRET")"
  CREDENTIAL_ENCRYPTION_KEY="$(existing_env_value "$CURRENT_SPEC_JSON" "CREDENTIAL_ENCRYPTION_KEY")"
  BOOTSTRAP_ADMIN_PASSWORD_HASH="$(existing_env_value "$CURRENT_SPEC_JSON" "BOOTSTRAP_ADMIN_PASSWORD_HASH")"
fi

[[ -n "$SESSION_SECRET" ]] || SESSION_SECRET="$(generate_secret)"
[[ -n "$CRON_SECRET" ]] || CRON_SECRET="$(generate_secret)"
[[ -n "$OBSERVABILITY_INGEST_SECRET" ]] || OBSERVABILITY_INGEST_SECRET="$(generate_secret)"
[[ -n "$CREDENTIAL_ENCRYPTION_KEY" ]] || CREDENTIAL_ENCRYPTION_KEY="$(generate_encryption_key)"

if [[ -z "$BOOTSTRAP_ADMIN_PASSWORD_HASH" ]]; then
  info "A password is needed for the initial FutureFund administrator."

  ADMIN_PASSWORD="$(prompt_secret "Bootstrap administrator password")"
  [[ ${#ADMIN_PASSWORD} -ge 12 ]] || die "Bootstrap admin password must be at least 12 characters."

  ADMIN_PASSWORD_CONFIRM="$(prompt_secret "Confirm bootstrap administrator password")"
  [[ "$ADMIN_PASSWORD" == "$ADMIN_PASSWORD_CONFIRM" ]] || die "Administrator passwords do not match."

  # bcryptjs is already an application dependency. If dependencies have not
  # been installed in this checkout, npm ci installs the exact lockfile set so
  # we can generate the bootstrap hash locally without sending the password
  # anywhere.
  if ! node --input-type=module -e 'await import("bcryptjs")' >/dev/null 2>&1; then
    info "Local node_modules is missing bcryptjs; running npm ci to generate the admin hash..."
    npm ci
  fi

  ADMIN_PASSWORD="$ADMIN_PASSWORD" BOOTSTRAP_ADMIN_PASSWORD_HASH="$(
    ADMIN_PASSWORD="$ADMIN_PASSWORD" node --input-type=module -e \
      'import bcrypt from "bcryptjs"; console.log(await bcrypt.hash(process.env.ADMIN_PASSWORD, 12));'
  )"

  unset ADMIN_PASSWORD ADMIN_PASSWORD_CONFIRM
fi

success "Application secrets are prepared."

# ------------------------------------------------------------------------------
# Section 7 - Show cost-impacting choices and require confirmation
# ------------------------------------------------------------------------------
# This is the last checkpoint before the script creates billable resources.
# The exact DigitalOcean bill can change as pricing changes or resources scale.

printf '\n'
echo "Deployment summary"
echo "------------------"
printf 'App name:              %s\n' "$APP_NAME"
printf 'GitHub source:         %s (%s)\n' "$GITHUB_REPO" "$GITHUB_BRANCH"
printf 'App region:            %s\n' "$APP_REGION"
printf 'Web instance:          %s\n' "$APP_INSTANCE_SIZE"
printf 'PostgreSQL cluster:    %s\n' "$DB_CLUSTER_NAME"
printf 'PostgreSQL region:     %s\n' "$DB_REGION"
printf 'PostgreSQL size:       %s\n' "$DB_SIZE"
printf 'Database / user:       %s / %s\n' "$DB_NAME" "$DB_USER"
printf 'District:              %s (%s)\n' "$DISTRICT_NAME" "$DISTRICT_STATE"
printf 'Bootstrap admin:       %s\n' "$ADMIN_EMAIL"
printf 'Market schedule:       %s (%s)\n' "$MARKET_CRON" "$MARKET_TIME_ZONE"
echo
echo "Current starter sizing is approximately:"
echo "  - App Platform 1 vCPU / 1 GiB fixed service: ~\$10/month"
echo "  - Managed PostgreSQL 1 vCPU / 1 GiB:          ~\$15.15/month"
echo "  - Scheduled job: billed only while running"
echo
echo "Pricing changes over time; verify the DigitalOcean pricing page before production use."
echo

confirm "Proceed with creating/updating these DigitalOcean resources?" \
  || die "Deployment cancelled before resource creation."

# ------------------------------------------------------------------------------
# Section 8 - Create or reuse Managed PostgreSQL
# ------------------------------------------------------------------------------
# The cluster is created only when an exact name match does not already exist.
# --wait keeps the script from proceeding until the new cluster is online.

DB_ID="$(find_database_id "$DB_CLUSTER_NAME" || true)"

if [[ -z "$DB_ID" ]]; then
  info "Creating Managed PostgreSQL cluster '$DB_CLUSTER_NAME'..."
  doctl databases create "$DB_CLUSTER_NAME" \
    --engine pg \
    --region "$DB_REGION" \
    --size "$DB_SIZE" \
    --num-nodes 1 \
    --wait

  DB_ID="$(find_database_id "$DB_CLUSTER_NAME" || true)"
  [[ -n "$DB_ID" ]] || die "Database cluster creation returned, but the cluster ID could not be found."
  success "Managed PostgreSQL cluster created: $DB_ID"
else
  success "Reusing existing Managed PostgreSQL cluster: $DB_ID"
fi

DB_STATUS="$(doctl databases get "$DB_ID" --format Status --no-header)"
[[ "$DB_STATUS" == "online" ]] || die "Database cluster status is '$DB_STATUS', expected 'online'."

PG_VERSION="$(doctl databases get "$DB_ID" --format Version --no-header)"
success "PostgreSQL $PG_VERSION is online."

# ------------------------------------------------------------------------------
# Section 9 - Create the FutureFund database and application DB user
# ------------------------------------------------------------------------------
# The app gets its own logical database and user instead of using defaultdb /
# doadmin. DigitalOcean generates the DB user's password and App Platform injects
# the final DATABASE_URL via a bindable variable, so the password never needs to
# be written into this script or a local .env file.

if doctl databases db get "$DB_ID" "$DB_NAME" >/dev/null 2>&1; then
  success "Database '$DB_NAME' already exists."
else
  info "Creating application database '$DB_NAME'..."
  doctl databases db create "$DB_ID" "$DB_NAME"
  success "Database '$DB_NAME' created."
fi

if doctl databases user get "$DB_ID" "$DB_USER" >/dev/null 2>&1; then
  success "Database user '$DB_USER' already exists."
else
  info "Creating application database user '$DB_USER'..."
  doctl databases user create "$DB_ID" "$DB_USER"
  success "Database user '$DB_USER' created."
fi

# ------------------------------------------------------------------------------
# Section 10 - Render the DigitalOcean App Platform specification
# ------------------------------------------------------------------------------
# The committed .do/app.template.yaml contains placeholders rather than real
# secrets. This section renders a temporary spec containing actual values.
#
# App Platform encrypts values marked type: SECRET. The temporary rendered spec
# is deleted automatically when this script exits.

TEMPLATE_FILE=".do/app.template.yaml"
RENDERED_SPEC="$(mktemp --suffix=.yaml 2>/dev/null || mktemp)"
trap 'rm -f "${RENDERED_SPEC:-}" "${CURRENT_SPEC_JSON:-}"' EXIT

export FF_APP_NAME="$APP_NAME"
export FF_APP_REGION="$APP_REGION"
export FF_APP_INSTANCE_SIZE="$APP_INSTANCE_SIZE"
export FF_GITHUB_REPO="$GITHUB_REPO"
export FF_GITHUB_BRANCH="$GITHUB_BRANCH"
export FF_DB_CLUSTER_NAME="$DB_CLUSTER_NAME"
export FF_DB_NAME="$DB_NAME"
export FF_DB_USER="$DB_USER"
export FF_PG_VERSION="$PG_VERSION"
export FF_DISTRICT_NAME="$DISTRICT_NAME"
export FF_DISTRICT_STATE="$DISTRICT_STATE"
export FF_ADMIN_EMAIL="$ADMIN_EMAIL"
export FF_PRIVACY_CONTACT_EMAIL="$PRIVACY_CONTACT_EMAIL"
export FF_MARKET_TIME_ZONE="$MARKET_TIME_ZONE"
export FF_MARKET_CRON="$MARKET_CRON"
export FF_SESSION_SECRET="$SESSION_SECRET"
export FF_CRON_SECRET="$CRON_SECRET"
export FF_OBSERVABILITY_INGEST_SECRET="$OBSERVABILITY_INGEST_SECRET"
export FF_CREDENTIAL_ENCRYPTION_KEY="$CREDENTIAL_ENCRYPTION_KEY"
export FF_BOOTSTRAP_ADMIN_PASSWORD_HASH="$BOOTSTRAP_ADMIN_PASSWORD_HASH"

node --input-type=module - "$TEMPLATE_FILE" "$RENDERED_SPEC" <<'NODE'
import fs from "node:fs";

const [, , templateFile, outputFile] = process.argv;
let spec = fs.readFileSync(templateFile, "utf8");

const replacements = {
  "__APP_NAME__": process.env.FF_APP_NAME,
  "__APP_REGION__": process.env.FF_APP_REGION,
  "__APP_INSTANCE_SIZE__": process.env.FF_APP_INSTANCE_SIZE,
  "__GITHUB_REPO__": process.env.FF_GITHUB_REPO,
  "__GITHUB_BRANCH__": process.env.FF_GITHUB_BRANCH,
  "__DB_CLUSTER_NAME__": process.env.FF_DB_CLUSTER_NAME,
  "__DB_NAME__": process.env.FF_DB_NAME,
  "__DB_USER__": process.env.FF_DB_USER,
  "__PG_VERSION__": process.env.FF_PG_VERSION,
  "__DISTRICT_NAME__": process.env.FF_DISTRICT_NAME,
  "__DISTRICT_STATE__": process.env.FF_DISTRICT_STATE,
  "__ADMIN_EMAIL__": process.env.FF_ADMIN_EMAIL,
  "__PRIVACY_CONTACT_EMAIL__": process.env.FF_PRIVACY_CONTACT_EMAIL,
  "__MARKET_TIME_ZONE__": process.env.FF_MARKET_TIME_ZONE,
  "__MARKET_CRON__": process.env.FF_MARKET_CRON,
  "__SESSION_SECRET__": process.env.FF_SESSION_SECRET,
  "__CRON_SECRET__": process.env.FF_CRON_SECRET,
  "__OBSERVABILITY_INGEST_SECRET__": process.env.FF_OBSERVABILITY_INGEST_SECRET,
  "__CREDENTIAL_ENCRYPTION_KEY__": process.env.FF_CREDENTIAL_ENCRYPTION_KEY,
  "__BOOTSTRAP_ADMIN_PASSWORD_HASH__": process.env.FF_BOOTSTRAP_ADMIN_PASSWORD_HASH,
};

for (const [token, value] of Object.entries(replacements)) {
  if (value === undefined) {
    throw new Error(`Missing renderer value for ${token}`);
  }

  // JSON.stringify creates a safely quoted YAML string scalar.
  spec = spec.replaceAll(token, JSON.stringify(value));
}

if (/__[A-Z0-9_]+__/.test(spec)) {
  throw new Error("One or more App Platform template placeholders were not replaced.");
}

fs.writeFileSync(outputFile, spec);
NODE

success "Temporary App Platform spec rendered."

# Validate the YAML/App Platform schema before changing the application.
info "Validating the App Platform spec..."
doctl apps spec validate "$RENDERED_SPEC" >/dev/null
success "App Platform spec is valid."

# ------------------------------------------------------------------------------
# Section 11 - Create or update the App Platform application
# ------------------------------------------------------------------------------
# A first deployment requires DigitalOcean's GitHub integration to have access
# to the private repository. If App Platform cannot read the repository, this
# command will fail without changing your source repository.

if [[ -z "$APP_ID" ]]; then
  info "Creating App Platform application '$APP_NAME'..."

  set +e
  CREATE_OUTPUT="$(
    doctl apps create \
      --spec "$RENDERED_SPEC" \
      --wait \
      --format ID,DefaultIngress \
      --no-header 2>&1
  )"
  CREATE_STATUS=$?
  set -e

  if (( CREATE_STATUS != 0 )); then
    printf '%s\n' "$CREATE_OUTPUT" >&2
    die "App creation failed. If the error mentions GitHub/repository access, authorize DigitalOcean's GitHub integration for '$GITHUB_REPO' and re-run this script."
  fi

  APP_ID="$(find_app_id "$APP_NAME" || true)"
  [[ -n "$APP_ID" ]] || die "App creation completed, but the new App Platform app ID could not be found."
else
  info "Updating existing App Platform application '$APP_NAME' ($APP_ID)..."
  doctl apps update "$APP_ID" \
    --spec "$RENDERED_SPEC" \
    --update-sources \
    --wait >/dev/null
fi

success "App Platform deployment command completed."

# ------------------------------------------------------------------------------
# Section 12 - Verify deployment and print useful operational information
# ------------------------------------------------------------------------------
# DefaultIngress is DigitalOcean's generated HTTPS endpoint. The health endpoint
# also checks PostgreSQL connectivity, so a 200 response confirms both the web
# container and production database path are usable.

APP_URL="$(doctl apps get "$APP_ID" --format DefaultIngress --no-header)"
[[ -n "$APP_URL" ]] || die "Could not determine the deployed application URL."

# Some doctl versions return the hostname without a scheme.
if [[ "$APP_URL" != http://* && "$APP_URL" != https://* ]]; then
  APP_URL="https://$APP_URL"
fi

info "Checking the FutureFund health endpoint..."

HEALTH_OK=false
for _ in {1..12}; do
  if node --input-type=module - "$APP_URL" <<'NODE'
const [, , appUrl] = process.argv;
const url = new URL("/api/health", appUrl);
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  process.exit(response.ok ? 0 : 1);
} catch {
  process.exit(1);
}
NODE
  then
    HEALTH_OK=true
    break
  fi
  sleep 5
done

if [[ "$HEALTH_OK" == "true" ]]; then
  success "Health check passed."
else
  warn "The deployment exists, but /api/health did not return 2xx during this verification window."
  warn "Inspect the Runtime Logs in DigitalOcean App Platform before adding users."
fi

printf '\n'
echo "============================================================================="
echo " FutureFund deployment complete"
echo "============================================================================="
printf 'App ID:                 %s\n' "$APP_ID"
printf 'Application URL:        %s\n' "$APP_URL"
printf 'Managed DB cluster ID:  %s\n' "$DB_ID"
printf 'Managed DB cluster:     %s\n' "$DB_CLUSTER_NAME"
printf 'Application database:   %s\n' "$DB_NAME"
printf 'Bootstrap admin:        %s\n' "$ADMIN_EMAIL"
echo
echo "Useful commands:"
echo "  doctl apps get $APP_ID"
echo "  doctl apps logs $APP_ID --type run --follow"
echo "  doctl apps list-job-invocations $APP_ID --job-name market-poll"
echo "  doctl databases get $DB_ID"
echo
echo "Next checks:"
echo "  1. Open $APP_URL"
echo "  2. Sign in with the bootstrap admin account."
echo "  3. Confirm Admin Users, Teacher, Student Portfolio, and Monitoring pages."
echo "  4. Configure a market provider credential and confirm it survives a redeploy."
echo "  5. Review the first market-poll job invocation in App Platform."
echo "============================================================================="
