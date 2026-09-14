# FutureFund Classroom — DigitalOcean Deployment Package

This package adapts the current `soco104/investing` repository for a small
DigitalOcean production/pilot deployment.

## What the package adds

- `deploy-digitalocean.sh` — interactive, heavily commented bootstrap script.
- `.do/app.template.yaml` — safe-to-commit App Platform spec template.
- `scripts/digitalocean-migrate.mjs` — reuses the existing PostgreSQL migration
  and adds the encrypted credential-vault table.
- `scripts/market-poll.mjs` — scheduled App Platform job helper.
- `app/api/health/route.ts` — application + PostgreSQL readiness check.
- `lib/server/secrets.ts` — preserves Google Secret Manager support and adds an
  AES-256-GCM encrypted PostgreSQL credential store for DigitalOcean.

## Architecture

```text
GitHub (private repo)
        |
        v
DigitalOcean App Platform
  |-- web service (Dockerfile, 1 vCPU / 1 GiB)
  |-- scheduled market-poll job
  |
  +--> DigitalOcean Managed PostgreSQL
```

The existing Dockerfile is retained. App Platform overrides the run command to:

```bash
node scripts/digitalocean-migrate.mjs && \
  ./node_modules/.bin/vinext start --hostname 0.0.0.0
```

## Before running the deployment script

### 1. Apply these files to the repository

Copy this package's files into the root of your FutureFund checkout, preserving
the directory structure.

`lib/server/secrets.ts` intentionally replaces the existing file.

Review the changes with:

```bash
git diff
```

Then commit them to a branch or `main` before deployment. App Platform builds
from GitHub, so the DigitalOcean-specific files must exist in the remote branch
you tell the script to deploy.

### 2. Install `doctl`

Install the current DigitalOcean CLI and make sure `doctl` is in PATH.

Verify:

```bash
doctl version
```

The bootstrap script will run `doctl auth init` if no working authentication
context exists.

### 3. Authorize DigitalOcean to read the private GitHub repository

The ChatGPT GitHub connection does **not** grant DigitalOcean access.

In DigitalOcean App Platform, connect GitHub and authorize the repository:

```text
soco104/investing
```

You can authorize only this repository if you do not want DigitalOcean to see
other repositories.

### 4. Run from the repository root

```bash
chmod +x deploy-digitalocean.sh
./deploy-digitalocean.sh
```

On Windows, run the Bash script from WSL or a compatible Bash environment.

## What the script creates

By default:

- App Platform app: `futurefund-classroom`
- Web service: 1 shared vCPU / 1 GiB fixed
- Managed PostgreSQL: 1 vCPU / 1 GiB
- Database: `futurefund`
- Database user: `futurefund_app`
- Scheduled job: every 15 minutes during the configured weekday school window

The script shows the settings and asks for confirmation **before creating
billable resources**.

## Secrets and credentials

The script generates:

- `SESSION_SECRET`
- `CRON_SECRET`
- `OBSERVABILITY_INGEST_SECRET`
- `CREDENTIAL_ENCRYPTION_KEY`

The first three are normal application security secrets.

`CREDENTIAL_ENCRYPTION_KEY` is different: it encrypts provider credentials
stored in PostgreSQL. Do not casually rotate or delete this key. Existing
credential rows cannot be decrypted without it.

On repeat deployments, the script attempts to reuse the existing App Platform
encrypted secret values instead of replacing them.

## Market-provider credential storage

The original application used:

- Google Secret Manager in Cloud Run.
- An in-memory map everywhere else.

The in-memory fallback is not safe for DigitalOcean production because tokens
would disappear on restart.

The updated `lib/server/secrets.ts` chooses the backend in this order:

1. `GOOGLE_CLOUD_PROJECT` set → existing Google Secret Manager behavior.
2. `DATABASE_URL` set → AES-256-GCM encrypted PostgreSQL credential store.
3. Neither set → local in-memory development store.

This keeps the existing Google path working while making DigitalOcean durable.

## Health check

App Platform checks:

```text
GET /api/health
```

A `200` means:

- the web process is running, and
- PostgreSQL answered a `select 1`.

A database outage produces `503`.

## Expected starter cost

As of September 2026, the package defaults roughly to:

- App Platform fixed 1 vCPU / 1 GiB service: about **$10/month**
- Managed PostgreSQL 1 vCPU / 1 GiB: about **$15.15/month**
- Scheduled job: usage-billed only while each invocation is running

That places the basic pilot around **$25–26/month**, before optional extras or
future scaling. Always check current DigitalOcean pricing before deploying.

## Re-running the script

The deployment script is intentionally idempotent by resource name:

- existing DB clusters are reused,
- existing logical databases/users are reused,
- existing App Platform apps are updated,
- existing encrypted app secrets are reused when readable from the app spec.

The bootstrap admin migration uses `on conflict ... do nothing`; changing the
bootstrap password on a later run does not automatically reset an existing
admin account.

## Useful commands after deployment

```bash
# App details
doctl apps list
doctl apps get APP_ID

# Follow runtime logs
doctl apps logs APP_ID --type run --follow

# Scheduled job history
doctl apps list-job-invocations APP_ID --job-name market-poll

# Database status
doctl databases list
doctl databases get DATABASE_CLUSTER_ID
```

## Production follow-ups

Before a real district production rollout, the repository's own infrastructure
notes still identify remaining work such as moving all student/teacher/quest/
portfolio/messaging reads off frontend seed data and into server-backed
persistence.

The deployment package gets the current MVP onto a durable hosted production
shape; it does not change that product-readiness work.
