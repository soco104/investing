# FutureFund Classroom Patch Notes

## 2026-09-14

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

