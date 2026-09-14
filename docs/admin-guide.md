# FutureFund Classroom Admin Guide

This guide explains how district or system administrators operate and configure
the FutureFund Classroom MVP. It is written for the current web MVP and should be
updated as the prototype moves from in-memory demo flows to production-backed
services.

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

The local login screen can accept role-based demo accounts and routes users to
the allowed role surface. The app includes three role families:

- `Student`: student dashboard, portfolio, learning quests, profile, inbox, and
  classroom discussions.
- `Teacher`: teacher dashboard, class progress, quest studio, student analytics,
  teacher profile, inbox, and learning quest import/export when permitted.
- `Admin`: admin portal, system configuration, monitoring, support, user
  management, integrations, privacy, password resets, and portfolio corrections.

The password login API is implemented at `/api/auth/login`. Production
deployments should use persisted user credentials, hardened session storage, and
district SSO. Demo login is disabled in production unless a controlled demo
deployment explicitly opts in. District OIDC SSO can start when the configured
identity provider values are present; callback token exchange and assertion
validation still need to be matched to the district identity provider before
live rollout.

## 3. Role and Permission Model

Admins can use the role selector in the app header to view permitted role
surfaces. Admin users do not need the left-side student or teacher profile card;
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
- Privacy posture
- Password resets
- Portfolio corrections
- Learning quest import/export

Each widget opens either a page, drilldown panel, or popup for the related task.
When an admin action affects access, integrations, support, privacy, or
portfolio balances, the production implementation should write an audit event.

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

Admins can create users one at a time or import users from a CSV.

Production endpoint:

- `POST /api/admin/users`

This endpoint requires an authenticated session with `Admin portal` permission
and records an admin audit event for create, import, enable, or disable actions.

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
- Teacher inbox
- Message link

Admin profiles show system-level identity and permissions rather than a student
or teacher profile card.

The app supports text-only direct inbox conversations and classroom discussion
rooms. A first-pass profanity filter blocks messages containing disallowed
language. Production moderation should expand this into configurable policy,
audit logs, review queues, and district-specific retention rules.

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
4. Record the reason in the production audit log.
5. Ask the user to sign out and back in if their session does not update.

Admin permissions are intentionally locked on in the MVP. In production, admin
rights should be scoped by district and protected with strong authentication.

Production endpoint:

- `POST /api/admin/permissions`

The endpoint requires `Admin portal` permission and records the target user,
permission key, enabled state, actor, timestamp, and reason in the audit trail.

## 9. Learning Quest Administration

Teachers create and modify learning quests from the Teacher portal. Admins can
review templates and import/export learning quests for district reuse.

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

Teachers and admins with `Quest import/export` rights can export quest templates
as JSON and import valid quest JSON into the current template list.

Recommended process:

1. Export known-good quest templates before district-wide reuse.
2. Store reviewed templates in a district-controlled repository or document
   library.
3. Import templates into the target environment.
4. Review market parameters and scoring visibility before assigning to classes.

Production imports should validate schema version, author, district ownership,
and unsafe content before saving.

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
- Starting cash
- Teacher controls enabled/disabled
- Allowed symbols
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

Admins can manage all class market contexts. Teachers can manage only assigned
classes when teacher controls are enabled by district policy. Students can view
only their own class market.

Market simulator changes draft locally in the UI and are persisted only when
the admin or teacher selects `Save`. This avoids excessive writes and prevents
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

Production endpoints:

- `GET /api/admin/credentials`
- `POST /api/admin/credentials`

The endpoints require `Admin portal` permission and audit create, update,
rotate, and delete actions before writing secret values or credential metadata.

## 13. Privacy Posture

Use the Privacy posture page to select the required district posture for student
privacy compliance. This is a configuration aid and does not replace legal
review.

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

The endpoint requires `Admin portal` permission and audits posture, privacy
contact, state code, actor, timestamp, and reason.

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

## 15. Password Resets

The Password resets widget opens a popup where an admin enters a user's email
and triggers a reset.

Current behavior is a frontend simulation that confirms the reset request.
Production behavior should:

- Verify the email belongs to an active district user.
- Create a password reset request record.
- Send a time-limited reset link through an approved email provider.
- Force reset on next login when appropriate.
- Log the requesting admin, target user, timestamp, and result.
- Hand off to district SSO once SSO is implemented.

Production endpoint:

- `POST /api/admin/password-resets`
- `POST /api/auth/reset-password`

The admin endpoint requires `Admin portal` permission and creates an audited
reset request with a hashed token and expiration. The reset completion endpoint
accepts the token and a new password, updates the credential, clears
`forceReset`, and marks the reset request complete. Email delivery remains the
piece that needs a district-approved email provider.

## 16. Portfolio Corrections

Use Portfolio corrections when a student's simulated portfolio needs an
administrative adjustment, such as increasing or decreasing portfolio value
after a classroom error or test scenario reset.

Correction fields include:

- Adjustment amount
- Audit reason
- Target simulated portfolio

Operating rules:

- Use portfolio corrections only for simulated educational balances.
- Require a plain-language reason for every correction.
- Preserve before and after snapshots in production.
- Notify the teacher when a correction affects class scoring or quest outcomes.
- Do not use corrections to reward or penalize students outside the defined
  learning quest rules unless the district explicitly approves that policy.

Production endpoint:

- `POST /api/admin/portfolio-corrections`

The endpoint requires `Portfolio corrections` permission and audits the
portfolio id, adjustment amount, before/after snapshots, actor, timestamp, and
reason.

## 17. Monitoring and Logs

The Monitoring page gives admins visibility into:

- Open errors
- Slow calls
- Integration health

The app currently includes frontend error reporting, performance reporting, and
OTEL-ready span hooks. Monitoring data includes date and time stamps so admins
can match issues to classroom activity.

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
plan for a student, teacher, classroom, school, or district target.

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

The app supports text-only direct messages and classroom discussions with a
first-pass profanity filter. Production moderation should give teachers and
admins a review queue for blocked or escalated items.

Production endpoint:

- `POST /api/admin/moderation`

The endpoint requires `Teacher portal` permission, which means teachers and
admins can review classroom messages. Reviews support allow, block, and escalate
actions, and every review creates an audit event.

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

The current deployment package includes:

- `Dockerfile`
- `cloudbuild.yaml`
- Terraform in `infra/cloudrun/`
- Cloud Run service baseline
- Artifact Registry
- Cloud SQL PostgreSQL
- Secret Manager
- Cloud Scheduler for school-day market polling
- Central class market config and snapshot tables

Important production note: the current app schema and demo flows are still
SQLite/D1-shaped in code. The Cloud Run package provisions Cloud SQL
PostgreSQL as the production target, but the app data access and migrations
should be ported and validated before using Cloud SQL as the source of truth.

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
- Review messaging or discussion moderation concerns escalated by teachers.
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
- Export reusable learning quest templates.
- Review privacy posture before new integrations or vendors are added.

## 24. Production Readiness Gaps

The MVP admin guide reflects the current prototype and near-term infrastructure
package. Before production use with real districts, confirm these items are
fully wired to the selected production database, identity provider, and district
operating procedures:

- Replace local demo auth with district SSO for live school users.
- Continue wiring student, teacher, quest, portfolio, and messaging reads to
  production server queries.
- Enforce server-side authorization from the signed session on every protected
  route.
- Store integration credentials only through the Credential Vault and approved
  Secret Manager path.
- Verify retention, export, deletion, backup, restore, and incident procedures
  with the district before launch.
