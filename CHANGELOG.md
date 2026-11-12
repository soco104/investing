# Changelog

All notable changes to FutureFund Classroom. Versions follow
[semantic versioning](https://semver.org/): MAJOR.MINOR.PATCH.

- **Minor** (0.2.0 → 0.3.0): a new feature or noticeable change.
- **Patch** (0.2.0 → 0.2.1): a bug fix or small tweak.
- **Major** (→ 1.0.0): a big milestone, such as launching with real schools.

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

[0.2.2]: https://github.com/soco104/investing/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/soco104/investing/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/soco104/investing/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/soco104/investing/releases/tag/v0.1.0
