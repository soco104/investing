# Cloud Run Infrastructure Runbook

This package provisions a Google Cloud baseline for a small FutureFund
Classroom pilot: 75 students, 4 teachers, 2 admins, and roughly 30 concurrent
users during a U.S. Eastern 8:30 AM to 3:30 PM school day.

## What This Provisions

- Cloud Run service for the web app and API routes.
- Artifact Registry Docker repository for app images.
- Cloud SQL for PostgreSQL for durable application data.
- Secret Manager secrets for `DATABASE_URL`, `SESSION_SECRET`, `CRON_SECRET`,
  and market provider tokens.
- Cloud Scheduler job for school-day market polling.
- Runtime service account with Cloud SQL Client and Secret Accessor access.
- Scheduler service account with Cloud Run Invoker access.
- Required Google APIs for Cloud Run, Cloud Build, Artifact Registry, Cloud SQL,
  Secret Manager, Cloud Scheduler, Cloud Logging, and Cloud Monitoring.

## Pilot Sizing

Recommended starting values:

- Region: `us-east1`
- Cloud Run CPU: `1`
- Cloud Run memory: `512Mi`
- Cloud Run concurrency: `40`
- Cloud Run min instances: `1`
- Cloud Run max instances: `5`
- Cloud SQL tier: `db-f1-micro` for demo/pilot, upgrade to a shared-core or
  dedicated tier before a district-wide launch.
- Scheduler: every 15 minutes during U.S. Eastern school hours.

For 30 average concurrent users, the app should fit comfortably in this shape
as long as market data is polled/cached in the backend and not fetched from
external providers on every page load.

## Important App Note

The current app schema is SQLite/D1-shaped because it began as a Cloudflare
Sites/Vinext MVP. The Cloud Run package provisions Cloud SQL PostgreSQL because
that is the natural managed relational database on Google Cloud.

Cloud Run startup now runs `scripts/cloudrun-migrate.mjs`, which creates the
PostgreSQL tables needed by authentication, admin mutations, observability,
market integrations, retention requests, backups, incidents, and audit logs.
The local/Sites D1 schema remains in the repo for prototype and hosted Sites
workflows.

The remaining production data work is to continue moving student, teacher,
quest, portfolio, and messaging reads from frontend seed data to server-backed
queries.

## Files Added

- `Dockerfile`: production container for Cloud Run.
- `.dockerignore`: excludes local build and dependency artifacts.
- `cloudbuild.yaml`: builds, pushes, and deploys the container image.
- `infra/cloudrun/*.tf`: Terraform infrastructure definition.
- `infra/cloudrun/terraform.tfvars.example`: starter variables.

## One-Time Google Cloud Setup

Install and authenticate the Google Cloud CLI and Terraform locally, then set
your target project:

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud auth application-default login
```

Give the operator account enough access to create the baseline resources:

- Project IAM Admin, or equivalent scoped IAM permissions.
- Cloud Run Admin.
- Cloud SQL Admin.
- Secret Manager Admin.
- Artifact Registry Admin.
- Cloud Scheduler Admin.
- Service Account Admin.
- Service Usage Admin.

## Provision Infrastructure

Copy and edit the Terraform variables:

```bash
cd infra/cloudrun
cp terraform.tfvars.example terraform.tfvars
```

Set:

- `project_id`
- `region`

For the first apply, `image` can be omitted. Terraform defaults to Google's
public Cloud Run hello image so the Artifact Registry repository and Cloud Run
service can be created before the first FutureFund image exists.

Run Terraform:

```bash
terraform init
terraform plan
terraform apply
```

Terraform outputs the Cloud Run URL, Artifact Registry repository, service
account, and Cloud SQL connection name.

## Build And Deploy

Build and deploy through Cloud Build:

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions _REGION=us-east1,_SERVICE_NAME=futurefund-classroom,_REPOSITORY=futurefund
```

The build creates an image at:

```text
us-east1-docker.pkg.dev/PROJECT_ID/futurefund/futurefund-classroom:SHORT_SHA
```

Then it deploys that image to the Cloud Run service.

If Terraform manages the service after this first deployment, update
`infra/cloudrun/terraform.tfvars` with the new image URL and run:

```bash
terraform apply
```

## Runtime Environment

Cloud Run receives:

- `NODE_ENV=production`
- `PORT=8080`, supplied by the container environment
- `DATABASE_URL`, from Secret Manager
- `SESSION_SECRET`, from Secret Manager
- `CRON_SECRET`, from Secret Manager
- `OBSERVABILITY_INGEST_SECRET`, from Secret Manager
- `GOOGLE_CLOUD_PROJECT`, from Terraform
- `MARKET_PROVIDER_TOKENS_SECRET`, the provisioned Secret Manager resource for
  server-side market API tokens
- `SSO_AUTHORIZATION_URL`, optional district OIDC authorization endpoint
- `SSO_CLIENT_ID`, optional district OIDC client ID
- `SSO_REDIRECT_URI`, optional registered OIDC redirect URI
- `SSO_SCOPE`, defaults to `openid email profile`
- `BOOTSTRAP_ADMIN_EMAIL`, optional first admin email
- `BOOTSTRAP_ADMIN_PASSWORD_HASH`, optional bcrypt hash for first admin
- `MARKET_PROVIDER_TIMEOUT_MS`, optional provider GET timeout, default `7000`
- `MARKET_POLL_CONCURRENCY`, optional polling parallelism, default `4`, capped
  at `8`

