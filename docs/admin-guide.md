# FutureFund Classroom Admin Guide

This guide explains how district or system administrators operate and configure
the FutureFund Classroom MVP. It describes version 0.2.14; the running version is
shown in small text at the bottom of every page. It is updated with every
change that affects what it describes.

### What Is Saved in This Version

- **Saved on the server and audited:** users (create, import, edit, enable,
  disable), permissions, schools, market integrations and integration tests,
  Market Simulator class settings, Credential Vault entries, support cases,
  password resets (emailed to the user), email test sends, privacy posture,
  school year dates, class grade levels, class stock info levels, portfolio corrections, portfolio
  reset decisions, teacher market changes (each change, undo and reset),
  market clock changes (pause, resume, speed, hours), and
  learning quests (saved, copied, assigned, imported, exported).
- **Saved, not audited:** student portfolios (cash, stocks, trades, allocation
  targets, value history), for every class and school year; teachers' reset
  requests (the request itself is audited). Each portfolio keeps its own
  activity history. Students' quest submissions and the comments on them.
- **Saved and audited (messages):** inbox messages and discussion posts (kept
  90 days unless someone ticks Keep), flags, forwards, allowed email domains,
  alternate contacts and requests, and cleanup runs. Message text itself is not
  in the audit log.
- **Sample data:** the Monitoring pages (open errors, slow calls, integration
  health), the teacher's class analytics and Active Students view, and the
  student sidebar figures (financial readiness, learning streak).
- **Server endpoints with no screen yet:** moderation review, retention
  requests, backup/restore tests, incidents, SSO settings, and the audit log
  (sections 17, 18, 19, and 20).

**Sessions:** users stay signed in across page refreshes for up to 8 hours
after signing in. **Sign out** ends the session on the server. Resetting a
user's password signs them out everywhere.

## 1. Admin Responsibilities

Admins manage the district-level setup that lets teachers and students use the
platform safely:

- Configure schools, classrooms, users, and user roles.
- Grant or remove permissions for students, teachers, and admins.
- Configure market data integrations used by learning quests and portfolio
  simulations.
- Select the district privacy posture and maintain the privacy contact.
- Review support cases, monitoring signals, and integration health.
- Trigger password resets.
- Apply audited portfolio corrections when simulated portfolio data needs to be
  repaired.
- Import or export learning quest templates for district reuse.

The MVP is an educational simulation. Admins should not configure workflows that
imply real brokerage activity, real trades, financial advice, banking transfers,
or live custodial accounts.

## 2. Access and Login

Users sign in with email and password, and are taken to the portal their role
allows. The app includes three role families:

- `Student`: student dashboard, portfolio, learning quests, profile, inbox, and
  classroom discussions.
- `Teacher`: teacher dashboard, class progress, quest studio, student analytics,
  teacher profile, inbox, and learning quest import/export when permitted.
- `Admin`: admin portal, system configuration, monitoring, support, user
  management, integrations, privacy, password resets, and portfolio corrections.

The password login API is implemented at `/api/auth/login`. Production
deployments should use persisted user credentials, hardened session storage, and
district SSO. District OIDC SSO can start when the configured identity provider
values are present; callback token exchange and assertion validation still need
to be matched to the district identity provider before live rollout.

### Demo Logins

Demo logins are for demo and staging sites only. On a live district site, leave
them off.

They are controlled by two DigitalOcean environment variables (App → Settings →
**web** component → Environment Variables):

| Variable | Value | What it does |
|---|---|---|
| `DEMO_LOGINS` | `true` | Loads the demo users into the database each time the app starts, and shows the demo option on the login page. Any other value (or unset) turns demo logins off. |
| `DEMO_SECURITY_ANSWER` | the answer (set as **Encrypted**) | Answer to the security question demo accounts must pass after their password. If it is missing on the live site, demo logins are refused. |

How demo login works:

- The login page's **Email** field has an arrow that offers **Demo super user
  (all roles)**, `demo-user@demo.edu`. This account is an Admin with every
  permission.
- After the password is accepted, every demo account (including the student,
  teacher, and admin demo accounts in section 21) must answer the security
  question. Answers ignore capitals and extra spaces.
- Five wrong answers lock that account for 15 minutes.
- Anyone who has the site address and the security answer can sign in as an
  admin, so turn `DEMO_LOGINS` off before real school data is added.

Keep the older `ALLOW_DEMO_AUTH` setting `false` on live sites. Setting it to
`true` lets the app's built-in demo accounts sign in even when they aren't in
the database, and also shows the demo option on the login page.

## 3. Role and Permission Model

Admins can use the **Assume role** menu in the app header to switch between the
Student, Teacher, and Admin views their permissions allow. In the Student view,
admins see their own **Practice** portfolio. To see and work in a specific
student's account, use **View as student** (section 14a). Admin users do not
need the left-side student or teacher profile card;
student and teacher users see role-appropriate profile content.

The admin permission model currently tracks these permission categories:

- `Student profile`: access to student-facing profile and portfolio surfaces.
- `Teacher portal`: access to teacher dashboards, rosters, analytics, and quest
  authoring.
- `Admin portal`: access to district/system administration.
- `Quest import/export`: permission to move quest templates as JSON.
- `Portfolio corrections`: permission to adjust simulated portfolio values.

