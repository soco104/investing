# Changelog

All notable changes to FutureFund Classroom. Versions follow
[semantic versioning](https://semver.org/): MAJOR.MINOR.PATCH.

- **Patch** (0.2.3 → 0.2.4): every update during the 0.2 series.
- **Minor** (→ 0.3.0): a milestone chosen by the owner.
- **Major** (→ 1.0.0): a big milestone, such as launching with real schools.

## [0.2.16] - 2026-11-16

### Changed
- **Finding submissions and grades.** In Quest Studio, the Monitor quests
  box now says what clicking a quest does, each quest shows a "View
  submissions and grades" line, and clicking one scrolls to its Submissions
  section, which now sits directly under the list (above "Current draft
  policy"). Nothing about grading itself changed.
- The user manual and patch notes now say where Monitor quests is (a box in
  Quest Studio, not a separate page).

## [0.2.15] - 2026-11-13

### Added
- **Grading quest submissions.** In a quest's Submissions list, teachers give
  points for each scoring rule (whole points, 0 up to the rule's maximum) and
  optional feedback; the total adds up automatically.
- **Draft, then release.** A saved grade is a draft the student can't see.
  **Release grade** shows it to one student; **Release all graded** releases
  every draft for the class.
- **Student grade report.** Once released, the student's quest shows a
  read-only "Your grade" report: feedback, plus the total and per-rule points
  the quest's score visibility allows. Students never get the grading view.
- **Status and average.** Each student shows as Not submitted, Submitted,
  Graded (draft) or Released, and each class shows its average.
- **Early grading is a choice.** Before the due date the form asks the
  teacher to tick "Grade before the due date". If the student edits their
  answer afterwards, the grade is marked "Answer changed since grading".
- **Grades for missing work** are never automatic; a teacher can enter one
  (such as zeros) by hand.
- Teachers of the class and admins can grade and change grades. Audit entries
  `quest.graded`, `quest.grade_changed` (with the old and new totals) and
  `quest.grade_released`.

### Changed
- The Submissions list shows the status badge and a separate "Edited" badge
  (was "Submitted · edited").

## [0.2.14] - 2026-11-13

### Added
- **Buy max** button on every Market row. It buys as many whole shares as the
  portfolio's cash covers and shows that number on the button. The server
  works the number out at the price the trade uses.
- **Stocks value card** on the Market page now totals the shares owned and,
  when clicked, jumps to the Stocks section further down.
- **More demo students** (Noah Kim, Sofia Garcia, Liam Chen, Zoe Brooks), so
  demo students have classmates to message.
- **Demo messages:** every demo inbox has conversations, each class has a
  discussion room, and there are two flagged messages (one open for the
  teacher, one forwarded to the admins) to show the flag review.
- A **"Teachers and admins only"** label on Teacher market controls.

### Changed
- **New message** picker: shows "Loading people…" while it loads, explains
  when nobody is available or loading failed, lists students with their
  class, and puts teachers first for students and students first for staff.

### Checked
- Staff-only features are hidden from students and refused by the server,
  including when an admin uses View as student. A browser test now guards
  this. Teacher market controls appear under "Assume role: Student" only
  because that keeps you signed in as an admin or teacher.

## [0.2.13] - 2026-11-13

### Added
- **Market history (rewind).** A **Market history** button in Teacher market
  controls opens a view-only chart of the selected class's prices over a
  chosen timeframe. Looking back never changes prices, trades or portfolios.
- **Time selector:** Last hour, Today, Past 7 days, Past 30 days, or a custom
  start and end (up to 31 days).
- **Event markers:** teacher price changes and scenarios (and their undos),
  pauses, resumes, speed and hours changes are numbered on the chart and
  listed beneath it with their times.
- **Symbol picker:** one symbol in dollars, or all symbols compared by percent
  change.
- Teachers can open history for their own classes; admins for any class.

### Known limits
- A class's scenario and volatility settings are not recorded over time, so
  the history chart draws the past with the current settings (on the roadmap).
- The chart shows the whole-class price. Changes made for one student or a
  group are listed as events but don't move the line.
- History begins when the running market was first used.

## [0.2.12] - 2026-11-13

### Added
- **Running market.** Each class market now runs on its own clock: prices
  move through the day and the Market screen refreshes every 5 seconds.
  Prices are calculated from the class's simulated time, not stored, and the
  class's volatility setting scales the movement. Scenarios and teacher price
  changes still apply on top.
- **Market Speed label** in the upper left of the Market screen for everyone:
  1x, 2x, 5x, 10x, **Paused** or **Closed**.
- **Pause and Resume** in Teacher market controls. While paused, prices hold,
  students see a "Market paused by your teacher" banner, and the server
  refuses trades.
- **Speed:** teachers run the class market at 1x, 2x, 5x or 10x.
- **Market hours** per class: **Always open** (the default) or **U.S. market
  hours** (9:30 AM to 4:00 PM Eastern, weekdays). When closed, prices hold and
  trading is off.
- Audit entries `market_clock.paused`, `market_clock.resumed`,
  `market_clock.speed_changed`, `market_clock.hours_changed`, and a log of
  clock changes kept for the future rewind feature.

### Changed
- A trade now uses the price at the moment the server receives it, which can
  differ by a few cents from the price on screen a moment earlier. The
  confirmation message shows the price used.
- All classes share one price run. A class's prices drift from other classes'
  once its teacher pauses or changes its speed.

## [0.2.11] - 2026-11-12

### Added
- **Stock info popup.** Click any symbol on the Market screen to see its
  price, today's change, a price chart and a plain-language description, plus
  how much of it you own and a **Trade** button that jumps to its share box.
  All of it is **sample data** for now, and the popup says so.
- **Stock info level** per class: **Basic** (the default for grades 6-8, and
  for classes with no grade level) or **Full** (the default for grades 9-12),
  which adds key figures (market cap, P/E, volume, 52-week range), sector,
  news headlines and more chart ranges (1 day, 1 week, 1 month, 1 year).
  Teachers set it for their classes in **Teacher market controls**; admins set
  it for any class in **Market Simulator**. Teachers and admins always see
  Full. The server sends only what the class's level allows.
- Audit entry `class_market.info_level_updated`.

## [0.2.10] - 2026-11-12

### Added
- **Saved messages.** The Inbox and Discussion rooms now save to the server,
  so messages are still there after a refresh or sign-out. Start a one-to-one
  conversation with **New message**; teachers create discussion rooms for
  their classes.
- **Who can message whom** is enforced on the server: students can message
  classmates and their teachers; teachers can message their students, other
  teachers and admins; admins can message everyone.
- **Teachers and admins can read student conversations** (read-only, under
  **Student conversations**). Students are told this in the Inbox.
- **Keep checkbox** on every message. Messages are deleted after 90 days
  unless someone in the conversation ticked Keep, or the message has an open
  flag. A cleanup runs once a day, and an admin can run it from the Messaging
  page.
- **Flagged messages.** Anyone can flag a message. Messages from students that
  share a phone number, email, address or social account, mention safety
  concerns, or look like bullying are sent but flagged to the teacher
  automatically. Teachers resolve a flag or **forward** it to the admins, to
  an email address on the allowed-domain list, or to a parent on file.
- **Parent or guardian email:** a teacher sends it to the admins, who approve
  it to add it to the student's profile as an alternate contact (or add one
  directly).
- **Admin Messaging page:** flags forwarded to admins, allowed email domains,
  contact requests, contacts on file, and a Run cleanup now button.
- Audit entries for flags, forwards, Keep, allowed domains, alternate
  contacts, and cleanups; messages sent while an admin is viewing as a student
  are marked as sent by the admin.

### Changed
- **Stronger profanity filter,** now checked on the server so it can't be
  bypassed. It catches symbol and number swaps (sh1t, f*ck), spaced-out and
  stretched letters, and common word endings.
- The sample inbox and discussion messages were removed.

## [0.2.9] - 2026-11-12

### Added
- **Saved learning quests.** Quest Studio saves quests to the server; they
  stay after a refresh or sign-out. Each quest belongs to the teacher who made
  it.
- **Quest library:** **See library** opens every teacher's saved quests as a
  list; **Copy** adds one to your own quests to edit and assign. Two sample
  quests are in the demo library.
- **Assign quests** to one or more of your classes with an optional due date.
  Assigned and Submitted counts are real.
- **Students see their assigned quests** on their dashboard (replacing the
  built-in sample quests), with the scoring rules marked visible, and submit a
  reflection. They can edit it until the end of the due date; after that it's
  locked.
- **Comments** on every submission, for the student and their teacher (and
  admins), before and after the due date.
- Teachers see each class's students, submissions and comments under
  **Submissions** for the selected quest.
- Audit entries `quest.saved`, `quest.copied`, `quest.assigned`; view-as
  actions on quests are recorded as `view_as.action`.
- 6 unit tests for quest rules and 6 browser tests for the quest flows.

### Changed
- **Import** now saves imported quests to your quests (as drafts), and checks
  each one first. **Export** downloads your saved quests.
- Quest Studio's **Save draft** button is now **Save quest**. The Monitor
  quests card shows Classes, Hidden and Submitted instead of sample averages.

### Removed
- The built-in sample quests on the student dashboard.

## [0.2.8] - 2026-11-12

### Added
- **Teacher market controls that apply to students.** On the Market page,
  teachers raise or lower a symbol 3% or trigger the Strait of Hormuz scenario
  for **this class**, **all my classes**, **a group of students** (tick boxes),
  or **one student**. Changes are saved and students see and trade at the
  changed prices, with the teacher's news on the symbol.
- **Active changes** list per class with **Undo** for each change and
  **Reset to normal**. Undone changes are kept as records, not deleted.
- Only the teacher's own classes with "Teacher controls" turned on (Market
  Simulator); admins can change any class. Every change, undo and reset is in
  the audit log (`market_change.created`, `market_change.undone`,
  `market_change.reset`).
- 9 unit tests for the price rules and 4 browser tests for the teacher flow.

### Changed
- The teacher's Raise/Lower buttons and scenario box moved into one
  **Teacher market controls** panel; they used to change only the teacher's
  own screen and reset on refresh.

## [0.2.7] - 2026-11-12

### Added
- **View as student:** admins enter a student's email and a reason to use the
  app as that student, with the student's full features, to troubleshoot. A
  banner shows who is viewing as whom, with **Exit**. No time limit; it ends
  on Exit or sign-out.
- Actions taken while viewing are saved to the student's account and marked
  "By admin … on the student's behalf" in the portfolio history. Start, each
  action, and exit are recorded in the audit log (`view_as.started`,
  `view_as.action`, `view_as.ended`). The student is not notified of viewing.
- 2 browser tests for view-as.

### Changed
- Portfolio activity shows trade details together with any note.

## [0.2.6] - 2026-11-12

### Added
- **Student profiles with saved class portfolios.** Each student has one
  long-term profile with a portfolio per assigned class per school year
  (cash, holdings, trades, allocation targets, value history). Past school
  years become read-only records. "Your portfolios" on the Portfolio page lists
  them all.
- **Server-checked trading** at the class's simulated prices, with − / + and an
  amount box on the Market page. Fractional shares (up to 4 decimals) for
  grade 10+ classes; whole shares otherwise.
- **School year setting** (Admin portal, default Aug 28 – Jun 1), and a
  **grade level** per class on the Market Simulator page.
- **Portfolio reset requests:** teachers request, admins approve or deny,
  teachers are emailed the outcome; history is kept.
- **Practice portfolio** for staff in the Student view.
- 11 browser tests and 18 unit tests for portfolios, trading rules, and school
  years.

### Changed
- The Market page shows the class's simulated prices from the server.
- Admin portfolio corrections now apply to a chosen student's current class
  portfolio (by email), with before and after cash recorded.
- Browser test setup clears saved portfolios before each run; lint ignores
  generated test reports.

### Removed
- The sample $525 portfolio, sample trades, and sample chart for students
  (replaced by each student's saved portfolio).

### Fixed
- School year dialog: a slow load could overwrite dates the admin had just
  changed (issue #19, caught by CI before release).

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

### Fixed
- The health check unit test only passed when no database was configured; it
  now sets up its own environment (issue #17, caught by the first CI run).

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

[0.2.16]: https://github.com/soco104/investing/compare/v0.2.15...v0.2.16
[0.2.15]: https://github.com/soco104/investing/compare/v0.2.14...v0.2.15
[0.2.14]: https://github.com/soco104/investing/compare/v0.2.13...v0.2.14
[0.2.13]: https://github.com/soco104/investing/compare/v0.2.12...v0.2.13
[0.2.12]: https://github.com/soco104/investing/compare/v0.2.11...v0.2.12
[0.2.11]: https://github.com/soco104/investing/compare/v0.2.10...v0.2.11
[0.2.10]: https://github.com/soco104/investing/compare/v0.2.9...v0.2.10
[0.2.9]: https://github.com/soco104/investing/compare/v0.2.8...v0.2.9
[0.2.8]: https://github.com/soco104/investing/compare/v0.2.7...v0.2.8
[0.2.7]: https://github.com/soco104/investing/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/soco104/investing/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/soco104/investing/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/soco104/investing/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/soco104/investing/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/soco104/investing/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/soco104/investing/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/soco104/investing/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/soco104/investing/releases/tag/v0.1.0
