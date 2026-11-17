# FutureFund Classroom Patch Notes

Newest updates are at the top. Each entry is headed with its version and date.

## v0.2.19 — 2026-11-16

### Market Events (Teachers)

- **Market events** in Teacher market controls starts a ready-made event for
  your class: **Recession**, **Inflation spike**, **Rate cut**, **Sector
  shock: tech selloff**, or **Company scandal** (choose the company's symbol).
  Each symbol moves by an amount that fits what it is: in a recession, for
  example, stocks fall (risky ones most) and bonds rise a little.
- Choose a **Difficulty**: Gentle (half as big), Realistic, or Tough (half
  again as big).
- Undo it under **Active changes**, like any other change.

### Life Events (Teachers)

- **Difficulty** now scales deck cards too: a Tough 8% car repair costs 12%.
- **Surprise me** picks a random card for you.
- **Combos:** choose **Also start a market event** to play a market event for
  the whole class with the card, or click a ready-made combo: **Recession +
  hours cut**, **Inflation spike + rent increase**, or **Tech selloff + fridge
  breakdown**. Undo the card under Played events and the market event under
  Active changes.
- **Settings to change:** none.

## v0.2.18 — 2026-11-16

### Debriefs (Teachers)

- When you play a life event card, tick **Require a debrief report** and pick
  a **due date** (or leave it empty for none).
- Each student it hits gets an **Inbox message** from you explaining what
  happened to them: the event, the amount, their cash before and after, and
  three questions to answer. Grades 6-8 get simpler questions.
- Under **Played events**, click **Debriefs** to read each student's report
  next to what happened to them, with a count of who couldn't cover the cost
  and who went into debt.
- Click **Grade** to score a debrief out of 10: explains what happened (4),
  uses evidence from their portfolio (3), and makes a realistic plan (3), plus
  feedback. Grades are drafts until you click **Release grade** or **Release
  all graded**. Grading before the due date asks you to tick a box first.
- Undoing an event removes debriefs that nobody had written yet.

### Debriefs (Students)

- If your teacher asks for a debrief, you'll get an Inbox message, and the
  **Life happens** box on your Market page shows the questions and a box to
  write your answer. Click **Submit debrief**; you can change it until the due
  date. When your teacher releases your grade, it shows there too.

### Admins

- Admins can require, read, grade and release debriefs for any class. Every
  submission, grade and release is in the audit log.
- **Settings to change:** none.

## v0.2.17 — 2026-11-16

### Life Events (Teachers)

- A new **Life events** box sits under Teacher market controls on the Market
  page. Use it to throw a wrench into students' finances: a surprise bill or a
  windfall that changes their cash.
- **Pick a card** from the deck (expenses and windfalls, each a percent of
  starting cash) or choose **Write my own** to set a title, a description, and
  an expense or windfall percent.
- **Who it hits:** the whole class, a random handful (you pick how many), or
  one student.
- Click **Preview** to see who is hit and by how much. Nothing changes until
  you click **Play this card**.
- **Undo** under Played events puts every student's cash back.
- Amounts are a **percent of each student's starting cash**. Grades 9-12 can
  go into debt (cash below $0). Grades 6-8 stop at $0, and the card takes what
  is there.
- Playing a card at the whole class includes students who haven't signed in
  yet; a portfolio is opened for them.

### Life Happens (Students)

- When your teacher plays a card on you, a **Life happens** box appears at the
  top of your Market page with what happened, the amount, and a question to
  think about. Your cash changes right away, and the event shows in your
  portfolio activity.

### Admins

- Admins can play and undo cards for any class. Every play and undo is in the
  audit log.
- **Settings to change:** none. Life events use each class's **grade level**
  (Admin → Market Simulator) to decide whether debt is allowed, and need
  **Teacher controls** on for the teacher to use them.

## v0.2.16 — 2026-11-16

### Quest Studio (Teachers)

- **Where to find submissions and grades:** they are in **Quest Studio**, in
  the **Monitor quests** box on the right (not a separate page). Click a quest
  there and the page scrolls to its **Submissions** section, which now sits
  directly under the list.
- Each quest in Monitor quests shows **View submissions and grades** so it's
  clear what clicking does.
- **Settings to change:** none.

## v0.2.15 — 2026-11-13

### Grading Quests (Teachers)

- Open a quest under **Monitor quests** to see **Submissions**. Each student
  now has a **Grade** box. Click **Grade**, give points for each scoring rule
  (whole points up to the rule's maximum), and add **feedback** if you like.
  The total adds up for you.
- Grades are saved as **drafts** that students can't see. Click **Release
  grade** for one student, or **Release all graded** for the class.
- You can **Change grade** later. If it was already released, the student
  sees the new grade straight away.
- Each student shows as **Not submitted**, **Submitted**, **Graded (draft)**
  or **Released**, and each class shows its **average**.
- **Before the due date** students can still change their answer, so the form
  asks you to tick **Grade before the due date** first. If a student edits
  their answer after you graded it, you'll see **Answer changed since
  grading**.
- A student who didn't submit gets no grade automatically. Click **Enter a
  grade** if you want to record one, such as zeros.

### Quest Grades (Students)

- When your teacher releases your grade, the quest shows **Graded** on your
  list, and opening it shows **Your grade**: your teacher's feedback, and your
  points if the quest shares them. You'll see points per scoring rule only for
  quests set to show the full breakdown, and never rules your teacher keeps
  hidden.

### Admins

- Admins can grade and change grades for any class. Every grade, change and
  release is in the audit log.
- **Settings to change:** none. What students see of their score still
  follows each quest's **score visibility** setting (hidden, summary or full).

## v0.2.14 — 2026-11-13

### Market (Everyone)

- **Buy max:** each row on the Market page has a **Buy max** button next to
  Buy and Sell. The number in brackets is how many whole shares your cash
  covers. Clicking it buys that many straight away, and the confirmation
  shows how many you got and the price. It is greyed out when you can't
  afford a whole share.
- **Stocks value** card: now shows how many shares you own across how many
  stocks. Click it to jump to the **Stocks** list further down the page.

### Messages (Everyone)

- **New message** now says "Loading people…" while the list loads, and tells
  you if nobody is available. Students appear with their class.
- Students see their teachers and classmates. Teachers see every student in
  their classes, other teachers and the admins. Admins see everyone.

### Demo Data (Admins)

- Four more demo students (Noah Kim and Sofia Garcia in 7th Grade Finance A,
  Liam Chen in 7th Grade Finance B, Zoe Brooks in 8th Grade Investing Lab),
  all with the password `student-demo` and the security question.
- Every demo inbox has sample conversations, each class has a discussion
  room, and there are two **flagged messages** to try the review on: an open
  one on the teacher's dashboard (a shared phone number) and one already
  forwarded to the admins (Admin → Messaging).
- These load when the app starts with demo logins on. Replies you add are
  kept; sample messages removed by the 90-day cleanup come back on the next
  deploy.

### Staff-only Features (Teachers and Admins)

- We checked that students can't see or use teacher or admin features, on
  screen or directly through the server, including when an admin uses **View
  as student**. Nothing was exposed.
- **Assume role: Student** is different: you stay signed in as yourself, so
  **Teacher market controls** still shows on the Market page. It is now
  labelled **Teachers and admins only**. To see exactly what a student sees,
  admins should use **View as student**.
- **Settings to change:** none.

## v0.2.13 — 2026-11-13

### Market History (Teachers)

- **Market history** under Teacher market controls (in the Market clock box)
  opens a chart of your class's prices over time, for looking back at what
  happened in a lesson.
- Pick the timeframe with **Last hour**, **Today**, **Past 7 days** or **Past
  30 days**, or set your own **From** and **To** and click **Show this
  timeframe** (up to 31 days).
- Your price changes, scenarios, pauses and speed changes are numbered on the
  chart and listed below it under **What happened**.
- Choose one symbol to see its price in dollars, or **All symbols** to compare
  them by percent change.
- This is **view-only**: looking back never changes prices, trades or anyone's
  portfolio, and the live market keeps running.
- The chart shows what the whole class saw. A change you made for one student
  or a group is listed, but doesn't move the line.

### Admins

- Admins can open Market history for any class.
- **Settings to change:** none. History begins when the running market was
  first used (v0.2.12).
- **Good to know:** if you change a class's **scenario** or **volatility** in
  Market Simulator, Market history redraws that class's past using the new
  setting. Teacher changes, pauses and speeds replay exactly as they happened.

## v0.2.12 — 2026-11-13

### Running Market (Everyone)

- The class market now **runs on its own**: prices move through the day and
  the Market screen updates by itself every few seconds.
- A **Market Speed** label in the upper left of the Market screen shows how
  fast the market is running (1x, 2x, 5x or 10x), or **Paused** or **Closed**.
- When your teacher pauses the market, or the market is closed, prices hold
  still and **trading is off** until it starts again.
- Because prices keep moving, a trade uses the price at the moment you click,
  which can be a few cents different from what you saw a moment before. The
  confirmation message shows the price you got.

### Market Clock (Teachers)

- **Pause market** and **Resume market** under Teacher market controls freeze
  and restart your class's market, for a discussion or a quiz. Students see a
  "Market paused by your teacher" banner.
- **Speed:** run the market at 1x, 2x, 5x or 10x. Students always see the
  current speed.
- **Market hours:** choose **Always open** (the default) or **U.S. market
  hours** (9:30 AM to 4:00 PM Eastern, weekdays; holidays are not skipped).
- The clock applies to the whole class. Your own practice portfolio follows
  your first class's market, so pausing that class pauses your practice
  trading too.

### Admins

- Admins can use the same controls for any class. Pause, resume, speed and
  hours changes are in the audit log.
- **Settings to change:** none required. Classes start as Always open at 1x.
  Classes set to the **Frozen** simulation mode stay still, as before, and a
  class with **Teacher controls** turned off can't be paused by its teacher.

## v0.2.11 — 2026-11-12

### Stock Info (Everyone)

- Click any symbol on the **Market** screen to open its **stock info** popup:
  price, today's change, a price chart, and a plain-language description of
  what it is. It also shows how much of it you own, with a **Trade** button
  that takes you to that symbol's share box.
- The information is **sample data** for now (the popup says so). Real company
  data comes in a later version.

### Stock Info Level (Teachers and Admins)

- Each class has a **Stock info level**. **Basic** (the default for grades
  6–8) shows the essentials. **Full** (the default for grades 9–12) adds longer
  chart ranges, key figures such as market cap and P/E, sector, and news
  headlines.
- Teachers: change it for your class with **Stock info level** under
  **Teacher market controls** on the Market page. It saves as soon as you pick.
- Admins: change it for any class in **Market Simulator** (the **Stock info
  level** column), then save the class.
- Teachers and admins always see the Full version themselves.
- **Settings to change:** none required. Check that each class's grade level is
  set (Admin → Market Simulator), since the default level comes from it. A
  class with no grade level gets Basic.

## v0.2.10 — 2026-11-12

### Messages and Discussions (Everyone)

- Your **Inbox** and **Discussion** rooms are now **saved**. Messages are still
  there after a refresh or sign-out.
- Choose **New message** to pick someone to write to. You'll only see people
  you're allowed to message: students see classmates and their teachers;
  teachers see their students, other teachers and admins; admins see everyone.
- Teachers create discussion rooms for their classes with **New discussion
  room**.
- Tick **Keep** on a message to stop it being deleted. Messages are removed
  after **90 days** unless someone in the conversation ticked Keep (or the
  message has an open flag).
- Use **Flag** on any message that worries you. Messages that share personal
  details (a phone number, email, address or social account) or suggest
  bullying or a safety concern are sent, but the teacher is notified
  automatically.
- The language filter is stronger and now runs on the server. If a message is
  blocked, rewrite it using respectful classroom language.
- Students: teachers can read your conversations. The Inbox says so.

### Teachers

- **Student conversations** (in the Inbox) shows read-only conversations
  involving your students.
- **Flagged messages** on your dashboard lists flags with the messages around
  them. **Resolve** a flag, or **Forward** it to the admins, to an email address
  on the allowed list, or to a parent on file.
- **Parent or guardian email:** send it to the admins to add to the student's
  profile as an alternate contact.

### Admin Messaging (Admins)

- A new **Messaging** page in the Admin portal has: flags forwarded to admins,
  **Allowed email domains** (teachers can only forward flagged messages by
  email to these, or to a parent on file), contact requests to approve or deny,
  alternate contacts on file, and **Run cleanup now** for the 90-day deletion.
- **Settings to change:** add your district's email domain(s) under Allowed
  email domains, otherwise teachers can forward only to admins or to parents on
  file. Email sending needs the Email setup (Resend) from the Email page.
- The 90-day cleanup runs by itself once a day while the app is in use.

## v0.2.9 — 2026-11-12

### Learning Quests (Teachers)

- Quests you create or edit in **Quest Studio are now saved**. Click **Save
  quest**; they're still there after a refresh or sign-out.
- **See library** opens every teacher's saved quests as a list. Click **Copy**
  to add one to your own quests, then edit it and assign it.
- **Assign** (in Quest Studio, or **Assign quest** on the class roster): tick
  one or more of your classes and, optionally, a due date. Assigning to the
  same class again changes its due date.
- Pick a quest under **Monitor quests** to see **Submissions**: each student,
  what they submitted (and whether they edited it), and a **Comments** section
  where you can reply.
- **Import** now saves the quests you paste into your own quests (as drafts),
  and **Export** downloads your saved quests. Grading submissions is coming in
  a later update.

### Learning Quests (Students)

- Your dashboard's **Learning quests** now shows the quests your teacher
  assigned to your class, with the due date and the scoring rules your teacher
  chose to show.
- Open a quest, write your reflection, and click **Submit**. You can change it
  and click **Save changes** until the end of the due date. After that it's
  locked.
- Once you've submitted, a **Comments** section lets you and your teacher talk
  about your work, even after the due date.

## v0.2.8 — 2026-11-12

### Teacher Market Controls

- Teacher market changes **now apply to your students** and are **saved**.
  Before, Raise/Lower and the Strait of Hormuz scenario only changed your own
  screen.
- On the **Market** page, use the **Teacher market controls** panel:
  1. Pick the **Class market**.
  2. Pick **Who it applies to**: this class, all my classes, a group of
     students (tick their names), or one student.
  3. Click **Raise** or **Lower** next to a symbol (3% each click), or set the
     affected symbols and oil spike % and click **Trigger scenario**.
- Students see the new price and your news line on their Market page, and
  their trades use the changed price. Changes stack (two raises = about +6%).
- **Active changes** lists what's in effect. Click **Undo** to remove one
  change, or **Reset to normal** to clear them all for that class.
- If a class isn't listed, its **Teacher controls** setting is off; an admin
  can turn it on in **Market Simulator**. Admins can change any class's market.
- Every change, undo and reset is recorded in the audit log.

## v0.2.7 — 2026-11-12

### View as Student (Admins)

- Admins can now **view the app as a specific student** to troubleshoot a
  reported problem: Admin portal → **View as student**, enter the student's
  email and a reason. The app reloads as that student, with all their
  features.
- A banner at the top shows you're viewing as the student. Click **Exit** to go
  back to your own account. There's no time limit.
- Anything you do while viewing (like a trade) is saved to the student's
  account and shown in their portfolio history as done **by you on the
  student's behalf**. Starting, exiting, and every action are recorded in the
  audit log. Students aren't notified when an admin views their account.

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

### Fixes

- The new School year window waits until the saved dates have loaded before
  you can save, so a slow connection can't overwrite your changes (issue #19,
  caught by automatic testing before release).

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