Admin users keep all system rights by default. Teachers can be granted teacher
portal and quest import/export rights. Students should normally retain only
student profile access.

## 4. Admin Portal Overview

The Admin portal contains the following operational modules:

- Schools
- Users
- Permissions
- Support
- Monitoring
- Market APIs
- Market Simulator
- Credential Vault
- View as student
- School year
- Email
- Privacy posture
- Password resets
- Portfolio corrections
- Messaging
- Learning quest import/export

Each widget opens either a page, drilldown panel, or popup for the related task.
Admin actions that affect access, integrations, support, or portfolio balances
are saved on the server and write an audit event. See "What Is Saved in This
Version" above for the pages that are not saved yet.

## 5. Schools Configuration

Use the Schools section to maintain the schools configured for the application.
The current page shows a table of configured schools and lets an admin add or
delete schools.

School records include:

- School name
- School district
- State
- Class count
- Student count

Recommended operating process:

1. Create or confirm the district record before onboarding schools.
2. Add each school with accurate district and state values.
3. Enter class and student counts as planning metadata for rollout and support.
4. Review counts during semester changes.
5. Delete only schools that are no longer active and have no required reporting
   or retention needs.

For production, deleting a school should either be disabled while active
classes/users exist or converted into a deactivate/archive workflow.

Production endpoint:

- `POST /api/admin/schools`

The endpoint requires `Admin portal` permission and audits school creation or
deletion with school, district, state, class count, student count, actor,
timestamp, and reason.

## 6. User Management

The Users page lists teachers, students, and admins. The table is filterable by
class and role, and shows:

- First name
- Last name
- Email
- Role
- Class
- Profile link
- Enabled/disabled status
- Permission summary

Admins can create users one at a time, import users from a CSV, or edit users
after creation. The edit dialog supports name, email, alias, role, class
assignment, and enabled/disabled status changes.

Production endpoint:

- `POST /api/admin/users`

This endpoint requires an authenticated session with `Admin portal` permission
and records an admin audit event for create, import, modify, enable, or disable
actions.

### Individual User Creation

Use individual creation when adding a small number of users or correcting a
manual onboarding gap.

Required fields:

- First name
- Last name
- Email
- Role
- Class, except for admins where the class defaults to `District`
- Alias
- Temporary password

Operational notes:

- Use district-managed email addresses where possible.
- Keep aliases classroom appropriate and recognizable enough for teachers to
  moderate.
- For production, temporary passwords should force reset on first login.
- Avoid assigning admin roles for ordinary teaching or classroom operations.

### CSV User Import

Use CSV import for roster onboarding. The upload accepts a `.csv` file with
these headers:

```csv
firstName,lastName,email,role,class,alias
```

Import behavior:

- `role` is normalized to `Student`, `Teacher`, or `Admin`.
- Duplicate emails are skipped by the current frontend flow.
- Imported users receive default permissions based on role.
- Admin users are assigned to `District` instead of a class.

Recommended CSV hygiene:

- Confirm the file contains only the target school or class cohort.
- Use consistent role names.
- Remove inactive students before upload.
- Validate special characters in names and aliases before importing.

## 7. User Profiles and Messaging

The Profile button in the Users table opens the selected user's role-aware
profile page.

Student profiles show:

- Alias and profile identity
- Portfolio overview
- Portfolio value and allocation
- Recent portfolio activity
- Learning activity context
- Message link

Teacher profiles show:

- Classes managed
- Learning quests authored
- Message link

Admin profiles show system-level identity and permissions rather than a student
or teacher profile card.

The app supports saved, text-only direct conversations and classroom discussion
rooms. See "Messaging" below for the rules, flags, allowed email domains,
alternate contacts, and the 90-day cleanup.

### Messaging

Open **Admin portal > Messaging**.

- **Who can message whom:** students: classmates and their teachers; teachers:
  their students, other teachers and admins; admins: everyone. The server
  enforces this.
- **Student conversations:** admins (and teachers, for their own students) can
  read conversations read-only from the Inbox.
- **View as student:** messages sent this way are marked "Sent by admin" and
  audited.
- **Language filter:** runs on the server on every message. Blocked messages are
  refused. Messages with personal details, bullying or safety concerns from a
  student are sent and flagged to the teacher.
- **Flagged messages:** the Messaging page lists flags teachers forwarded to
  admins. Resolve them once handled. Open flags stop the 90-day deletion.
- **Allowed email domains:** teachers can forward a flagged message by email only
  to these domains (subdomains count) or to a parent on file. Add your
  district's domain here. Forwarded emails to outside people include the
  flagged message text; the email log never stores message bodies. Email needs
  the setup in "Email" below.
