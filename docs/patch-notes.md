# FutureFund Classroom Patch Notes

## 2026-09-14

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
