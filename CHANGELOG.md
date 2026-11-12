# Changelog

All notable changes to FutureFund Classroom. Versions follow
[semantic versioning](https://semver.org/): MAJOR.MINOR.PATCH.

- **Patch** (0.2.3 → 0.2.4): every update during the 0.2 series.
- **Minor** (→ 0.3.0): a milestone chosen by the owner.
- **Major** (→ 1.0.0): a big milestone, such as launching with real schools.

## [0.2.5] - 2026-11-12

### Added
- Browser test suite (Playwright, `tests/e2e/`, 13 tests) covering sign-in,
  the security question and lockout, staying signed in, sign-out, role
  switching, privacy posture, the Email page, and password resets, including
  regression tests for issues #10–#14. Run with `npm run test:e2e`.
- CI on every pull request: lint, type-check baseline, unit tests, and
  browser tests against PostgreSQL, with a test report posted on the pull
  request and screenshots of every browser test as downloadable evidence.
- Type-check baseline (`npm run typecheck:baseline`): fails on new TypeScript
  errors.
- Bug log: GitHub issues with the `bug` label (#10–#15 logged for bugs found
  in v0.2.0–v0.2.4).
- Test report for v0.2.0–v0.2.4 in `docs/test-reports/`.

### Changed
- `CLAUDE.md`: testing rules for every change (browser tests, CI must pass,
  bugs logged as issues with regression tests).

## [0.2.4] - 2026-11-12

### Fixed
- Refreshing the page no longer signs users out: the app restores the session
  (valid for 8 hours) on load.
- **Sign out** now ends the session on the server and clears the session
  cookie.
- The Privacy posture page now saves (with a Save button and audit entry) and
  shows the saved setting when reopened. The server now accepts the same
  posture values the page offers and validates the contact email.

## [0.2.3] - 2026-11-12

### Added
- Email sending through Resend (HTTPS API, since DigitalOcean blocks SMTP),
  configured with `RESEND_API_KEY`, `EMAIL_FROM`, and optional `APP_BASE_URL`.
- Admin portal **Email** page: setup status, send a test email, and a log of
  recent emails (recipient, type, status; never message contents).
- **Set a new password** page (`/reset-password`).

### Changed
- Password resets now email the user a 30-minute, single-use link, and the
  admin popup says whether the email was sent. Resets for unknown emails show
  a clear message instead of an error.
- Versioning: every update in the 0.2 series is a patch bump; minor versions
  are reserved for milestones the owner chooses.

### Fixed
- The demo student `maya.patel@example.edu` could sign in without the demo
  security question (the list had the wrong email). A test now checks the list
  against the demo seed.
- Guides no longer say quest import/export saves quests (it records an audit
  entry only).

## [0.2.2] - 2026-11-12

### Changed
- User Manual and Admin Guide reviewed against the app and corrected. Both now
  say which version they describe and what is and isn't saved yet, cover demo
  login (super user, security question, `DEMO_LOGINS` and
  `DEMO_SECURITY_ANSWER` settings) and the Assume role menu, and fix outdated
  descriptions of teacher market controls, password resets, privacy posture,
  monitoring, and the database.
- Every pull request that changes app behavior must now update the guides too.

## [0.2.1] - 2026-11-12

### Added
- `docs/roadmap.md` with two future goals: teacher life events (with a graded
  student debrief report) and school branding (colors and logos).
- Patch notes are now part of every change, newest at the top of
  `docs/patch-notes.md`.

### Changed
- Every change now gets a version and patch notes, including small process
  and config updates. Documentation-only changes are the exception, except
  changes to the User Manual or Admin Guide, which always get a version.
- Pull requests are always reviewed and merged by the owner.

## [0.2.0] - 2026-11-12

### Added
- Demo super user `demo-user@demo.edu`: an Admin with every permission that
  can use **Assume role** to view the Student, Teacher, and Admin portals.
- Login email field has a dropdown with the demo login.
- Security question ("What city was Sean born in?") required after a demo
  account's password, checked on the server against `DEMO_SECURITY_ANSWER`.
  Five wrong answers lock the account for 15 minutes.
- Demo users are loaded into the database on startup when `DEMO_LOGINS=true`.
- App version shown in small text at the bottom of every page.

### Fixed
- Demo logins failing on the live site: the demo emails now match the
  database, and demo availability is checked at runtime instead of build time.

### Removed
- The separate "Demo accounts" box on the login page (replaced by the dropdown).

## [0.1.0]

- Initial version: student, teacher, and admin portals, market simulator,
  quests, and DigitalOcean / Cloud Run deployment.

[0.2.5]: https://github.com/soco104/investing/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/soco104/investing/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/soco104/investing/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/soco104/investing/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/soco104/investing/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/soco104/investing/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/soco104/investing/releases/tag/v0.1.0
