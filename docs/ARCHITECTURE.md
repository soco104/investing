# FutureFund Classroom — Architecture and Codebase Guide

This is the handoff document for a developer joining the project. It explains
how the system is built, how requests flow through it, how it is deployed and
networked, and where everything lives in the code.

- **Describes:** v0.2.15 (`package.json`), November 2026
- **Live hosting:** DigitalOcean App Platform plus Managed PostgreSQL
- **Repo:** `soco104/investing`. Merging to `main` deploys to the live site.

Related docs: [`CLAUDE.md`](../CLAUDE.md) (contribution rules: versioning,
testing, PRs), [`docs/roadmap.md`](roadmap.md) (planned work),
[`docs/admin-guide.md`](admin-guide.md) and [`docs/user-manual.md`](user-manual.md)
(product behavior), [`docs/digitalocean-deployment.md`](digitalocean-deployment.md)
(deploy runbook).

---

## Contents

1. [What the app is](#1-what-the-app-is)
2. [Tech stack](#2-tech-stack)
3. [System architecture](#3-system-architecture)
4. [Network and deployment](#4-network-and-deployment)
5. [Repository layout](#5-repository-layout)
6. [Frontend](#6-frontend)
7. [Backend: API routes and server modules](#7-backend-api-routes-and-server-modules)
8. [Authentication, sessions and permissions](#8-authentication-sessions-and-permissions)
9. [Key flows](#9-key-flows)
10. [The market simulator](#10-the-market-simulator)
11. [Data model](#11-data-model)
12. [Configuration and secrets](#12-configuration-and-secrets)
13. [Testing, CI and releases](#13-testing-ci-and-releases)
14. [Local development](#14-local-development)
15. [Known quirks and technical debt](#15-known-quirks-and-technical-debt)
16. [How to add a feature](#16-how-to-add-a-feature)

---

## 1. What the app is

FutureFund Classroom is a gamified financial literacy web app for grades 6–12.
Students trade **simulated** stocks in class portfolios, complete teacher-made
**learning quests**, and message teachers and classmates. Teachers run their
class's market (pause it, speed it up, push prices with scenarios), assign and
grade quests, and moderate messages. Admins manage users, permissions, schools,
market data integrations, credentials, email and privacy settings.

No real money is involved. Real market data is optional: an admin can connect a
provider such as Finnhub, and otherwise a built-in deterministic simulator
generates prices.

Three roles: **Student**, **Teacher** and **Admin**. Finer permissions sit on
top of the role (section 8).

## 2. Tech stack

| Layer | Technology | Notes |
|---|---|---|
| Language | TypeScript 5.9 | `strict`; a baseline file caps existing type errors (section 13) |
| UI | React 19, Next.js 16 App Router conventions | One large client page (`app/page.tsx`) |
| Build/runtime | **vinext** 1.0 beta (Vite 8) | Next.js-compatible framework on Vite. `vinext build` / `vinext start` |
| Components | shadcn/ui (Radix UI + Base UI), Tailwind CSS 4 | Primitives in `components/ui/` |
| Charts / icons | Recharts, lucide-react | |
| Database | PostgreSQL 16 | Raw SQL via the `postgres` (postgres.js) driver |
| Passwords | bcryptjs (12 rounds) | Legacy SHA-256 hashes still verify (demo seed) |
| Email | Resend HTTPS API | DigitalOcean blocks outbound SMTP |
| Market data | Finnhub or any JSON GET endpoint | Optional; simulator otherwise |
| Unit tests | Vitest | `tests/*.test.ts` |
| Browser tests | Playwright (Chromium) | `tests/e2e/*.spec.ts`, needs PostgreSQL |
| Hosting | DigitalOcean App Platform (Docker) | Google Cloud Run Terraform also exists, not in use |
| CI/CD | GitHub Actions + DO deploy-on-push | |

Node 22.13 or newer is required (`engines` in `package.json`).

## 3. System architecture

The app is a **single deployable service**: one Node process serves the web
page and the JSON API. All state lives in PostgreSQL. A scheduled job refreshes
market quotes. Email and market data go out over HTTPS.

```mermaid
flowchart LR
    subgraph Browser["Browser (student / teacher / admin)"]
        UI["React SPA<br/>app/page.tsx<br/>+ messages-ui, quest-grading-ui, ..."]
        MON["MonitoringClient<br/>(error + timing reporter)"]
    end

    subgraph DO["DigitalOcean App Platform"]
        subgraph WEB["web service (Docker, Node 22, :8080)"]
            START["scripts/digitalocean-start.mjs<br/>1. migrate  2. demo seed  3. vinext start"]
            SSR["vinext server<br/>renders the page"]
            API["API route handlers<br/>app/api/**/route.ts"]
            LIB["Server modules<br/>lib/server/*.ts"]
            RULES["Pure rule modules<br/>lib/*.ts"]
        end
        JOB["market-poll job<br/>(scheduled, school hours)"]
    end

    PG[("Managed PostgreSQL 16<br/>~50 tables")]
    FINN["Market data provider<br/>(Finnhub or custom GET)"]
    RESEND["Resend email API"]

    UI -- "HTTPS, JSON fetch<br/>cookie: futurefund_session" --> API
    UI -- "GET /" --> SSR
    MON -- "POST /api/observability/*" --> API
    API --> LIB --> RULES
    LIB -- "SQL over TLS<br/>pool of DB_POOL_SIZE" --> PG
    START -- "create table if not exists ..." --> PG
    JOB -- "POST /api/market/poll<br/>X-FutureFund-Cron" --> API
    LIB -- "HTTPS GET quotes" --> FINN
    LIB -- "HTTPS POST /emails" --> RESEND
```

### Layering rules

The backend has three layers. Keep to them when adding code:

1. **Route handlers** (`app/api/**/route.ts`): parse the request, call
   `userFromRequest` / `requirePermission`, call a server module, write an
   audit event, and return JSON. Keep them thin.
2. **Server modules** (`lib/server/*.ts`): business logic plus SQL. They throw
   typed errors (for example `PortfolioError`) that the route turns into an
   HTTP status.
3. **Pure rule modules** (`lib/*.ts`, no database): trading maths, quest
   validation, grading, messaging permissions, market clock and motion,
   school years. These are where most unit tests point. Both server and
   client import them, so the same rule runs everywhere.

## 4. Network and deployment

### 4.1 Production network (DigitalOcean)

```mermaid
flowchart TB
    USER["Users' browsers"] -- "HTTPS 443" --> EDGE

    subgraph DOCLOUD["DigitalOcean"]
        EDGE["App Platform edge<br/>TLS, routing, CDN"]
        subgraph APP["App: futurefund-classroom (private app network)"]
            WEB["web service<br/>container :8080<br/>health: GET /api/health"]
            JOB["market-poll job<br/>cron, Mon–Fri school hours"]
        end
        DB[("Managed PostgreSQL<br/>futurefund-db<br/>TLS, trusted sources")]
    end

    GH["GitHub soco104/investing<br/>branch main"] -- "push = build + deploy" --> APP
    EDGE -- "HTTP :8080" --> WEB
    JOB -- "POST http://web:8080/api/market/poll<br/>(internal, with CRON_SECRET)" --> WEB
    WEB -- "5432 / TLS (DATABASE_URL)" --> DB
    WEB -- "HTTPS 443 out" --> FINN["finnhub.io"]
    WEB -- "HTTPS 443 out" --> RES["api.resend.com"]
```

Points to know:

- **Ingress** is HTTPS only, terminated at the App Platform edge, which
  forwards to the container on port `8080`.
- **Health check:** `GET /api/health` runs `select 1` against PostgreSQL and
  returns 503 if the database is unreachable. App Platform restarts or holds
  back a deploy on failure.
- **The cron job** calls the web service. With `.do/app.template.yaml` it uses
  the internal address `http://web:8080`. With `infra/digitalocean/app.yaml`
  it uses `scripts/digitalocean-market-poll.mjs` and the public
  `DIGITALOCEAN_APP_URL` (see section 15, there are two specs).
- **Egress** is outbound HTTPS only: the market provider and Resend. Outbound
  SMTP is blocked by DigitalOcean, which is why email uses Resend's API.
- **Database** is a DO Managed PostgreSQL cluster bound to the app.
  `DATABASE_URL` is injected by App Platform (`${futurefund-db.DATABASE_URL}`).

### 4.2 Container startup

`Dockerfile` is a three-stage build (deps → builder → runner) on
`node:22-slim`. The builder sets `DEPLOY_TARGET=node`, which tells
`vite.config.ts` to skip the Cloudflare plugin so vinext emits a Node server
build in `dist/`.

On DigitalOcean the run command is `npm run start:digitalocean`:

```mermaid
sequenceDiagram
    participant AP as App Platform
    participant S as digitalocean-start.mjs
    participant M as cloudrun-migrate.mjs + digitalocean-migrate.mjs
    participant D as maybe-seed-demo.mjs
    participant V as vinext start
    participant PG as PostgreSQL

    AP->>S: start container
    S->>M: import (runs migrations)
    M->>PG: create table / alter table ... if not exists
    M->>PG: upsert default district + bootstrap admin (if env set)
    S->>D: import
    alt DEMO_LOGINS=true
        D->>PG: seed-demo-data.mjs (idempotent)
    end
    S->>V: spawn, listen 0.0.0.0:8080
    AP->>V: GET /api/health until healthy
    Note over S,V: SIGTERM/SIGINT forwarded to vinext
```

Migrations run **on every start** and are idempotent (`if not exists`). There
is no migration history table and no down-migrations (section 15).

### 4.3 Delivery pipeline

```mermaid
flowchart LR
    DEV["Branch + PR"] --> CI["GitHub Actions CI<br/>lint, typecheck baseline,<br/>Vitest, Playwright + Postgres"]
    CI --> REPORT["Test report comment on PR"]
    CI --> REVIEW["Owner reviews and merges"]
    REVIEW --> MAIN["main"]
    MAIN --> DEPLOY["DO: build Docker image,<br/>migrate, start, health check"]
    MAIN --> REL["release.yml: tag vX.Y.Z + GitHub release<br/>(when package.json version changes)"]
```

### 4.4 Other hosting targets (not live)

- **Google Cloud Run:** `infra/cloudrun/*.tf` (Cloud Run, Cloud SQL, Secret
  Manager, Artifact Registry, Cloud Scheduler), `cloudbuild.yaml`,
  `npm run start:cloudrun`. Runbook: `docs/cloud-run-infrastructure.md`.
- **Cloudflare Workers / D1:** the project was scaffolded on a Cloudflare
  template (`.openai/hosting.json`, `db/index.ts`, `wrangler`, `npm start`).
  Local `npm run dev` still uses the Cloudflare Vite plugin, but no production
  path uses D1.

## 5. Repository layout

```
.
├── app/                       Next-style app directory (served by vinext)
│   ├── layout.tsx             Root HTML, mounts MonitoringClient
│   ├── page.tsx               THE app: login + all three portals (~12k lines, client component)
│   ├── messages-ui.tsx        Inbox, discussion rooms, flags
│   ├── quest-grading-ui.tsx   Teacher grading dialog
│   ├── market-history-ui.tsx  Market rewind chart
│   ├── stock-info-ui.tsx      Stock info popup
│   ├── monitoring-client.tsx  Sends browser errors and timings to the API
│   ├── error.tsx              Error boundary
│   ├── reset-password/page.tsx  Password reset landing page (link from email)
│   └── api/                   JSON API, one folder per resource (section 7)
├── components/ui/             shadcn/ui primitives (button, dialog, table, ...)
├── hooks/use-mobile.ts
├── lib/                       Pure rule modules shared by client and server
│   └── server/                Server-only modules: SQL, auth, email, secrets
├── scripts/                   Startup, migration, seeding, polling, CI helpers
├── tests/                     Vitest unit tests
│   └── e2e/                   Playwright browser tests
├── docs/                      Guides, roadmap, patch notes, test reports
├── .do/app.template.yaml      DO App spec template (used by deploy-digitalocean.sh)
├── infra/digitalocean/app.yaml  DO App spec (used by docs/digitalocean-deployment.md)
├── infra/cloudrun/            Terraform for Google Cloud Run (not live)
├── deploy-digitalocean.sh     Interactive DO bootstrap script
├── Dockerfile, cloudbuild.yaml
├── db/, drizzle/              Legacy SQLite/D1 Drizzle schema: NOT the live schema
├── build/, vendor/, .openai/  Template/build helpers from the original scaffold
├── CHANGELOG.md               Developer changelog (drives GitHub releases)
└── CLAUDE.md                  Contribution rules (read this first)
```

## 6. Frontend

### 6.1 Shape

The UI is effectively a **single-page app**. `app/page.tsx` starts with
`"use client"` and exports `Home()`, which holds nearly all UI state in React
`useState` hooks and switches screens by state rather than by URL:

- not signed in → `LoginPage`
- signed in → a tabbed shell. `activeTab` picks the portal (Student, Teacher,
  Admin, Market, Inbox, Discussion). Inside a portal, `activeStudentPage`,
  `activeTeacherPage` and `AdminPage` pick the sub-page.
- Admins (and the demo super user) can **Assume role** to see the other
  portals, and **View as student** to act as a specific student (server-side,
  section 8.4).

There is no client-side router and no global store. Data is loaded with plain
`fetch("/api/...")` calls inside `useEffect`s, and the cookie is sent
automatically. Refreshing reloads state from the server (`GET /api/auth/me`
restores the session).

### 6.2 Main components in `app/page.tsx`

| Area | Components (search for `function Name`) |
|---|---|
| Shell / auth | `Home`, `LoginPage`, `AppVersion`, `ViewingAsBanner` |
| Student | `StudentPortfolioPage`, `PortfolioHistory`, `StudentAssignedQuests`, `StudentAssignedQuestDialog`, `AllocationDonut`, `PortfolioChart` |
| Market | `MarketPage`, `StocksInfoBox`, `TeacherMarketControls` |
| Teacher | `TeacherActiveStudentsPage`, `TeacherPortfolioResets`, `QuestLibraryList`, `AssignQuestDialog`, `QuestSubmissionsPanel`, `SubmissionComments` |
| Profiles | `UserSearchPanel`, `UserProfilePage`, `TeacherProfilePage`, `AccountProfilePage` |
| Admin | `AdminDrilldown` routes to `UsersAdminPage`, `PermissionsAdminPage`, `SchoolsAdminPage`, `IntegrationsAdminPage`, `MarketEngineAdminPage`, `CredentialsAdminPage`, `PrivacyPostureAdminPage`, `MonitoringAdminPage`, `SupportAdminPage`, `PortfolioCorrectionsAdminPage`, `PortfolioResetQueue`, `SchoolYearDialog`, `EmailSettingsDialog`, `ViewAsStudentDialog` |

Large features have been split into sibling files (`messages-ui.tsx`,
`quest-grading-ui.tsx`, `market-history-ui.tsx`, `stock-info-ui.tsx`). New
features should follow that pattern instead of growing `page.tsx`.

### 6.3 Polling

- Live market prices: every **5 s** (`LIVE_MARKET_REFRESH_MS`,
  `GET /api/portfolios/live`).
- Messages: every **30 s** (`messages-ui.tsx`).

There are no websockets.

### 6.4 What is real and what is sample data

Some screens still show built-in sample data (top of `page.tsx`: `allocation`,
`basePortfolio`, `marketWatch`, `classRows`, `mastery`, ...). The
authoritative list is **"What Is Saved in This Version"** at the top of
`docs/admin-guide.md`. In short: portfolios, trades, quests, grades, messages,
users, permissions, teacher market changes and clock are real. The Monitoring
pages, teacher class analytics, the Active Students view and the student
sidebar figures are sample data.

## 7. Backend: API routes and server modules

Every route is a file `app/api/<path>/route.ts` exporting `GET` / `POST` /
`PATCH` / `DELETE` functions that take a standard `Request` and return
`Response.json(...)` / `NextResponse`.

### 7.1 Route map

| Route | Who | Purpose | Server module |
|---|---|---|---|
| `auth/login` | public | Password login (+ demo security question), or start SSO | `auth`, `demo-challenge`, `sso` |
| `auth/logout`, `auth/me` | signed in | End session / current user | `auth` |
| `auth/demo-logins` | public | Whether to show demo profiles | `auth` |
| `auth/reset-password` | public (token) | Complete a password reset | `repository` |
| `health` | public | Liveness + DB check | — |
| `portfolios` | signed in | Student's profile portfolios | `portfolios` |
| `portfolios/live` | signed in | Current prices for a portfolio (polled) | `portfolios`, `teacher-market` |
| `portfolios/trade` | signed in | Buy / sell / buy max | `portfolios` + `lib/portfolio-rules` |
| `portfolios/allocation` | signed in | Save allocation targets | `portfolios` |
| `portfolios/reset-requests` | teacher/admin | Request / decide portfolio resets | `portfolios` |
| `market` | signed in | Class market state | `repository`, `market-engine` |
| `market/info` | signed in | Stock info popup | `stock-info` |
| `market/poll` | cron secret | Pull quotes from providers | `market-providers`, `secrets` |
| `teacher/market` | teacher/admin | Price changes, scenarios, clock controls | `teacher-market`, `market-clock` |
| `teacher/market/history` | teacher/admin | Market rewind | `market-history` |
| `quests` | teacher | Quest Studio CRUD, library, copy, assign | `quests` + `lib/quest-rules` |
| `quests/student` | student | Assigned quests, submit reflection | `quests` |
| `quests/submissions`, `quests/comments` | teacher | Review submissions, comment | `quests` |
| `quests/grades` | teacher/admin | Grade, change, release | `quest-grading` + `lib/quest-grading` |
| `messages` | signed in | Inbox, rooms, contacts, send, keep | `messages` + `lib/message-rules` |
| `messages/flags` | teacher/admin | Flag queue, resolve, forward | `messages` |
| `alternate-contacts` | teacher/admin | Parent/guardian contacts | `messages` |
| `admin/state` | admin | One-call snapshot for the Admin portal | `repository` |
| `admin/users`, `admin/permissions`, `admin/schools` | admin | User, permission, school management | `repository` |
| `admin/integrations`, `admin/credentials` | admin | Market providers, credential vault | `repository`, `secrets`, `url-safety` |
| `admin/class-market`, `admin/school-year` | admin | Simulator settings, school year dates | `repository`, `portfolios` |
| `admin/email`, `admin/email-domains` | admin | Email status / test send, allowed domains | `email`, `messages` |
| `admin/password-resets` | admin | Create a reset (emails the user) | `repository`, `email` |
| `admin/portfolio-corrections`, `admin/portfolio-resets` | admin | Fix or reset portfolios | `repository`, `portfolios` |
| `admin/view-as` | admin | Start / stop viewing as a student | `repository` |
| `admin/audit` | admin | Audit log (no screen yet) | `audit` |
| `admin/moderation`, `admin/retention`, `admin/privacy`, `admin/sso`, `admin/operations/{backup,incidents}` | admin | Compliance endpoints (mostly no screen yet) | various |
| `admin/message-cleanup`, `admin/quests/transfer`, `admin/support` | admin | Cleanup, quest import/export, support cases | `messages`, `quests`, `repository` |
| `observability/errors`, `observability/performance` | ingest secret (`X-FutureFund-Ingest`) | Record errors and timings (see section 15, item 13) | `repository`, `ingest-auth` |
| `integration-test` | admin | Test-call a market endpoint | `market-providers` |

### 7.2 Server modules (`lib/server/`)

| Module | Responsibility |
|---|---|
| `repository.ts` | The PostgreSQL client (`getSql()`, one pooled postgres.js client per process) and the older data-access functions: users, sessions, audit, admin state, integrations, quotes, credentials, password resets, email log |
| `auth.ts` | Login, signed session tokens, cookie handling, `userFromRequest`, `requirePermission`, login throttling, demo users |
| `crypto.ts` | bcrypt password hashing, SHA-256 token hashing |
| `demo-challenge.ts` | Security question for demo accounts, with lockout |
| `portfolios.ts` | Portfolios per class per school year, trades, allocation, value snapshots, resets |
| `market-engine.ts` | Builds a class's market state (quotes + clock + scenario) |
| `market-clock.ts` | Teacher clock actions (pause/resume/speed/hours) and their event log |
| `market-history.ts` | Rebuilds past prices for rewind |
| `market-providers.ts` | Calls Finnhub or a generic GET endpoint and normalizes quotes |
| `teacher-market.ts` | Teacher price changes and the Strait of Hormuz scenario, per class / group / student |
| `stock-info.ts` | Basic vs Full stock info by class level |
| `quests.ts`, `quest-grading.ts` | Learning quests, submissions, comments, grades |
| `messages.ts`, `moderation.ts` | Messaging, flags, forwards, retention cleanup, profanity filter |
| `email.ts` | Resend client, email templates, delivery log |
| `secrets.ts` | Credential vault: AES-256-GCM in PostgreSQL, Google Secret Manager, or in-memory |
| `url-safety.ts` | Blocks unsafe integration endpoints (SSRF guard) |
| `audit.ts` | `recordAuditEvent` / `listAuditEvents` |
| `sso.ts` | Builds the district OIDC start URL (callback not finished) |
| `retention.ts`, `ingest-auth.ts`, `portfolios-errors.ts` | Retention plans, service-to-service ingest auth, error helpers |

### 7.3 Pure rule modules (`lib/`)

`portfolio-rules.ts` (money in **cents**, quantities in **units of 1/10,000
share**, fractional shares by grade level), `quest-rules.ts`,
`quest-grading.ts`, `message-rules.ts` (who may message whom, filter,
retention), `market-clock.ts`, `market-motion.ts`, `market-adjustments.ts`,
`market-history.ts`, `school-year.ts`, `stock-info.ts`, `observability.ts`,
`version.ts` (reads the version from `package.json`).

### 7.4 Error and response conventions

- JSON bodies look like `{ ok: true, ... }` or `{ ok: false, message }`.
  `message` is written for the end user.
- 401 = not signed in, 403 = signed in but not allowed, 400 = bad input,
  409 = conflict (for example trading while the market is paused).
- Server modules throw `PortfolioError`, a quest error and so on, and
  `*ErrorResponse(error)` helpers map them to responses.
- Data changes by staff write an **audit event** (`recordAuditEvent`). Actions
  taken while an admin is "viewing as" a student are audited with the admin as
  the actor.

## 8. Authentication, sessions and permissions

### 8.1 Login and session

```mermaid
sequenceDiagram
    participant B as Browser
    participant L as POST /api/auth/login
    participant A as lib/server/auth.ts
    participant DC as demo-challenge.ts
    participant PG as PostgreSQL

    B->>L: { email, password, securityAnswer? }
    L->>A: authenticatePassword()
    A->>A: throttle check (5 failures = lockout, in memory)
    A->>PG: user_credentials + app_users + role_assignments
    A->>A: bcrypt.compare (or legacy SHA-256)
    alt demo account
        L->>DC: checkDemoChallenge()
        DC-->>B: 200 { challenge: question } if no or wrong answer
    end
    L->>A: createSessionToken(user)
    A->>A: payload = base64url(JSON{id, role, permissions, exp: +8h})<br/>token = payload + "." + HMAC-SHA256(SESSION_SECRET)
    A->>PG: insert auth_sessions (sha256(token), ip, user agent, expires_at)
    L-->>B: Set-Cookie futurefund_session (HttpOnly, SameSite=Lax, Secure, 8h)
```

On each request `userFromRequest` reads the token from the cookie (or an
`Authorization: Bearer` header), checks the HMAC signature and expiry, then
**with a database** looks up the session by token hash (it must exist and not
be revoked) and reloads the user from the database. That means disabling a
user or resetting a password takes effect immediately. Logout revokes the
session row.

### 8.2 Roles and permissions

- **Role** comes from `role_assignments.role` (`Student`, `Teacher`, `Admin`).
  `role_assignments.scope` holds the **class name**: classes are not a table,
  they are identified by name strings everywhere (section 11).
- **Permissions** (`PermissionKey`): `studentProfile`, `teacherPortal`,
  `adminPortal`, `questImportExport`, `portfolioCorrections`, stored in
  `user_permission_grants`.
- `requirePermission(request, key)` returns 401/403 or the user. **Admins
  pass every permission check.**
- Finer checks (is this teacher assigned to this class? does this student own
  this portfolio?) live in the server modules, for example
  `requireOwnedWritablePortfolio` and `controllableClasses`.

### 8.3 Demo logins

Demo users exist for demos and tests. `DEMO_LOGINS=true` seeds them on startup
and shows the profile dropdown. Demo accounts must also answer a security
question checked against `DEMO_SECURITY_ANSWER`. In production a missing
answer refuses demo logins. A hard-coded fallback list (`seedAuthUsers` in
`auth.ts`) is only used when there is no database. Turn demo logins **off**
before real school data is loaded.

### 8.4 View as student

An admin can act as a student. The session row gets `view_as_user_id`, and
`userFromRequest` then returns the student with `actingAdmin` set. Routes use
`actingAdmin` to audit actions under the admin's name.

### 8.5 District SSO (not finished)

`/api/auth/login` with a non-password provider builds an OIDC authorization URL
(`SSO_*` env vars) and sets state and nonce cookies. The callback (token
exchange, ID token validation, linking the district identity to an
`app_users` row) is **not implemented yet**.

## 9. Key flows

### 9.1 A student places a trade

```mermaid
sequenceDiagram
    participant B as Browser (MarketPage)
    participant R as POST /api/portfolios/trade
    participant P as lib/server/portfolios.ts
    participant M as market-engine + teacher-market
    participant RU as lib/portfolio-rules.ts
    participant PG as PostgreSQL

    B->>R: { portfolioId, ticker, side, shares | max }
    R->>R: userFromRequest() or 401
    R->>P: executeTrade(user, input)
    P->>PG: BEGIN
    P->>PG: load portfolio, check owner and school year not ended
    P->>M: class prices for this student (clock + teacher changes)
    P->>P: tradingBlockedReason(clock), 409 if paused or closed
    P->>RU: applyTrade(state, price, fractional allowed?)
    RU-->>P: new cash + holdings, or a trade error
    P->>PG: write holdings, cash, activity row, value snapshot
    P->>PG: COMMIT
    R->>PG: audit event if an admin is viewing as the student
    R-->>B: { ok, portfolio }
```

Prices are always worked out **on the server** at trade time. The client
price is only for display.

### 9.2 Market data refresh (cron)

```mermaid
sequenceDiagram
    participant C as market-poll job
    participant R as POST /api/market/poll
    participant S as secrets.ts
    participant MP as market-providers.ts
    participant X as Provider (Finnhub)
    participant PG as PostgreSQL

    C->>R: X-FutureFund-Cron: CRON_SECRET
    R->>PG: listPollableIntegrations()
    loop each integration (concurrency MARKET_POLL_CONCURRENCY, max 8)
        R->>S: readSecretValue(token_secret_ref), decrypt
        R->>MP: testMarketProvider(config, token)
        MP->>X: HTTPS GET (timeout MARKET_PROVIDER_TIMEOUT_MS)
        X-->>MP: quotes
        MP-->>R: normalized quotes (symbol limit applied)
        R->>PG: insert market_quotes, update integration health
        R->>PG: record class_market_snapshots for target class
    end
    R-->>C: { ok, results, telemetry }
```

### 9.3 Password reset by email

Admin → `POST /api/admin/password-resets` → a row in `password_reset_requests`
holds a **hash** of a one-time token → `email.ts` sends the link through Resend
(logged in `email_deliveries`) → the user opens `/reset-password?token=...` →
`POST /api/auth/reset-password` checks the hash and expiry, sets a bcrypt
password and revokes all of that user's sessions. Without `RESEND_API_KEY`
and `EMAIL_FROM` the reset is created but no email goes out.

### 9.4 Quests and grading

Teacher creates a quest (title, objective, market settings, scoring rules,
score visibility) → assigns it to classes with a due date (`quest_assignments`)
→ students submit a reflection (`quest_submissions`, editable until due) →
teacher grades per scoring rule (`quest_grades`, **draft**) → teacher releases
→ student sees `studentGradeReport()`, which follows the quest's score
visibility and never shows hidden rules.

### 9.5 Messaging

`canMessage()` (pure) decides who may message whom. Messages pass the profanity
and personal-info filter (`filterMessage`). Blocked text is refused, and
"review" text is flagged to the teacher. Flags go to the teacher first, who can
resolve them or forward them to admins or an allowed email domain. Messages
are deleted after **90 days** unless someone ticked Keep or a flag is open.
The cleanup runs at most once a day, triggered lazily when someone lists
conversations, and coordinated across instances through the `maintenance_runs`
table.

## 10. The market simulator

The simulator is the most original part of the code. The key idea: **prices
are a pure function of time, not stored data.**

```mermaid
flowchart LR
    CLOCK["Class clock<br/>class_market_clocks<br/>status, speed, hours,<br/>simAnchor, realAnchor"] --> SIM["simulated time<br/>= simAnchor + open real time × speed"]
    SIM --> MOTION["motionPercent(seed, symbol, simTime)<br/>lib/market-motion.ts<br/>(sum of smooth waves, deterministic)"]
    BASE["Day's starting price<br/>provider quote or fallback,<br/>scenario, volatility,<br/>class settings"] --> PRICE
    MOTION --> PRICE["simulator price"]
    PRICE --> ADJ["applyAdjustments()<br/>teacher changes stacked:<br/>class / group / one student"]
    ADJ --> VIEW["price this viewer sees and trades at"]
```

- **Clock** (`lib/market-clock.ts`): each class has its own simulated time.
  Teachers pause, resume, change speed and set market hours. Only those
  actions are stored (`class_market_clocks`, plus every change in
  `class_market_clock_events`).
- **Motion** (`lib/market-motion.ts`): same seed + symbol + time always gives
  the same move, so the market "runs" without writing prices, every class on
  the shared seed sees the same run, and history can be replayed.
- **Teacher changes** (`market_adjustments`): percentage moves on a symbol,
  scoped to a class, a group or one student. They stack and can be undone.
  The Strait of Hormuz scenario is a preset group of these.
- **Rewind** (`market-history.ts`): rebuilds past prices from the clock log
  and the changes. Known limit: scenario and volatility are not versioned, so
  the past is drawn with today's settings.
- **Trading** is blocked while the class market is paused or closed.

## 11. Data model

### 11.1 Where the schema lives

The **live schema is the raw SQL in `scripts/cloudrun-migrate.mjs`** (plus the
`credential_secrets` table in `scripts/digitalocean-migrate.mjs`). It runs on
every start with `create table if not exists` and
`alter table ... add column if not exists`. The Drizzle schema in
`db/schema.ts` and `drizzle/` is a **leftover SQLite/D1 schema from the
original scaffold**. It is out of date and not used in production. Don't add
tables there.

All IDs are `text` (prefix + random, see `id()` in `repository.ts`). Money is
integer **cents** and share quantities are integer **units** (1 share =
10,000 units). Most tables carry `district_id`. There is one default district,
`district-lincoln-usd`.

### 11.2 Core entities

```mermaid
erDiagram
    districts ||--o{ schools : has
    districts ||--o{ app_users : has
    app_users ||--o{ role_assignments : "role + scope (class name)"
    app_users ||--o{ user_permission_grants : has
    app_users ||--|| user_credentials : "password"
    app_users ||--o{ auth_sessions : "signed-in sessions"
    app_users ||--o{ student_portfolios : owns
    student_portfolios ||--o{ portfolio_holdings : holds
    student_portfolios ||--o{ portfolio_activity : logs
    student_portfolios ||--o{ portfolio_value_snapshots : tracks
    student_portfolios ||--o| portfolio_allocation_targets : targets
    student_portfolios ||--o{ portfolio_reset_requests : "reset requests"
    learning_quests ||--o{ quest_assignments : "assigned to class"
    quest_assignments ||--o{ quest_submissions : receives
    quest_submissions ||--o{ quest_submission_comments : has
    quest_assignments ||--o{ quest_grades : grades
    conversations ||--o{ conversation_participants : has
    conversations ||--o{ messages : contains
    messages ||--o{ message_flags : flagged
    message_flags ||--o{ message_flag_forwards : forwarded
    market_data_integrations ||--o{ market_quotes : produces
    integration_credentials ||--o| credential_secret_values : "encrypted value"

    student_portfolios {
        text id PK
        text user_id
        text class_name
        text school_year
        text kind "class | practice"
        bigint cash_cents
    }
    portfolio_holdings {
        text portfolio_id PK
        text ticker PK
        bigint quantity_units
        numeric average_cost_cents
    }
    class_market_configs {
        text district_id
        text class_name "unique per district"
        numeric volatility_multiplier
        int starting_cash_cents
    }
    class_market_clocks {
        text class_name PK
        text status
        int speed
        bigint sim_anchor_ms
        bigint real_anchor_ms
    }
```

**Classes are names, not rows.** There is no `classrooms` table in PostgreSQL.
A class is the string in `role_assignments.scope` (for example
`"7th Grade Finance A"`), and it keys `class_market_configs`,
`class_market_clocks`, `market_adjustments`, `quest_assignments`,
`student_portfolios` and so on. The grade level is parsed from the name
(`gradeLevelFromClassName`) unless one is saved. Renaming a class means
updating every table that stores the name.

### 11.3 Table groups

| Group | Tables |
|---|---|
| Tenancy | `districts`, `schools`, `district_settings` (school year dates) |
| Identity | `app_users`, `role_assignments`, `user_permission_grants`, `user_credentials`, `auth_sessions`, `password_reset_requests`, `sso_identity_providers` |
| Portfolios | `student_portfolios`, `portfolio_holdings`, `portfolio_activity`, `portfolio_allocation_targets`, `portfolio_value_snapshots`, `portfolio_reset_requests`, `portfolio_corrections` |
| Market | `class_market_configs`, `class_market_clocks`, `class_market_clock_events`, `class_market_snapshots`, `market_adjustments`, `market_data_integrations`, `market_quotes` |
| Credentials | `integration_credentials` (metadata), `credential_secret_values` (AES-GCM ciphertext), `credential_secrets` (DO vault) |
| Quests | `learning_quests`, `quest_assignments`, `quest_submissions`, `quest_submission_comments`, `quest_grades` |
| Messaging | `conversations`, `conversation_participants`, `messages`, `message_keeps`, `message_flags`, `message_flag_forwards`, `allowed_email_domains`, `alternate_contact_requests`, `student_alternate_contacts` |
| Admin / compliance | `admin_audit_events`, `support_tickets`, `privacy_posture_settings`, `data_retention_requests`, `moderation_reviews`, `backup_jobs`, `incident_response_records` |
| Ops / telemetry | `app_error_events`, `performance_events`, `email_deliveries`, `maintenance_runs` |

### 11.4 Changing the schema

1. Add `create table if not exists ...` or
   `alter table ... add column if not exists ...` to
   `scripts/cloudrun-migrate.mjs`. It must be safe to run on every start, on
   both a fresh and an existing database.
2. New columns on existing tables need a default or must be nullable.
3. Never drop or rename in place. Add the new column, backfill, switch the
   code, and remove the old column in a later release.
4. The CI browser tests run migrations against a fresh PostgreSQL, which
   catches most mistakes.

## 12. Configuration and secrets

Set on the DO **web** component (App → Settings → web → Environment
Variables). Secrets must be **Encrypted**.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection (injected by DO) |
| `SESSION_SECRET` | yes (prod) | HMAC key for session tokens. Changing it signs everyone out |
| `CRON_SECRET` | yes | Shared secret for `/api/market/poll` (also on the job) |
| `CREDENTIAL_ENCRYPTION_KEY` (+ `_VERSION`) | yes | AES-256 key for the credential vault. **Losing it makes stored provider tokens unreadable** |
| `OBSERVABILITY_INGEST_SECRET` | yes | Auth for server-to-server telemetry ingest |
| `NODE_ENV` | yes | `production` turns on secure cookies and strict demo rules |
| `DB_POOL_SIZE` | no (5) | postgres.js pool size per instance |
| `DEMO_LOGINS`, `DEMO_SECURITY_ANSWER` | demo only | Seed and allow demo accounts (section 8.3) |
| `ALLOW_DEMO_AUTH` | no | Legacy switch for the in-code demo users. Keep `false` |
| `RESEND_API_KEY`, `EMAIL_FROM`, `APP_BASE_URL` | for email | Resend delivery and link base URL |
| `BOOTSTRAP_DISTRICT_NAME` / `_STATE`, `PRIVACY_CONTACT_EMAIL` | first run | Default district values |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD_HASH` | first run | Creates the first admin (bcrypt hash) |
| `MARKET_PROVIDER_TIMEOUT_MS`, `MARKET_POLL_CONCURRENCY` | no | Provider call tuning |
| `MARKET_POLL_URL` / `DIGITALOCEAN_APP_URL` | job | Where the cron job sends its POST |
| `SSO_AUTHORIZATION_URL`, `SSO_CLIENT_ID`, `SSO_REDIRECT_URI`, `SSO_SCOPE` | future | District OIDC (unfinished) |
| `GOOGLE_CLOUD_PROJECT` | Cloud Run only | Switches the vault to Google Secret Manager |
| `PASSWORD_BCRYPT_ROUNDS` | no (12) | bcrypt cost |

Market provider tokens entered in the Admin portal are **never stored in plain
text**. `secrets.ts` encrypts them with AES-256-GCM and stores a reference
like `pg-encrypted://credential_secret_values#<id>`. Integration endpoints
are checked by `url-safety.ts` before the server calls them.

## 13. Testing, CI and releases

| Command | What it runs |
|---|---|
| `npm run lint` | ESLint (Next config) |
| `npm run typecheck:baseline` | `tsc`. Fails if errors exceed `scripts/typescript-baseline.json` (currently 17). Lower it when you fix some |
| `npm test` | Vitest unit tests (`tests/*.test.ts`): mostly the pure rule modules and route handlers |
| `npm run test:e2e` | Playwright against `next dev` on port 3123. Needs `DATABASE_URL` to a **scratch** PostgreSQL. `tests/e2e/global-setup.ts` migrates and seeds it |

**CI** (`.github/workflows/ci.yml`) runs all four on every PR and push to
`main`, with a `postgres:16` service container, then posts a test report
comment (`scripts/test-report.mjs`). Each step uses `continue-on-error` so the
report always shows every result, and the job fails at the end if any step
failed.

**Releases** (`.github/workflows/release.yml`): when `package.json`'s version
changes on `main`, it creates tag `vX.Y.Z` and a GitHub release from the
matching `CHANGELOG.md` section. Never tag by hand.

**Process rules** (full detail in `CLAUDE.md`): every behavior change bumps
the patch version, updates `CHANGELOG.md`, `docs/patch-notes.md` and the
user/admin guides as needed, and adds Playwright tests. Every bug gets a
GitHub issue with the `bug` label and a regression test named after it.
Docs-only changes (like this file) need no version bump.

## 14. Local development

```bash
npm install
npm run dev                      # http://localhost:5173 (vinext + Cloudflare dev plugin)

# Real data locally: point at a scratch PostgreSQL
docker run -d --name ff-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
export DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres
node scripts/cloudrun-migrate.mjs   # create tables
npm run db:seed:demo                # demo schools, users, quotes, ...

npm test
npm run test:e2e                 # uses DATABASE_URL
```

Without `DATABASE_URL` the app runs in a reduced mode: the in-code demo users
can sign in, but most features that save data return errors or fall back to
sample data. Use a database for any real work.

Production-like build: `DEPLOY_TARGET=node npm run build`, then
`npx vinext start`, or build the Dockerfile.

## 15. Known quirks and technical debt

Read this before changing anything structural.

1. **`app/page.tsx` is ~12,000 lines.** Most UI state sits in `Home()`. Split
   new features into their own files and move existing pages out as you touch
   them. A UI enhancement pass is on the roadmap.
2. **Two schemas.** `db/schema.ts` and `drizzle/` (SQLite/D1) are stale. The
   real schema is `scripts/cloudrun-migrate.mjs`. Consider deleting the
   Drizzle files or porting the SQL to a real migration tool with versioned
   history.
3. **"cloudrun" naming.** `cloudrun-migrate.mjs` is the migration for every
   target, including DigitalOcean.
4. **Two DigitalOcean specs and two poll scripts.** `.do/app.template.yaml` +
   `scripts/market-poll.mjs` (internal `http://web:8080`, used by
   `deploy-digitalocean.sh`) versus `infra/digitalocean/app.yaml` +
   `scripts/digitalocean-market-poll.mjs` (public URL, autoscaling 1–3, used
   by `docs/digitalocean-deployment.md`). Check the live app's spec in the DO
   console to confirm which one is deployed, then retire the other.
5. **No migration history.** Migrations run on every start. A slow or failing
   migration blocks startup, and the health check then fails the deploy.
6. **Classes are strings** (section 11.2). There are no foreign keys from
   class-scoped tables, and renames are manual.
7. **In-memory state per instance:** login throttling, demo-challenge lockouts
   and the local secret map live in process memory. With autoscaling above 1
   instance they are not shared.
8. **Sample data on some screens** (section 6.4), and **compliance endpoints
   without screens** (audit log, moderation, retention, backup, incidents, SSO).
9. **SSO is half built.** There is a start URL but no callback.
10. **Legacy Cloudflare scaffold**: `.openai/`, `build/sites-vite-plugin`,
    `wrangler`, `cloudflare-env.d.ts`, `npm start`, `examples/d1`. Local
    `npm run dev` still uses the Cloudflare plugin, while production uses the
    Node build.
11. **`tsconfig.tsbuildinfo` is committed.** It is a build cache and could be
    ignored.
12. **Polling, not push.** 5 s price polling per open browser is fine at
    pilot scale. Watch database load as classes grow.
13. **Browser telemetry is dropped in production.** `MonitoringClient`
    (`lib/observability.ts`) posts to `/api/observability/*` without the
    `X-FutureFund-Ingest` header. Those routes require it whenever
    `OBSERVABILITY_INGEST_SECRET` is set, so browser errors and timings get a
    401. This is part of why the Monitoring pages still show sample data.
    The fix is to accept signed-in users' sessions on those routes, with rate
    limiting.

## 16. How to add a feature

1. Read `CLAUDE.md` and check `docs/roadmap.md`.
2. Branch from `main`.
3. Put the rules in a **pure module** in `lib/` with Vitest tests.
4. Put database work in a **server module** in `lib/server/`, and add any new
   tables or columns to `scripts/cloudrun-migrate.mjs` (section 11.4).
5. Add a **thin route** in `app/api/<area>/route.ts`. Check auth with
   `userFromRequest` / `requirePermission`, check class or ownership in the
   module, and call `recordAuditEvent` for staff actions.
6. Add the **UI** in a new `app/<feature>-ui.tsx` and wire it into
   `page.tsx`.
7. Add **Playwright tests** in `tests/e2e/`.
8. Bump the version, update `CHANGELOG.md`, `docs/patch-notes.md` and the
   guides, then open a PR titled `vX.Y.Z: ...`. CI must pass, and the owner
   merges.
