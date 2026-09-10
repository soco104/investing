# Cloud Run Infrastructure Runbook

This package provisions a Google Cloud baseline for a small FutureFund
Classroom pilot: 75 students, 4 teachers, 2 admins, and roughly 30 concurrent
users during a U.S. Eastern 8:30 AM to 3:30 PM school day.

## What This Provisions

- Cloud Run service for the web app and API routes.
- Artifact Registry Docker repository for app images.
- Cloud SQL for PostgreSQL for durable application data.
- Secret Manager secrets for `DATABASE_URL`, `SESSION_SECRET`, and
  `CRON_SECRET`.
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
Sites/Vinext MVP. The Cloud Run package below provisions Cloud SQL PostgreSQL
because that is the natural managed relational database on Google Cloud.

Before using Cloud SQL as the production source of truth, port the data access
layer from D1/SQLite to the selected Google database driver and generate
PostgreSQL migrations. The infrastructure is ready for that target state, but
the current MVP still uses seeded/in-memory UI data for many workflows.

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

The container starts with:

```bash
npm run start:cloudrun
```

That runs:

```bash
vinext start --hostname 0.0.0.0
```

Cloud Run requires the container to listen on all interfaces and the configured
port.

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

That endpoint is not implemented yet. Add it before enabling real external
market polling. It should:

- authenticate the scheduler using the OIDC identity and/or `CRON_SECRET`;
- read active market integrations;
- call providers with the configured token placement;
- cap imported symbols at the configured limit;
- cache normalized market data;
- write integration health, RTT, and timestamped logs.

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
- Replace demo SHA-256 password checking with Argon2 or bcrypt before launch.
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
