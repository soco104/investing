# FutureFund Classroom

FutureFund Classroom is a gamified financial literacy MVP for school districts.
Students practice budgeting, investing, retirement planning, and risk decisions
with simulated portfolios. Teachers and district leaders get classroom progress
views that focus on learning evidence instead of real-money trading outcomes.

## Version 1 Scope

- Web-first student dashboard for simulated portfolio learning
- Student portfolio page with overview metrics, recent simulated trade/change
  history, holdings mix, and allocation target changes
- Student/teacher Market page with a black-and-green quote table, price movement
  coloring, classroom news, simulated student buy/sell actions, and a Stocks
  profile box
- Student and teacher profile pages with aliases, profile search, portfolio
  snapshots for students, teacher class/quest summaries, teacher inboxes, and
  message links
- Teacher view for assignments, roster progress, concept mastery, and quest
  authoring
- User-level text-only inbox for direct teacher-student and approved peer
  messages with a first-pass profanity filter
- Classroom discussion board for shared quest conversations
- Admin portal for user management, permissions, support routing, market API
  setup, password resets, portfolio corrections, template governance, and
  scoring policy controls
- Admin user management with class and role filters, profile links, enabled
  status, visible permission levels, and CSV user import. CSV uploads accept
  firstName, lastName, email, role, class, and alias columns
- Admin permission management for student profile access, teacher portal access,
  Admin rights, quest import/export, and portfolio corrections
- Admin support case tracking with new case creation and pending support/user
  statuses
- Admin monitoring page for recent errors, slow requests, integration health,
  and OTEL-ready trace/span hooks
- Admin drill-in pages for school setup, market data integrations, and district
  privacy posture selection
- Central market simulator with class-scoped market contexts, teacher/admin
  configuration controls, authenticated class-market access, and scheduled
  snapshot generation
- Teacher market controls for class-safe price raises/lowers and the initial
  Strait of Hormuz scenario, applying oil-price shocks to teacher-selected
  symbols
- Admin school setup captures school, district, state, class count, and student
  count
- Admin market integrations capture provider, endpoint, optional token,
  polling cadence, target class, backend GET test status, and class-level
  cleanup controls. Leaving allowed symbols blank permits up to 200 imported
  symbols for the MVP
- Teachers and Admins can export and import learning quest templates as JSON
- Mock market data API for classroom-safe quote behavior
- Observability APIs for app error events and performance events, plus a
  frontend error boundary and browser timing reporter
- Initial database schema for districts, schools, classrooms, students,
  simulated portfolios, holdings, lessons, teacher-created quests, hidden
  scoring rules, market parameters, assignments, submissions, user-owned inbox
  threads, classroom discussion rooms, message moderation status, admin users,
  role assignments, support tickets, market data integrations, password reset
  requests, privacy posture settings, simulated portfolio activity,
  user permission grants, class-level market integration assignments, portfolio
  correction audits, app error events, performance events, OTEL span events,
  and lesson progress

## Development

Install dependencies:

```bash
npm install
```

Run the local app:

```bash
npm run dev
```

Seed a production-shaped PostgreSQL database with reusable demo data:

```bash
DATABASE_URL="postgres://..." npm run db:seed:demo
```

The seed includes demo schools, users, bcrypt credentials, permissions,
integrations, class market simulator settings, quotes, support cases,
monitoring events, and audit examples. It is idempotent and skips cleanly when
`DATABASE_URL` is not set.

Build the app:

```bash
npm run build
```

Lint the app:

```bash
npm run lint
```

## Cloud Run Infrastructure

Google Cloud Run packaging and provisioning instructions live in
[`docs/cloud-run-infrastructure.md`](docs/cloud-run-infrastructure.md). The
package includes a `Dockerfile`, `cloudbuild.yaml`, and Terraform under
`infra/cloudrun/` for the small school pilot infrastructure baseline.

## DigitalOcean Deployment

DigitalOcean App Platform deployment instructions live in
[`docs/digitalocean-deployment.md`](docs/digitalocean-deployment.md). The
package includes an App Platform spec under `infra/digitalocean/`, the shared
`Dockerfile`, a health endpoint, and a scheduled market polling job helper.

## Admin Guide

Admin operation and configuration guidance lives in
[`docs/admin-guide.md`](docs/admin-guide.md). It covers schools, users,
permissions, support, monitoring, market integrations, privacy posture,
password resets, portfolio corrections, and learning quest import/export.

## User Manual

Day-to-day usage guidance for students, teachers, and admins lives in
[`docs/user-manual.md`](docs/user-manual.md).

## Testing

```bash
npm run lint                 # ESLint
npm run typecheck:baseline   # no new TypeScript errors
npm test                     # unit tests (Vitest)
DATABASE_URL=postgres://postgres@127.0.0.1:5432/futurefund_test npm run test:e2e
                             # browser tests (Playwright) against PostgreSQL
```

The browser tests reset the demo data in the database they're given, so use a
scratch database. Results go to `playwright-report/` (open `index.html` for
screenshots of every test).

All of these run automatically on every pull request, and a test report is
posted on the pull request. Bugs are tracked as GitHub issues with the `bug`
label. Past test reports are in [`docs/test-reports/`](docs/test-reports/).

## Patch Notes

Implementation history and release notes live in
[`docs/patch-notes.md`](docs/patch-notes.md).

## Roadmap

Future-state goals under evaluation live in [`docs/roadmap.md`](docs/roadmap.md).

## Product Guardrails

- Simulated money only in the MVP
- No real trades, bank transfers, brokerage accounts, or financial advice
- Designed for student privacy workflows expected by districts
- Market data should be routed through a provider adapter before production use
- Student-facing quest screens should only expose scoring rules that a teacher
  or system administrator has explicitly made visible
- Messaging starts as text-only communication with profanity blocking and
  moderation fields in the data model
- Admin changes that affect access or simulated portfolio data should carry an
  audit reason

## License

This repository includes the GNU General Public License v3.0 in `LICENSE`.
