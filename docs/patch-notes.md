# FutureFund Classroom Patch Notes

Newest updates are at the top. Each entry is headed with its version and date.

## v0.2.1 — 2026-11-12

No changes to how the app works in this update; the version label at the
bottom of each page now reads v0.2.1.

### Roadmap

- Added a roadmap (`docs/roadmap.md`) of future goals being evaluated:
  - **Teacher life events:** simple one-click "wrenches" that hit a student's
    personal finances (car repair, hours cut, tax refund), testing whether
    their portfolio can absorb real-life surprises. Each event sends the
    student an Inbox debrief to write a report on, which the teacher grades
    with a rubric.
  - **School branding:** admins match the portal to their school colors (color
    picker or exact color codes) and upload the school logo.

### Release Process

- Every update now gets a version number and an entry here, newest at the
  top, including small fixes and process changes.
- The only exception is documentation-only edits (like the roadmap). Changes
  to the **User Manual** or **Admin Guide** always get a version and notes.
- Plans for upcoming changes include a draft of their patch notes, so what
  users will be told is agreed before work starts.

## v0.2.0 — 2026-11-12

### Demo Login

- Added a demo super user, `demo-user@demo.edu`, with every Admin permission.
  Use **Assume role** after signing in to switch between the Student, Teacher,
  and Admin views.
- The login page's email field now has a dropdown that fills in the demo
  login. The separate "Demo accounts" box was removed.
- Demo accounts must answer a security question after their password. The
  answer is checked on the server against the encrypted `DEMO_SECURITY_ANSWER`
  setting, and five wrong answers lock the account for 15 minutes.
- Fixed demo logins failing on the live site: the demo emails now match the
  database, and the demo users are loaded on startup when `DEMO_LOGINS=true`.

### Versioning

- The app now has version numbers. The current version shows in small text at
  the bottom of every page.
- Added `CHANGELOG.md` and an automatic GitHub release for each new version.

## v0.1.0 — 2026-09-14

### Admin User Management

- Added Admin Users edit dialog for modifying created users.
- Added audited `user.modified` API path for user profile, role, class, email,
  alias, and enabled-state changes.
- Added production persistence support for user updates and role reassignment.
- Added automated coverage for audited admin user modifications.

### Student and Teacher Market Page

- Added a student/teacher Market page with a black-and-green quote table,
  classroom news by symbol, and green/red price movement treatment.
- Added simulated student buy/sell actions that update portfolio cash, stock
  holdings, and recent portfolio activity.
- Added a `Stocks` information box to student profiles so holdings are visible
  after simulated trades.
- Added teacher price raise/lower controls for classroom market instruction.
- Added the initial Strait of Hormuz blockade scenario, applying a large
  oil-price shock to teacher-selected symbols.

### Demo Data

- Added `npm run db:seed:demo` for idempotent PostgreSQL demo data loading.
- Seeded demo schools, student/teacher/admin users, bcrypt credentials, roles,
  permissions, market integrations, class market simulator settings, quotes,
  support tickets, monitoring records, privacy posture, SSO draft settings,
  backup/incident examples, and admin audit examples.
- Documented demo seeding in the README, Cloud Run runbook, DigitalOcean
  runbook, and Admin Guide.

### Finnhub Market Adapter

- Added a Finnhub-specific market provider adapter for `/api/v1/quote`.
- Mapped Finnhub quote fields into the normalized class market quote cache.
- Added query-token support for Finnhub and header fallback through
  `X-Finnhub-Token`.
- Added optional US symbol discovery through `/stock/symbol?exchange=US` when
  allowed symbols is blank.
- Added automated tests for Finnhub allowed-symbol imports, blank-symbol
  discovery, and token-header fallback.

### DigitalOcean Secret Backend

- Added provider-aware market credential storage for DigitalOcean App Platform
  using AES-256-GCM encrypted PostgreSQL records.
- Added `MARKET_SECRET_BACKEND=postgres-encrypted`,
  `CREDENTIAL_ENCRYPTION_KEY`, and
  `pg-encrypted://credential_secret_values#credential-id` secret refs.
- Added `credential_secret_values` migration support.
- Updated DigitalOcean deployment config to supply the credential encryption
  key as an encrypted runtime environment variable.
- Added tests proving encrypted PostgreSQL token writes do not store plaintext
  and can be read back through opaque refs.

### DigitalOcean Deployment

- Added a DigitalOcean App Platform deployment spec.
- Added `/api/health` for platform health and liveness checks.
- Added `npm run start:digitalocean` for DigitalOcean container startup.
- Added `npm run do:poll` and `scripts/digitalocean-market-poll.mjs` for
  scheduled market polling.
- Added a DigitalOcean deployment runbook covering App Platform, managed
  PostgreSQL, secrets, scheduled jobs, health checks, and operational checks.

### Market Simulator Foundation

- Added a central class market simulation engine.
- Added class-scoped market configs for simulation mode, scenario,
  volatility, starting cash, teacher controls, allowed asset types, and allowed
  symbols.
- Added a Market Simulator page in the Admin portal.
- Added `/api/admin/class-market` for viewing and updating class market
  settings.
- Updated `/api/market` to return central simulator output rather than only raw
  quote-cache data.
- Added `class_market_configs` and `class_market_snapshots` migration support
  for Cloud Run PostgreSQL startup.
- Added audit action support for `class_market.updated`.

### Stability and Security Fixes

- Required authentication for `/api/market`.
- Scoped market reads so students can only read their own class market.
- Added multi-class auth scope support through `classNames`.
- Allowed teachers to manage/read assigned class markets rather than only their
  primary class.
- Stopped `/api/market` GET requests from writing snapshots.
- Moved class market snapshot writes to the scheduled market polling path.
- Changed Admin Market Simulator controls to draft locally and persist only
  when `Save` is clicked.

### Polling and Performance

- Added provider GET timeout support through `MARKET_PROVIDER_TIMEOUT_MS`.
- Added bounded polling concurrency through `MARKET_POLL_CONCURRENCY`.
- Added test coverage for provider timeout behavior.
- Added test coverage for bounded polling concurrency.

### Quest Library

- Added row-click details popup for the Admin System Quest Library.
- Quest detail popup shows objective, status, market settings, scoring rules,
  visibility, assignment/submission metrics, and review flags.

### Validation

- `npm.cmd run lint` passed.
- `npm.cmd test` passed with 35 tests.
- `npm.cmd run build` passed.
