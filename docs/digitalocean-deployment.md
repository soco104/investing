# DigitalOcean Deployment Runbook

This runbook deploys FutureFund Classroom on DigitalOcean App Platform using the
existing Dockerfile, a managed PostgreSQL database, and a scheduled App Platform
job for market polling.

## What This Provides

- App Platform web service for the FutureFund Classroom web app and API routes.
- Managed PostgreSQL database for production-shaped persistence.
- App Platform encrypted environment variables for app secrets.
- Scheduled App Platform job for `/api/market/poll`.
- Health and liveness checks using `/api/health`.
- Autoscaling baseline for a small district pilot.

## Files

- `infra/digitalocean/app.yaml`: App Platform spec template.
- `Dockerfile`: shared container image build.
- `scripts/digitalocean-market-poll.mjs`: scheduled job helper.
- `app/api/health/route.ts`: App Platform health check endpoint.

## Recommended Pilot Shape

For the initial pilot of roughly 75 students, 4 teachers, 2 admins, and about
30 average concurrent users:

- Region: `nyc`, closest DigitalOcean region to U.S. Eastern school districts.
- Web service: `apps-s-1vcpu-1gb`.
- Web instances: min `1`, max `3`.
- Database: `db-s-1vcpu-1gb` PostgreSQL for staging/pilot.
- Market polling: every 15 minutes during U.S. Eastern school hours.

Increase instance size or database tier before expanding to multiple schools or
district-wide usage.

## One-Time Setup

Install and authenticate `doctl`:

```bash
doctl auth init
```

Connect DigitalOcean App Platform to the GitHub repository from the
DigitalOcean control panel, or authorize repository access during app creation.

The app spec targets:

```text
soco104/investing
```

on branch:

```text
main
```

## Configure Secrets

Before creating a production app, edit `infra/digitalocean/app.yaml` and replace
placeholder values:

- `SESSION_SECRET`
- `CRON_SECRET`
- `OBSERVABILITY_INGEST_SECRET`
- `DIGITALOCEAN_APP_URL`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD_HASH`, if using bootstrap admin login
- `MARKET_PROVIDER_TOKENS_JSON`, if using market provider tokens on
  DigitalOcean
- `SSO_*` values, if district SSO is configured

Generate strong random values for secrets. For example:

```bash
openssl rand -base64 32
```

Generate an optional bootstrap admin password hash after dependencies are
installed:

```bash
node -e "require('bcryptjs').hash('change-me', 12).then(console.log)"
```

Important: App Platform encrypts values marked as `SECRET` on first submission.
On later updates, preserve the encrypted values from the live app spec or enter
fresh secret values intentionally.

## Create The App

From the repository root:

```bash
doctl apps create --spec infra/digitalocean/app.yaml --format ID,DefaultIngress,Created
```

After creation, copy the default ingress URL into `DIGITALOCEAN_APP_URL` in the
live App Platform environment settings or app spec. This value is used by the
scheduled market polling job to call:

```text
POST /api/market/poll
```

## Update The App

To apply later spec changes:

```bash
doctl apps update APP_ID --spec infra/digitalocean/app.yaml --format ID,DefaultIngress,Updated
```

To create a deployment from the latest connected source:

```bash
doctl apps create-deployment APP_ID --wait
```

## Runtime Commands

The web service runs:

```bash
npm run start:digitalocean
```

This runs PostgreSQL table setup through:

```bash
node scripts/cloudrun-migrate.mjs
```

then starts the Vinext server on all interfaces:

```bash
vinext start --hostname 0.0.0.0
```

The scheduled market polling job runs:

```bash
npm run do:poll
```

The helper reads `DIGITALOCEAN_APP_URL` and `CRON_SECRET`, then calls
`/api/market/poll` with the `X-FutureFund-Cron` header.

## Optional Demo Data

For a demo or staging app, run the idempotent demo seed after the app has a
working PostgreSQL connection:

```bash
npm run db:seed:demo
```

The script creates reusable demo schools, student/teacher/admin users, bcrypt
demo credentials, role assignments, permission grants, market integrations,
class simulator settings, quotes, support tickets, monitoring events, and audit
examples. It runs the production table setup first and skips without failure
when `DATABASE_URL` is not set.

Demo credentials:

- Student: `avery.johnson@example.edu` / `student-demo`
- Teacher: `elena.rivera@example.edu` / `teacher-demo`
- Admin: `sam.gordon@example.edu` / `admin-demo`

## Health Checks

App Platform is configured to check:

```text
GET /api/health
```

The endpoint returns a lightweight JSON payload with service name, status, and
timestamp.

If deployment fails health checks, confirm:

- The app listens on port `8080`.
- `run_command` is `npm run start:digitalocean`.
- `DATABASE_URL` is available.
- The migration script can connect to PostgreSQL.
- `SESSION_SECRET` is configured.

## Market Polling

The scheduled job uses:

```text
*/15 8-15 * * 1-5
```

Timezone:

```text
America/New_York
```

Provider behavior:

- `MARKET_PROVIDER_TIMEOUT_MS` defaults to `7000`.
- `MARKET_POLL_CONCURRENCY` defaults to `4` and is capped at `8`.
- Successful provider refreshes create class market snapshots.
- Ordinary `/api/market` reads are authenticated, class-scoped, and read-only.

## Credential Vault Note

The DigitalOcean spec uses encrypted App Platform environment variables for
market provider tokens:

```text
MARKET_SECRET_BACKEND=digitalocean-env
MARKET_PROVIDER_TOKENS_SECRET=do-env://MARKET_PROVIDER_TOKENS_JSON
MARKET_PROVIDER_TOKENS_JSON={}
```

`MARKET_PROVIDER_TOKENS_JSON` must be configured as an encrypted `SECRET`
environment variable in App Platform. Its value is an object keyed by the
credential ID stored in the app database. Example:

```json
{
  "market-integration-finnhub": "FINNHUB_API_KEY"
}
```

DigitalOcean encrypted environment variables are available to the app at
runtime, but the running app should not treat them as a mutable Secret Manager.
The app can read token refs such as:

```text
do-env://MARKET_PROVIDER_TOKENS_JSON#market-integration-finnhub
```

If an admin enters a brand-new token through the app while
`MARKET_SECRET_BACKEND=digitalocean-env`, token storage will fail with a clear
message. Add or rotate provider tokens through the DigitalOcean app settings or
app spec, then reference the matching credential ID from the integration. For a
full production DigitalOcean deployment that requires runtime credential
creation from the Admin portal, add an external managed vault integration.

Do not place market provider tokens directly in the App Platform spec except as
initial encrypted environment variables for temporary staging use.

## Operational Checklist

After deployment:

- Open the App Platform URL.
- Confirm `/api/health` returns `ok: true`.
- Sign in with the bootstrap admin or district SSO.
- Confirm Admin Users loads.
- Confirm Market APIs and Market Simulator pages load.
- Confirm the scheduled `market-poll` job completes.
- Check App Platform runtime logs for migration, auth, market polling, and
  integration errors.
- Confirm Monitoring pages show timestamped data.

## Official References

- DigitalOcean App Spec Reference:
  https://docs.digitalocean.com/products/app-platform/reference/app-spec/
- `doctl apps create`:
  https://docs.digitalocean.com/reference/doctl/reference/apps/create/
- App Platform health checks:
  https://docs.digitalocean.com/products/app-platform/how-to/manage-health-checks/