Generate an optional bootstrap admin password hash after installing
dependencies:

```bash
node -e "require('bcryptjs').hash('change-me', 12).then(console.log)"
```

The container starts with:

```bash
npm run start:cloudrun
```

That runs:

```bash
node scripts/cloudrun-migrate.mjs && vinext start --hostname 0.0.0.0
```

Cloud Run requires the container to listen on all interfaces and the configured
port.

## Optional Demo Data

For a staging or district demo environment, seed the PostgreSQL database after
the service has a valid `DATABASE_URL`:

```bash
npm run db:seed:demo
```

The seed is safe to rerun. It creates demo schools, users, bcrypt credentials,
roles, permissions, integrations, class market simulator configs, quotes,
support tickets, privacy posture, monitoring records, and audit examples.

Demo credentials:

- Student: `avery.johnson@example.edu` / `student-demo`
- Teacher: `elena.rivera@example.edu` / `teacher-demo`
- Admin: `sam.gordon@example.edu` / `admin-demo`

## Market Polling

Terraform creates a Cloud Scheduler job:

```text
*/15 8-15 * * 1-5
```

Timezone:

```text
America/New_York
```

Target endpoint:

```text
POST /api/market/poll
```

The endpoint is implemented at `/api/market/poll`. It:

- validates `X-FutureFund-Cron` against `CRON_SECRET`;
- reads active market integrations from the production database;
- resolves provider tokens server-side from Secret Manager;
- calls providers through the backend adapter;
- times out slow provider GET calls;
- polls integrations with bounded concurrency;
- caps imported symbols at the configured limit;
- writes integration health and failure events.
- creates class market snapshots after successful provider refresh events.

The student-facing `/api/market` route is read-only. It requires
authentication, scopes results to the user's class access, and does not create
database snapshots on ordinary page reads.

## Credential Vault

Terraform provisions a dedicated `MARKET_PROVIDER_TOKENS_SECRET` secret with an
initial empty JSON payload. The Cloud Run service account can read that secret
and add new versions, but it does not receive project-wide Secret Manager admin
rights.

The app stores only credential metadata in Cloud SQL. Secret values are written
as new versions in Secret Manager and referenced from the database by opaque
credential IDs. This is the shared path for market API tokens now and should be
used for SSO client secrets, webhook signing secrets, and delivery provider
credentials as those integrations move into production.

## Authentication And Ingest Protection

Password login uses persisted credentials when `DATABASE_URL` is configured and
keeps demo auth disabled in production unless `ALLOW_DEMO_AUTH=true` is set
explicitly. District SSO can start an OIDC redirect when the `SSO_*` variables
are configured; callback token exchange and assertion validation must be matched
to the district identity provider before live SSO rollout.

Observability write endpoints require `OBSERVABILITY_INGEST_SECRET` in
production. Trusted workers or frontend collectors must send that value in the
`X-FutureFund-Ingest` header.

## Logging And Monitoring

Use Google Cloud Logging and Cloud Monitoring for the platform layer. The app
already has MVP observability hooks for:

- app error events;
- performance events;
- integration health;
- OTEL-ready span metadata;
- timestamped downloadable logs.

Recommended alert policies:

- Cloud Run 5xx rate above 2 percent for 5 minutes.
- p95 request latency above 1 second for 10 minutes.
- Cloud SQL CPU above 70 percent for 15 minutes.
- Cloud SQL storage above 80 percent.
- Scheduler market poll failures.
- Integration health degraded for two consecutive polls.

## Security Checklist

- Keep market API tokens in Secret Manager, never in client-side state.
- Use bcrypt hashes for production credentials. Legacy SHA-256 hashes are only
  accepted for existing demo/bootstrap transition records and should be rotated.
- Add server-side authorization checks for Student, Teacher, and Admin routes.
- Configure district SSO through SAML or OIDC before school production use.
- Use least-privilege service accounts for Cloud Run and Scheduler.
- Keep Cloud SQL deletion protection on for production.
- Restrict Cloud Run ingress or put it behind Identity-Aware Proxy if the
  district requires private access only.
- Keep audit logs for account changes, role changes, password resets, and
  portfolio corrections.

## Operations Checklist

- Verify Cloud Run revision health after each deploy.
- Confirm login, Admin Users, Teacher Active Students, Student Portfolio, and
  Monitoring pages.
- Run database migrations before traffic is shifted to a schema-dependent
  revision.
- Confirm the Scheduler job does not create duplicate side effects; Cloud
  Scheduler uses at-least-once delivery.
- Review Cloud SQL backups and point-in-time recovery settings.
- Export logs for support cases from the Monitoring Integration Health page.

## Official References

- Cloud Run service Terraform: https://registry.terraform.io/providers/hashicorp/google/latest/docs/resources/cloud_run_v2_service
- Cloud Run container runtime contract: https://docs.cloud.google.com/run/docs/container-contract
- Cloud Run secrets: https://docs.cloud.google.com/run/docs/configuring/services/secrets
- Cloud Scheduler overview: https://docs.cloud.google.com/scheduler/docs/overview
- Scheduled Cloud Run invocations: https://docs.cloud.google.com/run/docs/triggering/using-scheduler