- **Alternate contact requests:** a teacher sends a parent or guardian email; you
  **Approve** (adds it to the student's profile) or **Deny**. You can also add
  or remove a contact directly. Contacts are visible to admins, the student's
  teachers and the student.
- **90-day cleanup:** permanently deletes messages older than 90 days that nobody
  ticked Keep on and that have no open flag. It runs automatically once a day
  while the app is in use. **Run cleanup now** runs it on demand (audited).
  There is no separate scheduled job; a job could call
  `POST /api/admin/message-cleanup` with the cron secret header.

## 8. Permissions

Use the Permissions page to manage what users can access.

Standard permission posture:

- Students: `Student profile`
- Teachers: `Teacher portal`, optionally `Quest import/export`
- Admins: all permissions enabled

When changing permissions:

1. Select the user.
2. Review role and current permissions.
3. Toggle only the needed rights.
4. The change is saved and audited immediately. The audit log records a generic
   reason ("Admin permission update"); the screen does not yet ask for a
   specific reason, so note it in a support case if one is needed.
5. Ask the user to sign out and back in if their session does not update.

Admin permissions are intentionally locked on in the MVP. In production, admin
rights should be scoped by district and protected with strong authentication.

Production endpoint:

- `POST /api/admin/permissions`

The endpoint requires `Admin portal` permission and records the target user,
permission key, enabled state, actor, timestamp, and reason in the audit trail.

## 9. Learning Quest Administration

Teachers create, save and assign learning quests from Quest Studio in the
Teacher portal (see the user manual's Quest Studio section). Each quest is
owned by the teacher who saved it; only its owner or an admin can edit or
assign it. Every teacher can open **See library** to browse all saved quests
and **Copy** one into their own. The Admin portal's quest templates table lists
the whole library with each quest's owner.

How quests are stored and protected:

- Quests, class assignments (with optional due dates), student submissions and
  comments are saved in the database. Nothing is deleted.
- Teachers can assign only to their own classes; admins can assign to any
  class.
- Students see only quests assigned to their own classes, and only the scoring
  rules marked visible (none if the quest's score visibility is hidden).
- A submission can be edited until the end of its due date (23:59 server
  time). After that the server refuses edits; comments are still allowed.
- Comments can be posted by the student who submitted, a teacher of that
  class, or an admin. Reflections and comments go through the profanity
  filter.
- Saving, copying and assigning are audited (`quest.saved`, `quest.copied`,
  `quest.assigned`). Submissions and comments made while an admin is viewing
  as a student are recorded as `view_as.action`, and comments made that way
  show the admin's name.
- When demo data is enabled, two sample quests owned by the demo teacher
  (Elena Rivera) are added to the library once; edits to them are kept.

Quest configuration includes:

- Quest title
- Objective
- Market parameters, when needed
- Portfolio task
- Reflection requirement
- Scoring criteria
- Student visibility setting for scoring rules

Scoring rules can remain hidden from students unless a teacher or admin elects
to show them. Use hidden scoring for assessment rubrics, and visible scoring
when students should know how to optimize the activity.

### Quest Import and Export

Teachers and admins with `Quest import/export` rights can export their own
saved quests as JSON, and import quest JSON (one quest or a list of up to 50).
Imported quests are checked (title, scoring rules, points) and saved to the
importer's own quests as drafts; if any quest is invalid, none are saved and
the message names the problem. Exports contain quest content only, never
student submissions. Both are audited (`quest_templates.exported`,
`quest_templates.imported`).

Recommended process:

1. Export known-good quest templates before district-wide reuse.
2. Store reviewed templates in a district-controlled repository or document
   library.
3. Import templates into the target environment.
4. Review market parameters and scoring visibility before assigning to classes.

Production imports and exports should use the same audit pattern as other admin
mutations. Quest template movement is privileged because a scoring rubric or
hidden objective can change the student learning experience.

## 10. Market API Integrations

The Market APIs widget opens the Integrations page. Admins use it to configure
one or more API connections that feed market data functionality in the app.

Integration fields include:

- API provider
- API endpoint
- Token required toggle
- Token value, when required
- Polling frequency
- Target class
- Allowed symbols
- Enabled/disabled status

Allowed symbols is optional. If left blank, the MVP allows up to 200 symbols to
be imported.

### GET Test Behavior

The test API is implemented at `/api/integration-test`. It performs an
admin-authorized backend GET request against the configured endpoint.

If a token value is supplied, the request sends it as:

```http
Authorization: Bearer <token>
```

The provider adapter also supports query-string token placement and `X-API-Key`
headers for providers that require them. The default remains bearer token
authorization because it is the cleanest common case for server-side GET calls.

### Finnhub Setup

Finnhub should be configured as a pull-based market integration. The webhook URL
on the Finnhub account page can stay blank for the current app flow because the
market engine polls Finnhub rather than receiving pushed events.

Recommended settings:

- API provider: `Finnhub`
- API endpoint: `https://finnhub.io/api/v1/quote`
- Token required: enabled
- Token placement: query token
- Allowed symbols: a comma-separated list such as `AAPL,MSFT,SPY`, or blank to
  discover US symbols and import up to the configured 200-symbol maximum

The Finnhub adapter calls `/quote` once per selected symbol, maps Finnhub's
compact response fields into the app's normalized quote cache, and uses
`/stock/symbol?exchange=US` only when allowed symbols is blank. Finnhub also
supports the `X-Finnhub-Token` header, but query-token placement matches the
published Swagger security shape and is the recommended app configuration.

The classroom-safe mock market endpoint is available at `/api/market`. It
returns simulated, delayed educational market data and should be used for demos
or classroom-safe testing.

If a provider requires the token somewhere other than the `Authorization` bearer
header, such as a query string, custom header, or vendor-specific signature,
production work should add a provider adapter rather than hard-coding that
behavior in the admin form.

### Polling and Class Assignment

Admins can configure polling frequency and assign integrations to the correct
class. The Cloud Run package includes a Cloud Scheduler job intended to call the
market polling endpoint during the school day. Production polling should:

- Respect the configured polling frequency per integration.
- Enforce the 200-symbol MVP maximum when allowed symbols is blank.
- Store normalized fetched market data with class and integration assignment
  context.
- Disable or delete class assignments when a class is no longer in session.
- Retain health and error history for troubleshooting.

Production endpoint:

- `POST /api/admin/integrations`

The endpoint requires `Admin portal` permission and records create, update,
delete, and test actions. Token values should be stored in Secret Manager and
referenced by secret name; token values should not be written into logs,
browser-visible state, or audit context.

Cloud Run can store provider tokens through Google Secret Manager. DigitalOcean
deployments store provider tokens as AES-256-GCM ciphertext in PostgreSQL, with
`CREDENTIAL_ENCRYPTION_KEY` supplied as an encrypted App Platform runtime
environment variable. Both paths keep plaintext tokens out of browser-visible
state and store only opaque secret refs with integration metadata.

Provider calls now use a backend timeout, controlled by
`MARKET_PROVIDER_TIMEOUT_MS`, defaulting to `7000ms`. The scheduled market poll
process uses bounded concurrency, controlled by `MARKET_POLL_CONCURRENCY`,
defaulting to `4` and capped at `8`. These controls keep a slow or failed
provider from delaying the full polling cycle.

## 11. Market Simulator

The Market Simulator page manages the central simulation service and class
market contexts.

Architecture:

- Provider adapters pull market data from approved backend integrations.
- The central quote cache stores normalized provider results.
- The central simulator applies class-specific rules.
- Student portfolios read the simulated class market state.

Class market settings include:

- Class name
- Provider-backed or fallback feed status
- Simulation mode
- Scenario
- Volatility multiplier
- Starting cash (used when a student's portfolio for the class is created)
- Grade level (grade 10 and above can trade fractional shares; leave it on
  "From name" to read it from class names like "7th Grade Finance A")
- Market clock (v0.2.12): each class market runs on its own clock. Prices
  are calculated from the class's simulated time and its volatility
  multiplier, so nothing is stored as prices move. From **Teacher market
  controls** on the Market page, the class's teachers (when Teacher controls
  are on) and admins can **Pause** and **Resume** the market, set its
  **Speed** (1x, 2x, 5x, 10x) and its **Market hours** (Always open, the
  default, or U.S. market hours: 9:30 AM to 4:00 PM Eastern on weekdays,
  holidays not skipped). While paused or closed, prices hold and the server
  refuses trades. Every clock change is audited. Classes in the `Frozen
  market` simulation mode don't move at all. All classes share one price run;
  a class drifts from the others once it is paused or its speed is changed.
- Market history (v0.2.13): the **Market history** button in Teacher market
  controls shows a view-only chart of a class's prices over a timeframe (up
  to 31 days), with teacher changes and clock changes marked. Teachers see
  their own classes; admins any class. It is worked out again each time from
  the saved clock changes and teacher changes, so it stores nothing new and
  isn't audited (it changes nothing). **Known limit:** scenario and
  volatility are not recorded over time, so if you change either for a class
  here, its history is redrawn with the new setting.
- Stock info level: what students see in the stock info popup when they click
  a symbol on the Market page. **Grade default** follows the grade level
  (**Full** for grades 9-12; **Basic** for younger grades or when no grade is
  known). **Basic** shows price, a one-month chart and a plain description.
  **Full** adds key figures, sector, news headlines and more chart ranges.
  The class's teachers can also change it from **Teacher market controls**;
  each change is audited. Teachers and admins always see Full. The popup's
  content is sample data in this version.
- Teacher controls enabled/disabled. When on, the class's teachers can use
  the **Teacher market controls** panel on the Market page to raise or lower
  symbols and trigger the Strait of Hormuz scenario for the class, all their
  classes, a group of students, or one student. Students see and trade at the
  changed prices until the teacher clicks **Undo** or **Reset to normal**.
  When off, the class doesn't appear in its teachers' panel (changes already
  made stay until an admin resets them). Admins can use the panel on the
  Market page for any class. Each change, undo and reset is audited as
  `market_change.created`, `market_change.undone` and `market_change.reset`.
- Allowed symbols (also the symbols students can trade)
- Allowed asset types

Simulation modes:

- `Shared provider`: uses centrally cached provider market data.
- `Teacher scenario`: applies teacher/admin scenario behavior on top of
  provider or fallback data.
- `Frozen market`: pauses simulated movement for instruction or assessment.

Scenarios:

- `Baseline`
- `Market drop`
- `Growth rally`
- `Rate shock`

Admins can manage all class market contexts. The server also allows teachers to
change their own assigned classes when teacher controls are enabled, but there
is not yet a teacher screen for it, so in practice admins make these changes.
Students can view only their own class market.

Market simulator changes draft locally in the UI and are persisted only when
the admin selects `Save`. This avoids excessive writes and prevents
partial edits from creating noisy audit events.

Production endpoints:

- `GET /api/admin/class-market`
- `POST /api/admin/class-market`
- `GET /api/market`

`/api/market` requires authentication. Students can view only their own class
market. Teachers can view assigned classes. Admins can view district class
markets.

Class market snapshots are not written on ordinary market reads. Snapshots are
created by the scheduled market polling path after successful provider refresh
events. This keeps student page refreshes from creating unbounded write load.

Student and teacher users can open the Market page to view the current class
market table. Students can execute simulated buy/sell actions against portfolio
cash; those actions update recent portfolio activity and the student profile
`Stocks` information box.

Teachers with market controls can use the Market page to raise or lower symbol
prices during instruction. The first built-in world scenario is `Strait of
Hormuz blockade`, which applies a large oil-price shock to teacher-selected
symbols. Energy and oil-service symbols are raised, while travel symbols can be
lowered to model increased fuel costs.

Students trade at the class's current simulated price, served by the
central simulator; trades are checked and saved on the server (see section
16a). The teacher's quick price and scenario controls are not saved yet: they
affect only the teacher's screen and do not change what students trade at.

Audit action:

- `class_market.updated`

## 12. Credential Vault

Use the Credential Vault page to manage secrets required by system integrations.
This includes market API tokens, SSO client secrets, email delivery credentials,
webhook signing secrets, and provider usernames/passwords.

The page tracks metadata only:

- Credential label and provider
- Credential type
- Token placement or authentication style
- District, school, or class scope
- Masked username hint
- Rotation timestamp
- Last-used timestamp
- Status

Secret values are written to backend vault storage and are never returned to the
browser, database list views, logs, exports, or audit context. To rotate a
credential, enter the replacement secret value and save the credential again.

On DigitalOcean, credential creation and rotation happens through the app's
PostgreSQL encrypted credential store. The app encrypts the secret with
AES-256-GCM using `CREDENTIAL_ENCRYPTION_KEY`, stores ciphertext in
`credential_secret_values`, and records a `pg-encrypted://...` reference in the
integration metadata.

Production endpoints:

- `GET /api/admin/credentials`
- `POST /api/admin/credentials`

The endpoints require `Admin portal` permission and audit create, update,
rotate, and delete actions before writing secret values or credential metadata.

## 13. Privacy Posture

Use the Privacy posture page to select the required district posture for student
privacy compliance. This is a configuration aid and does not replace legal
review.

Choose the posture and enter the privacy contact's email, then click **Save**.
Changes are a draft until saved ("Unsaved changes" shows next to the button);
saved changes are recorded in the audit log, and the page shows the saved
setting the next time it's opened. Each save is kept, so earlier settings
remain in the database as history.

The page tracks:

- Selected privacy posture
- Privacy contact
- State/federal privacy alignment notes
- Integration approval expectations
- Audit expectations for exports, corrections, and role changes

Recommended admin process:

1. Select the district posture during onboarding.
2. Enter the district privacy or technology contact.
3. Confirm state-specific student privacy requirements with district counsel or
   policy owners.
4. Revisit posture before enabling external integrations or data exports.
5. Use stricter settings when the district requires vendor approval before data
   leaves the platform.

Production endpoint:

- `POST /api/admin/privacy`

The endpoint requires `Admin portal` permission, accepts only the three
postures on the page (`standard`, `state-restricted`, `district-custom`) and a
valid contact email, and audits posture, privacy contact, state code, actor,
timestamp, and reason.

## 14. Support Cases

The Support page shows open support cases and allows admins to create new cases.

Case fields include:

- Summary
- Category
- Status
- Support contact
- Created date

Current statuses include:

- Pending support
- Pending user

Use support cases for issues such as login problems, roster correction needs,
market data failures, profile issues, messaging moderation questions, or
portfolio correction requests.

Production support should add case ownership, comments, attachments policy,
resolution notes, and notification routing.

Production endpoint:

- `POST /api/admin/support`

The endpoint requires `Admin portal` permission and audits new support case
creation with category, summary, requester, status, actor, and timestamp.

## 14a. View as Student

Use **View as student** to troubleshoot an issue a student or teacher reports
(for example, "this student's trades aren't going through"). You use the app
as that student, with all of their features.

**To start:**

1. Open **View as student** in the Admin portal.
2. Enter the student's email and a reason (for example the support case or
   what the teacher reported).
3. Click **Start viewing as student**. The app reloads as the student.

**While viewing:**

- A banner across the top shows **Viewing as** the student, and you as the
  admin, on every screen. It stays after a page refresh.
- You have the student's full features: their portfolios, Market page,
  trading, allocation, and so on. Admin pages aren't available until you exit.
- **Actions you take are saved to the student's account**, and are marked in
  their portfolio history as "By admin [your name] on the student's behalf",
  so it's always clear what the student did versus what you did. The student
  can see these entries.
- There's no time limit. Viewing ends when you click **Exit** in the banner or
  sign out (sign-in sessions still expire after 8 hours).

**What's recorded:** starting (`view_as.started`, with your reason), each
action (`view_as.action`), and exiting (`view_as.ended`), all in the audit log
under your name. The student is **not notified** that you viewed their
account; only actions you take appear in their history.

**Limits:** only for active **student** accounts (not teachers or admins).
Only users with the Admin role can start it.

Endpoints: `POST /api/admin/view-as` (start: `studentEmail`, `reason`;
`Admin portal` permission and Admin role) and `DELETE /api/admin/view-as`
(exit).

## 15. Password Resets

The Password resets widget opens a popup where an admin enters a user's email
and triggers a reset.

How it works:

1. The admin enters the user's email and clicks **Send reset**. If no user has
   that email, the popup says so and nothing is sent.
2. The user is emailed a link to the **Set a new password** page
   (`/reset-password`). The link works for **30 minutes** and only once.
3. The user enters a new password (at least 10 characters) twice. They are
   signed out of any other devices.
4. They sign in with the new password.

The popup tells the admin whether the email was sent. If email is not set up
(see section 15a), the reset is still created but no email goes out; set up
email and send the reset again. Every reset is recorded in the audit log and
in the email log.

Still to come: forcing a reset on next login, and handing off to district SSO
once SSO is implemented.

Production endpoint:

- `POST /api/admin/password-resets`
- `POST /api/auth/reset-password`

The admin endpoint requires `Admin portal` permission, creates an audited
reset request with a hashed token and expiration, and emails the link. The
reset completion endpoint accepts the token and a new password, updates the
credential, clears `forceReset`, signs the user out of other sessions, and
marks the reset request complete.

## 15a. Email

FutureFund sends email (password resets now; forwarded flagged messages later)
through **Resend**, an email service, using its web API. DigitalOcean blocks
the usual email ports (SMTP), so the app sends over HTTPS instead.

### Setting up email

1. Create a Resend account at resend.com (the free plan allows 3,000 emails a
   month, 100 a day).
2. In Resend, add and verify the domain you will send from (for example
   `futurefundclassroom.com` or a school domain) by adding the DNS records
   Resend gives you. Until a domain is verified, Resend only delivers to your
   own Resend account address.
3. In Resend, create an API key.
4. In DigitalOcean (App → Settings → **web** component → Environment
   Variables), add:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | the API key, with **Encrypt** checked |
| `EMAIL_FROM` | the sender, e.g. `FutureFund Classroom <no-reply@yourdomain.org>`; its domain must be verified in Resend |
| `APP_BASE_URL` (optional) | the site's public address, e.g. `https://classroom.yourdomain.org`, used in email links. If not set, the address the admin is using is used. |

5. Save. DigitalOcean redeploys the app.

### The Email page

Open **Email** in the Admin portal to:

- See whether email is set up, and which settings are missing if not.
- **Send a test email** (to yourself by default). Check that inbox.
- Review **recent emails**: when, to whom, what kind (test, password reset),
  and whether each was sent or failed. Hover a failed row to see why.

The log never stores message contents, because emails can contain reset links
and student information. Test sends are recorded in the audit log
(`email.test_sent`).

If email is not set up, nothing is sent. On a developer's computer the email
is printed to the server log instead, so it can be tested; on the live site
nothing is printed.

Endpoint: `GET /api/admin/email` (status and recent emails),
`POST /api/admin/email` (send a test). Both require `Admin portal`
permission.

## 16. Portfolio Corrections

Use Portfolio corrections when a student's simulated portfolio needs an
administrative adjustment, such as increasing or decreasing its cash after a
classroom error.

To apply one, open **Portfolio corrections** and enter:

- **Student email**
- **Class**, only if the student has portfolios in more than one class
- **Cash adjustment** in dollars (use a minus sign to decrease)
- **Audit reason**

Click **Apply correction**. The correction applies to the student's portfolio
for that class in the current school year. The page confirms the cash before
and after. A correction can't make cash negative. Each correction is recorded
in the portfolio's activity (the student sees it), the corrections table
(before and after), and the audit log (`portfolio.corrected`).

### Portfolio Reset Requests

Teachers can't reset portfolios themselves; they request a reset from the
Teacher dashboard, and an admin decides. Requests appear under **Portfolio
reset requests** on the Portfolio corrections page, pending first, with the
student, class, school year, who asked, and why.

- **Approve reset:** the portfolio goes back to the class's starting cash
  with no stocks. Nothing is deleted: a "Reset" entry in the portfolio's
  history records what it held before.
- **Deny:** the portfolio is unchanged.

Add an optional note to the teacher. The teacher who asked is emailed the
outcome (if email is set up; see section 15a). Requests, approvals, and
denials are recorded in the audit log (`portfolio_reset.requested`,
`portfolio_reset.approved`, `portfolio_reset.denied`).

Operating rules:

- Use portfolio corrections only for simulated educational balances.
- Require a plain-language reason for every correction.
- Preserve before and after snapshots in production.
- Notify the teacher when a correction affects class scoring or quest outcomes.
- Do not use corrections to reward or penalize students outside the defined
  learning quest rules unless the district explicitly approves that policy.

Endpoints:

- `POST /api/admin/portfolio-corrections` (`Portfolio corrections`
  permission): student email, optional class, amount, reason.
- `GET/POST /api/admin/portfolio-resets` (`Admin portal` permission): the
  reset queue, and approve/deny.
- `GET/POST /api/portfolios/reset-requests` (`Teacher portal` permission):
  a teacher's students and requests, and new requests (own classes only).

## 16a. Student Portfolios and School Years

**How portfolios are organized.** Each student has one long-term profile.
Every class they're assigned to gets a portfolio per school year, created the
first time they sign in that year, with that class's starting cash. Staff
(teachers, admins) get a "Practice" portfolio for the Student view, which
allows fractional shares.

Portfolios are never deleted. After the school year's last day, that year's
portfolios become **read-only records** that students can review but not
trade in. This builds each student's multi-year record.

**School year.** Open **School year** in the Admin portal to set the first and
last day (default **August 28 – June 1**). Portfolios are labeled by school
year (e.g. "2026–27"); summer dates count toward the upcoming year. Changes
are audited (`school_year.updated`). Set this before the year starts: it
decides which year new portfolios are labeled with, and when portfolios
become read-only.

**Trading rules** (enforced on the server):

- Prices come from the class's simulated market; only that class's allowed
  symbols can be traded.
- No spending more cash than the portfolio has; no selling more than it holds.
- Whole shares only, unless the class's grade level is 10 or above
  (fractional shares, up to 4 decimal places).
- No trading in read-only (ended) school years.

Endpoints: `GET /api/portfolios` (the signed-in user's portfolios),
`POST /api/portfolios/trade`, `POST /api/portfolios/allocation`,
`GET/POST /api/admin/school-year`.

## 17. Monitoring and Logs

The Monitoring page gives admins visibility into:

- Open errors
- Slow calls
- Integration health

The app currently includes frontend error reporting, performance reporting, and
OTEL-ready span hooks. Monitoring data includes date and time stamps so admins
can match issues to classroom activity.

In this version, the Monitoring pages (Open Errors, Slow Calls, Integration
Health) show built-in sample data, not the app's live errors or timings. The
audit log is available only through the endpoint below; there is no audit log
screen yet.

Audit endpoint:

- `GET /api/admin/audit`

The endpoint requires `Admin portal` permission and returns recent admin audit
events.

### Open Errors

Open Errors launches a page where admins can examine an error. Error details
include:

- Error message
- Severity
- Source
- Route
- User role
- Trace ID
- Timestamp
- Related logs
- User information context

### Slow Calls

Slow Calls shows a table and line graph for performance events. Admins can
filter by call type and review:

- Route
- Operation
- Duration in milliseconds
- Status
- Trace ID
- Timestamp

Use this page to detect pages or APIs that are slow during peak classroom use.

### Integration Health

Integration Health shows average round trip time for configured integrations and
a table with:

- Connection name
- Round trip time in milliseconds
- Error count or status
- Last checked timestamp
- Download logs link

The logs download is modeled as a ZIP export for support and troubleshooting.
Production log exports should redact secrets, tokens, student-sensitive data,
and unnecessary request payloads.

## 18. Retention, Export, and Deletion

District data requests should be handled through a controlled retention
workflow. The MVP now includes a production-shaped endpoint for requesting
exports and deletions:

- `POST /api/admin/retention`

The endpoint requires `Admin portal` permission and creates an audited retention
plan for a student, teacher, classroom, school, or district target. There is no
screen for this yet; it is called directly.

Export workflow:

1. Verify the requester's authority.
2. Collect relevant profile, roster, portfolio, quest, message, and audit
   records.
3. Redact secrets and unrelated student data.
4. Package the export for secure district delivery.
5. Record completion in the audit trail.

Deletion workflow:

1. Verify district authorization and retention obligations.
2. Export records required by contract before deletion.
3. Delete or anonymize eligible records.
4. Confirm deletion in an isolated verification step.
5. Record the deletion audit event.

Production retention must be aligned to each district contract and applicable
state/federal student privacy obligations.

## 19. Moderation Review

The app supports saved text-only direct messages and classroom discussions with
a server-side language filter. Flagged messages are reviewed by teachers and
admins (see "Messaging" above). A queue for blocked attempts is not built yet.

Production endpoint:

- `POST /api/admin/moderation`

The endpoint requires `Teacher portal` permission, which means teachers and
admins can review classroom messages. Reviews support allow, block, and escalate
actions, and every review creates an audit event. There is no review queue
screen for it yet; use the flag review on the Teacher dashboard and the Admin
Messaging page.

Moderation review process:

1. Review message body, sender, room/conversation, timestamp, and matched terms.
2. Allow messages that were incorrectly blocked.
3. Block messages that violate classroom policy.
4. Escalate messages that require administrator, counselor, or district review.
5. Keep moderation notes factual and minimal.

## 20. Backup, Restore, and Incident Response

The Cloud Run infrastructure provisions Cloud SQL with backups and point-in-time
recovery settings. Production operations should test restore procedures before a
district pilot.

Backup and restore-test endpoint:

- `POST /api/admin/operations/backup`

Incident endpoint:

- `POST /api/admin/operations/incidents`

Neither has a screen yet; they are called directly.

Backup procedure:

1. Confirm the latest Cloud SQL automated backup completed.
2. Confirm the point-in-time recovery window matches district requirements.
3. Record backup location and timestamp.
4. Periodically run a restore into an isolated project or database.
5. Verify migrations, login, admin portal, quest data, messaging data, and
   portfolio data after restore.

Incident response procedure:

1. Triage severity and district impact.
2. Preserve logs, trace IDs, request IDs, and relevant audit events.
3. Contain the issue through rollback, integration disablement, permission
   change, or traffic control.
4. Notify the district contact if availability, student data, messaging, or
   classroom workflows are affected.
5. Resolve the issue and document follow-up work.
6. Create a postmortem for critical incidents.

## 21. Deployment and Infrastructure

The Cloud Run infrastructure guide is available at
`docs/cloud-run-infrastructure.md`.

The DigitalOcean App Platform deployment guide is available at
`docs/digitalocean-deployment.md`.

The current deployment package includes:

- `Dockerfile`
- `cloudbuild.yaml`
- Terraform in `infra/cloudrun/`
- App Platform specs: `.do/app.template.yaml` (used by
  `deploy-digitalocean.sh`) and `infra/digitalocean/app.yaml`
- Cloud Run service baseline
- Artifact Registry
- Cloud SQL PostgreSQL
- Secret Manager
- Cloud Scheduler for school-day market polling
- DigitalOcean App Platform service and scheduled job template
- Central class market config and snapshot tables

The app's data layer uses PostgreSQL, with migrations that run automatically
each time the app starts. Validate them against Cloud SQL before using Cloud
Run as the source of truth.

### Optional Demo Data Seed

Staging and demo environments can be populated with a reusable demo data set.
On DigitalOcean this happens automatically at startup when `DEMO_LOGINS=true`
(see section 2). To run it by hand:

```bash
npm run db:seed:demo
```

The seed loads demo schools, users, bcrypt credentials, role assignments,
permission grants, market integrations, class market simulator settings,
quotes, support tickets, privacy posture, monitoring events, and audit records.
It is idempotent and runs the production table setup before inserting records.

Demo accounts (all also require the security question; see section 2):

- Super user (all roles): `demo-user@demo.edu` / `demo-user`
- Student: `avery.johnson@example.edu` / `student-demo`
- More students, all with the password `student-demo`: `noah.kim@example.edu`
  and `sofia.garcia@example.edu` (7th Grade Finance A, Avery's class),
  `maya.patel@example.edu` and `liam.chen@example.edu` (7th Grade Finance B),
  `jordan.lee@example.edu` and `zoe.brooks@example.edu` (8th Grade Investing
  Lab)
- Teacher: `elena.rivera@example.edu` / `teacher-demo`
- Admin: `sam.gordon@example.edu` / `admin-demo`

Running the seed again resets these accounts' passwords to the values above.

**Demo messages (v0.2.14):** the seed also loads sample conversations into
every demo inbox, a discussion room per class, and two flagged messages: one
open on the teacher's dashboard and one already forwarded to the admins
(Admin → Messaging). They use fixed ids and are only added when missing, so
replies, Keep ticks and resolved flags are kept across deploys, and samples
the 90-day cleanup removed return on the next deploy.

**Assume role vs. View as student:** Assume role only changes which portal
you look at; you stay signed in as yourself, so staff-only boxes such as
Teacher market controls still show. **View as student** signs your session in
as that student, with only what the student can see and do.

## 22. Daily Admin Checklist

At the start of the day:

- Confirm the app is available.
- Review Monitoring for open critical errors.
- Check Integration Health for failed market data calls.
- Confirm active class integrations are enabled.
- Confirm class market contexts have the intended scenario and teacher control
  settings.
- Review support cases pending admin or district action.

During the school day:

- Watch for login, roster, or permission issues.
- Use password resets for account access issues.
- Review flagged messages forwarded to admins and pending alternate contact
  requests on the Messaging page.
- Avoid changing market integrations during active quests unless necessary.
- Avoid changing market simulator scenarios during active assessments unless
  the quest design calls for it.

End of day:

- Review slow calls and integration health.
- Close or update support cases.
- Document any portfolio corrections.
- Confirm imports, exports, role changes, and corrections have audit context.

## 23. Semester or Class Rollover Checklist

Before a new class period or semester:

- Update school class and student counts.
- Import or create new users.
- Disable users who should no longer access the app.
- Confirm teacher assignments.
- Review teacher permissions.
- Delete or disable integrations for classes no longer in session.
- Archive or reset class market contexts for classes no longer in session.
- Confirm the **School year** dates for the new year. Last year's portfolios
  become read-only records automatically after the last day.
- Set each new class's **grade level** on the Market Simulator page if its
  name doesn't include it (e.g. "High School Personal Finance").
- Export reusable learning quest templates.
- Review privacy posture before new integrations or vendors are added.

## 24. Production Readiness Gaps

The MVP admin guide reflects the current prototype and near-term infrastructure
package. Before production use with real districts, confirm these items are
fully wired to the selected production database, identity provider, and district
operating procedures:

- Replace local demo auth with district SSO for live school users, and set
  `DEMO_LOGINS` to `false`.
- Save the pages that are not saved yet (see "What Is Saved in This Version").
- Set up email (section 15a) and confirm a test email arrives.
- Continue wiring teacher analytics, quest, and messaging reads to
  production server queries.
- Enforce server-side authorization from the signed session on every protected
  route.
- Store integration credentials only through the Credential Vault and approved
  Secret Manager path.
- Verify retention, export, deletion, backup, restore, and incident procedures
  with the district before launch.
