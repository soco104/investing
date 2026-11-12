# FutureFund Classroom Patch Notes

Newest updates are at the top. Each entry is headed with its version and date.

## v0.2.6 — 2026-11-12

### Student Profiles and Portfolios

- Each student now has **one profile that keeps a portfolio for every class
  they're assigned to, by school year**. Past years stay as **read-only
  records** students can look back on, building a multi-year record.
- Portfolios are **saved**: cash, stocks, trades, and allocation targets stay
  after a refresh or sign-out. A new class portfolio starts with the class's
  starting cash.
- The Portfolio page shows the real portfolio value and history, and a new
  **Your portfolios** table lists every portfolio by school year with its
  value, gain or loss, and trades. Click **View** to open an older one.
- Teachers and admins see a **Practice** portfolio in the Student view.

### Trading

- On the Market page, use **−** and **+** to change the number of shares by
  one, or type an amount, then click **Buy** or **Sell**. The trade controls
  now sit next to the price.
- Prices are the class's simulated market prices, and every trade is checked:
  you can't spend more cash than you have or sell shares you don't own.
- Classes for **grade 10 and above** can trade **fractional shares** (up to 4
  decimal places). Younger grades trade whole shares.

### For Teachers

- **Request portfolio reset** (Teacher dashboard → Portfolio resets): choose a
  student in your class and give a reason. An admin approves or denies it, and
  you get an email with the outcome.

### For Admins

- **School year** (Admin portal): set the first and last day of the school
  year. Default: August 28 – June 1.
- **Grade level** (Market Simulator page): set each class's grade. It's read
  from names like "7th Grade Finance A" automatically; set it for classes like
  "High School Personal Finance". Grade 10+ allows fractional shares.
- **Portfolio corrections** now apply to a chosen student by email, showing
  the cash before and after.
- **Portfolio reset requests** from teachers appear on the Portfolio
  corrections page to approve or deny.

## v0.2.5 — 2026-11-12

No changes to how the app works in this update. This update adds automatic
testing, so problems are caught before they reach the live site.

### Testing and Quality

- **Every pull request is now tested automatically** before it can be merged:
  code checks, unit tests, and browser tests that sign in and click through
  the app like a real user, against a real database.
- **A test report is posted on every pull request**, showing what was tested
  and what passed or failed, with screenshots of every browser test as
  evidence.
- **Bugs are now tracked** as issues on GitHub (label: `bug`), each linked to
  the version that fixed it. Six bugs found in v0.2.0–v0.2.4 have been logged
  (all fixed).
- **Test report for v0.2.0–v0.2.4** with evidence and the bug list:
  `docs/test-reports/2026-11-12-v0.2.0-v0.2.4.md`.
- The new automatic tests already caught one problem on their first run: a
  test that only passed on some computers (issue #17, fixed).

## v0.2.4 — 2026-11-12

### Signing In and Out

- **You now stay signed in when you refresh the page**, for up to 8 hours
  after signing in.
- **Sign out** now fully ends your session, so refreshing afterward shows the
  login page. On shared classroom computers, remember to sign out.

### Privacy Posture

- The Privacy posture page now **saves**. Choose a posture, enter the privacy
  contact's email, and click **Save**. The setting stays in place after a
  refresh, and each change is recorded in the audit log.

## v0.2.3 — 2026-11-12

### Email

- FutureFund can now send email. In the Admin portal, open **Email** to see
  whether email is set up, send yourself a test email, and see recent emails
  and whether each was sent. Message contents are never stored.
- **Operators:** email needs a Resend account with a verified domain. Add
  `RESEND_API_KEY` (encrypted) and `EMAIL_FROM` in DigitalOcean (App →
  Settings → web → Environment Variables). Until then, no email is sent.
  Setup steps are in the Admin Guide, section 15a.

### Password Resets

- Password resets now work end to end. When an admin sends a reset, the user
  gets an email with a link to the new **Set a new password** page. The link
  works for 30 minutes and only once, and setting a new password signs the
  user out of other devices.
- The reset popup now tells the admin whether the email went out, and says so
  plainly if no user has that email.

### Fixes

- The demo student account `maya.patel@example.edu` now requires the demo
  security question, like the other demo accounts.
- The User Manual and Admin Guide now say correctly that quest import/export
  does not yet store quests on the server.

### Release Process

- Updates in the 0.2 series all use patch numbers (0.2.3, 0.2.4, …). The next
  minor version, 0.3.0, is saved for a milestone.

## v0.2.2 — 2026-11-12

No changes to how the app works in this update. The User Manual and Admin
Guide were reviewed against the app and corrected.

### User Manual and Admin Guide

- **New "What Is Saved in This Version" section** in both guides. Admin portal
  actions are saved; student trades, messages, discussions, Quest Studio
  edits, the teacher's Market page controls, and the Privacy posture page are
  not saved yet and reset when the page is refreshed. Student and teacher
  dashboards and the Monitoring pages show sample data.
- **Refreshing the page signs you out** in this version. Both guides now say
  so.
- **Demo login** is documented: the demo super user, the email dropdown, the
  security question and 15-minute lockout, and the `DEMO_LOGINS` and
  `DEMO_SECURITY_ANSWER` settings in DigitalOcean.
- **Assume role** menu for switching between the Student, Teacher, and Admin
  views is documented.
- **Corrected:**
  - Teachers can't yet change a class's simulation mode, volatility, starting
    cash, or symbols. Admins do this on the Market Simulator page.
  - Password reset requests are saved, but users can't complete a reset yet:
    no email is sent and there is no reset page.
  - Permission changes record a generic reason automatically.
  - Moderation, retention, backup, and incident tools are server-only for now,
    with no screens.
  - The database note is updated: the app runs on PostgreSQL.
- Both guides now state the version they describe (0.2.2).

### Release Process

- Any change to how the app works must now update the User Manual and Admin
  Guide in the same update.

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
