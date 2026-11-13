# FutureFund Classroom Roadmap

Future-state goals. These are directions to evaluate, not committed work. When
an item is picked up, it gets a plan (with draft patch notes) and a version
like any other change.

## Goal: Teacher "wrenches" — life events that test portfolio management

**Added:** 2026-11-12 · **Status:** to evaluate

Make the simulation engine more dynamic for teachers **without overwhelming
them with options**. Beyond market-wide moves, teachers should be able to throw
wrenches into a student's *personal* finances, testing whether their portfolio
is strong and flexible enough to absorb real-life shocks.

### What teachers can do today

From `lib/server/market-engine.ts` and the teacher Market page:

- Pick one of four class-wide market scenarios: baseline, broad market drop,
  growth rally, interest-rate shock.
- Set the simulation mode (shared provider, teacher scenario, frozen),
  volatility multiplier, starting cash, allowed asset types, and allowed
  symbols.
- Raise or lower individual prices.
- Trigger the Strait of Hormuz oil-shock scenario on chosen symbols.

**Gap:** everything acts on the *market*. Nothing acts on the *student*. There
is no income, no recurring bills, and no unexpected expenses, so a portfolio
never has to cover a real-life need, and holding zero cash has no downside.

### Ideas to evaluate

**1. Life event cards (the core idea).** One-click events that hit a student's
cash, not the market:

| Type | Examples |
|---|---|
| Unexpected expense | Car repair, phone replacement, medical bill, vet bill |
| Income shock | Hours cut, job loss for N weeks, missed paycheck |
| Windfall | Bonus, tax refund, birthday money, small inheritance |
| Cost-of-living change | Rent increase, insurance premium up |

If a student can't cover the cost from cash, they have to **sell holdings**,
possibly at a loss during a downturn, or (for older grades) **borrow** at
credit-card interest. That's the lesson: emergency funds, liquidity, and not
being forced to sell at the bottom.

**2. Who it hits.** Apply an event to the whole class, a random handful of
students, or one student. "Random handful" mirrors real life and makes for a
good class discussion ("why did Jordan cope and Maya didn't?").

**3. Cash flow (optional, older grades).** A simple recurring paycheck and
recurring expenses, so students budget and decide how much to invest versus
keep in cash.

**4. More market templates.** Generalize the Hormuz shock into a small set of
reusable templates: sector shock, recession, inflation spike, single-company
scandal, rate cut.

**5. Combo events.** Pair a market event with a life event (a recession *and*
hours cut) for the hardest test.

**6. Debrief → student report → teacher grade.** Every event turns into a
short graded assignment, so the lesson doesn't end when the money moves. Build
on v0.2.9's quest submissions and comments: grading submissions against the
quest's scoring rules (the rubric) was left out of v0.2.9 so the grading
screen is built once, here.

- **Auto-generated debrief message.** When an event hits a student, the app
  sends a message to that student's **Inbox** explaining what happened *to
  them specifically*: the event, the cost, and how their portfolio responded
  (e.g. "Your car repair cost $400. You had $150 in cash, so $250 of BND was
  sold. Your portfolio is down 6% this week.").
- **Report prompt.** The message includes questions for the student to answer
  in a short written report, e.g. what happened, what they would do
  differently, and how they'll prepare for the next surprise. Questions adjust
  to grade level.
- **Submit to the teacher.** The student writes and submits the report from
  the message. It lands in the teacher's review queue next to the debrief
  facts, so the teacher can compare what the student wrote with what actually
  happened.
- **Grade with a rubric.** Teachers grade using a short default rubric they
  can edit (e.g. explains the impact, uses portfolio evidence, makes a
  realistic plan), with scores and a comment sent back to the student.
- **Class view.** The teacher also sees a summary across students: who had a
  cash buffer, who sold at a loss, who borrowed, and who has submitted.

This should reuse what already exists: the student **Inbox** and the quest
system's scoring rubrics, required reflections, and "Review" status. Note that
both currently run on sample data in the browser (`app/page.tsx`), so saving
messages, reports, and grades needs server-side storage first.

### Keeping it simple for teachers

- **A deck, not a form.** Teachers pick from a short list of pre-built event
  cards with sensible amounts already filled in, instead of building events
  from scratch.
- **Difficulty presets** (gentle / realistic / tough) that scale amounts to the
  class's starting cash and grade level.
- **"Surprise me"** button that draws a random card from the deck.
- **Advanced options hidden** behind a "Customize" toggle (exact amount,
  targeting, timing).
- **Preview before applying** ("this will cost each student $300; 6 students
  don't have enough cash"), plus **undo**.
- **Schedule ahead** ("apply this on Friday") so teachers can plan a lesson.

### Open questions

- Should life events be per-student (each student's own finances) or
  class-wide? Per-student is more realistic but adds data and UI.
- Can students go into debt, and at what grade level? Is debt hidden for grades
  6–8?
- How should event amounts scale: fixed dollars, or a percentage of starting
  cash?
- Do events affect grades or scores, and how is "portfolio resilience"
  measured (cash buffer, drawdown, diversification)?
- Should students get advance warning ("hurricane season is coming") so
  preparing is part of the skill?
- Is the debrief report always required, or does the teacher choose per
  event? Is there a due date?
- Does the report grade count toward the student's quest score, or is it
  separate?
- The Hormuz scenario and price raise/lower currently live in the browser
  (`app/page.tsx`). Do new events need to move into the server-side engine so
  they persist and apply to every student?

## Goal: A live market — running clock, pause, rewind, and stock info pages

**Added:** 2026-11-12 · **Status:** to evaluate

Today the market is **static**: prices only change when a teacher raises or
lowers them, triggers a scenario, or the scheduled poll fetches a new quote.
The goal is a market that **runs like a live one**, that a teacher can control
in class, with a stock info page behind every symbol.

### Where things stand

- `lib/server/market-engine.ts` builds each class's market from the latest
  quote per symbol plus the teacher's scenario and adjustments. There is no
  continuous price movement.
- Quotes are stored in `market_quotes` (ticker, fetched time), so some history
  exists, but it is only a record of polls, not a price series to replay.
- A scheduled job (`market-poll`) calls `POST /api/market/poll` to refresh
  quotes from the configured provider.

### Ideas to evaluate

**1. A running market.** Prices move on their own over time, per class, so
students see a market that is "open", not a snapshot. **Real time by default,
with a fast-forward option for teachers** (decided 2026-11-12). Fast forward is
just a faster class clock (e.g. 1x, 5x, 30x), so it should not add storage or
database writes. Until real feeds are in,
movement is simulated (random drift scaled by the class's volatility
multiplier and scenario), seeded so a class sees the same prices.

**2. Teacher controls: Pause and Resume.** A prominent button on the teacher's
Market page freezes the class's market, for a discussion or a quiz. While
paused, students see a "Market paused by your teacher" banner and **trades are
not allowed while the market is paused** (decided 2026-11-12). Resuming picks up
where it stopped. Audited, like other teacher market changes.

**3. Rewind and replay (view-only).** A teacher can look back at historical
data to show what happened: "look at what the market did when we triggered the
rate shock." **View-only, decided 2026-11-12:** it never undoes trades or
reverts changes; it only shows the past.

- A **time selector** lets the teacher choose the timeframe to view (e.g.
  today, past week, a custom range, or "when we triggered the scenario").
- Likely cheap to build: if prices are calculated from the class's market seed
  and the time (rather than stored tick by tick), history costs almost no
  storage, and only teacher changes and scenario events need recording.

**4. Stock info page.** Clicking a symbol in the market opens a popup or page.
Headlines are shown as they are (not filtered), but the page is **grade-gated**
(decided 2026-11-12): each class has a **Stock info level** that defaults from
its grade level, which the teacher can override.

- **Basic (grades 6-8):** price, a simple chart, and a plain-language company
  description. No news, ratios or fundamentals.
- **Full (grades 9-12):** adds news, key figures (market cap, P/E) and longer
  price ranges.

The page contains:

- A price chart (with the rewind range) and key numbers (price, day change,
  range, volume).
- Company basics: name, sector, short description.
- Later: news headlines, and key figures such as market cap and P/E.
- A **Trade** button and the student's own holding in that stock.

At first this is filled with **dummy data**, so the page layout and flow can
be built and tested before any live feed exists.

**5. Real information from API feeds (later).** The app gathers real data for
the symbols in each teacher's market, and fills the info pages with it:

- A job fetches company profile, quotes, and news for the symbols in use only
  (from the class's allowed symbols), not the whole market.
- Stored in the database and refreshed on a schedule, so students never wait
  on an outside call and the app stays within provider limits.
- Uses the existing Market APIs admin page and Credential Vault for providers
  and keys (e.g. Finnhub, already supported for quotes).
- Admins can see which provider, when it last refreshed, and any failures
  (the Monitoring pages already track integration health).

### Suggested order

1. Stock info page with dummy data (clickable symbols, chart, basics).
2. Price history stored per symbol, with the simulated running market.
3. Teacher Pause and Resume.
4. Rewind and replay.
5. Real data feeds filling the info pages.

### Decided

- Paused market: no trading.
- Rewind: view-only history, with a time selector.
- Time: real time by default, with teacher fast-forward at **2x, 5x and 10x**.
- News headlines: shown unfiltered, but the info page is grade-gated.
- **Market hours are a teacher setting that follows the market sources the
  class uses.** A class on a single market (e.g. only NASDAQ or the Dow) runs
  only while that market is open. A class using several markets around the
  world is simplest as a **24-hour simulation**. The teacher can define this.
- **Prices per class** follow the class's market source selection, and can be
  adjusted by the teacher or an admin (identical across a class by default;
  the v0.2.8 per-student market changes still apply on top).
- **Data providers are the school's and teachers' choice** (paid or free). The
  app stays **provider-agnostic**: it only populates data from whichever
  source the teacher or school configures, through the Market APIs admin page.
- **Stock info level:** a teacher setting, which admins can also change.

### Open questions

- Whether students are told when a teacher has sped up the clock.
- How a class on several markets is shown when some are closed (a 24-hour
  sim hides this; a mixed class that wants real hours would need a clear
  "market closed" per symbol).
- How different providers' data shapes (quotes, profiles, news) are mapped
  into one common format, so the info pages work with any source. This needs
  design before the real feeds are built.
- What the info page shows when a configured source has no news or profile
  data (free sources often lack some of it).

## Goal: School branding — colors and logos

**Added:** 2026-11-12 · **Status:** to evaluate

Let admins customize the whole portal to match their school: the color scheme
(using a color picker or by typing exact color codes, e.g. `#1d4f91`) and the
school logo.

### Where things stand

- The main colors are already defined once, as theme variables in
  `app/globals.css` (`--primary`, `--secondary`, `--accent`, `--background`,
  chart colors, and a separate dark-mode set). Changing those changes most
  buttons, cards, and badges.
- **But** `app/page.tsx` also hard-codes about 300 color values (42 distinct
  colors, e.g. `#28666e` for the Sign in button and `#c44536` for warnings)
  that ignore the theme variables. These must be switched to theme variables
  first, or a school theme will only partly apply.
- There is no logo support. The login page and app header show a generic
  bank-building icon (`Landmark`) next to the "FutureFund Classroom" name.

### Ideas to evaluate

**1. Admin "Branding" page.** A small set of named colors, each with a color
picker *and* a text box for the code (hex like `#1d4f91`; maybe RGB too). The
two stay in sync, so an admin can pick visually or paste the exact code from
their school's style guide.

**2. Few choices, many results.** Admins set only 2–3 colors: **primary** (main
buttons, headers), **secondary** (highlights, badges), and optionally
**accent**. The app works out the rest (hover shades, light backgrounds,
dark-mode versions, chart colors) automatically, so admins aren't asked for
20 colors.

**3. Live preview.** Show a mini version of the login page and a dashboard in
the new colors before saving, plus **Reset to default**.

**4. Readability guardrails.** Check contrast between text and its background
(WCAG AA) and warn, or auto-adjust text to white or black, when a school color
would make buttons or text hard to read. Many school colors (yellow, light
gold) fail on white.

**5. Scope.** Decide whether a theme applies district-wide, per school, or
both, and that the login page shows the theme too (it's the first thing
students see).

**6. School logo upload.** On the same Branding page:

- Upload a logo (PNG, JPG, or SVG), with a size limit and a crop/fit preview.
- Shown on the login page, in the app header in place of the generic icon,
  and optionally as the browser tab icon.
- An optional square version for small spaces (header, tab icon) alongside
  the full logo.
- A light/dark variant, or a check that the logo is visible on both
  backgrounds.
- "Suggest colors from logo": pick the main colors out of the uploaded logo
  as a starting theme the admin can adjust.
- Always keep the FutureFund name somewhere small (e.g. "Powered by
  FutureFund Classroom") so students know what app they're in.

### Open questions

- District-wide theme, per-school themes, or per-school with a district
  default?
- Should teachers or students be able to switch back to the default theme
  (e.g. for readability)?
- Do status colors stay fixed (red = loss, green = gain, warnings) so they
  keep their meaning regardless of school colors? Probably yes.
- How do school themes work with dark mode: generate a dark version
  automatically, or let admins set it?
- Where are themes stored: a new database table, keyed by district or school?
- Where are logos stored? The app runs on DigitalOcean with Postgres. Options
  are DigitalOcean Spaces (file storage) or small images in the database.
- Are uploaded SVGs allowed? They can contain scripts, so they'd need
  sanitizing, or limit uploads to PNG/JPG.
- Who can change branding: district admins only, or school admins too?

## Plan: Save everything that currently resets on refresh

**Added:** 2026-11-12 · **Status:** planned, decisions made 2026-11-12

In v0.2.2, these reset when the page is refreshed: student trades and
allocations, messages and discussions, Quest Studio edits, the teacher's Market
page controls, and the Privacy posture page. Refreshing also signs users out.
This plan fixes them in order, one pull request and version each. These are
numbered as v0.2.x updates; the next minor version (0.3.0) is reserved for a
milestone the owner chooses.

### Decisions

- **Who can message whom:**

  | From | Can message |
  |---|---|
  | Student | Other students in their classes, and their teachers |
  | Teacher | All students in their classes, other teachers, and admins |
  | Admin | Everyone |

- **Teachers can see student conversations** for students in their classes,
  and students are told this.
- **Messages are kept for 90 days**, then deleted, unless a message is marked
  to keep longer with a **Keep** checkbox on the message. **Any user** in the
  conversation can check Keep: students may want to keep a conversation for
  later reference, and teachers and admins for troubleshooting or auditing.
- **Admin "view as student":** when an issue is reported (e.g. a teacher says a
  student's messages aren't sending and gives their email), an admin can enter
  that student's email and view the app as that student, with access to their
  profile, to troubleshoot. The admin has **full control**: every feature the
  student has (trading, messaging, quests, and so on).
- **Teacher market changes** can be applied to the whole class, all classes
  the teacher is assigned, a group of students, or one student.

### Updates

| Version | Update | Size |
|---|---|---|
| v0.2.3 ✅ | Email system (Resend), Admin Email page, password resets that work end to end, guides' quest import/export claim corrected | Done |
| v0.2.4 ✅ | Stay signed in across refresh; real sign-out; Privacy posture saves | Done |
| v0.2.5 ✅ | Automated testing: browser test suite, CI with a test report on every pull request, bug log (GitHub issues) | Done |
| v0.2.6 ✅ | Student profiles with class portfolios by school year (read-only after the year ends); server-checked trading with −/+ and amount box; fractional shares for grade 10+; school year setting; teacher → admin reset requests; practice portfolios for staff | Done |
| v0.2.7 ✅ | Admin "view as student" by email, with full student features, banner and Exit, actions marked as by the admin, audited; no time limit; student not notified | Done |
| v0.2.8 ✅ | Teacher market controls saved, with targeting (class, all classes, group, one student), Active changes with Undo, and Reset to normal; audited | Done |
| v0.2.9 ✅ | Quests saved; shared library with Copy; assign to classes with due dates; students submit and edit until the due date; comments on submissions; import/export stores quests | Done |
| v0.2.10 ✅ | Messages and discussions saved, following the rules above; upgraded server-side profanity filter; flags to teachers with forwarding; allowed email domains; parent contacts via admins; 90-day deletion with **Keep**. Not done yet: district word list and a moderation queue for blocked attempts | Done |

### Profanity filter upgrade (part of v0.2.10)

Today's filter is a 7-word list checked only in the browser, so it's easy to
skip, and it misses common variations ("fucking", "shitty", "f*ck", "sh1t",
"fuuuck", "s h i t"). A separate 2-word server filter exists but isn't used.
In v0.2.10:

- **Run on the server** for every message and discussion post, so it can't be
  bypassed.
- **Use a maintained filter library** (e.g. the `obscenity` package) that
  catches symbols, numbers, repeated letters, spacing, and word endings,
  instead of a hand-made list.
- **Add slurs and harassment terms.**
- **District word list:** admins can add or remove words for their district.
- **Flag, not just block:** messages suggesting bullying or that a student may
  be at risk are flagged for review, not only bounced back to the student.
  - **Flags go to the student's teacher first.**
  - The teacher can **forward** a flagged message to the admins, and can add an
    **email address** to the forward for someone outside the app (e.g. a
    counselor or parent liaison).
  - Every flag, forward, and email recipient is recorded in the audit log.
  - Emailing uses the email system added in v0.2.3 (Resend).
  - Admins can limit which email domains forwards may go to (e.g. only the
    district's own domain), since flagged messages contain student
    information.
- **Blocked messages go to the moderation queue**, so teachers and admins see
  attempts, not just delivered messages.

### Notes

- **View as student** is audited (who, which student, when, why) and shows a
  clear "Viewing as <student>" banner with an exit button. Every action taken
  while viewing as a student (a trade, a message) is recorded as done by the
  admin on the student's behalf, so it's always possible to tell what the
  student did versus what the admin did. Messages sent this way show the
  student and the teacher that an admin sent them.
- **Per-student market changes** mean students in the same class can see
  different prices for the same symbol. That's fine for a simulation, but
  class leaderboards and comparisons should account for it. It also lays the
  groundwork for the **teacher life events** goal above.
- **Students are told** about teacher visibility and the 90-day rule in the
  Inbox and in the User Manual.

## Goal: Presentable portfolio summary for college credit

**Added:** 2026-11-12 · **Status:** to evaluate

Students build a multi-year record (one portfolio per class per school year,
kept as read-only records since v0.2.6). The goal is a summary they can
**present or submit for college credit**:

- A printable / PDF report covering every school year: classes, starting cash,
  final value, gain or loss, trades, allocation decisions, and teacher-graded
  work (once quests and debriefs are saved).
- A shareable, read-only link (with student and district consent) for
  reviewers such as dual-enrollment programs or admissions.
- Student reflections per year, so the record shows reasoning, not just
  numbers.

### Open questions

- What do partner colleges or credit programs require (format, signatures,
  teacher verification)?
- Who can generate and share the report: the student, the teacher, or both?
- How long are records kept after a student graduates or leaves the district?


## Goal: Separate admin sign-in with stronger protection

**Added:** 2026-11-12 · **Status:** to evaluate

Admins (and teachers, who can read student conversations and handle flags) can
see far more than students, so their sign-in deserves more protection than the
regular login. Ideas, from smallest to largest:

1. **A separate admin sign-in page** (e.g. `/admin-login`) on the same app and
   accounts, so students never see admin or demo options.
2. **Stricter admin rules:** a second factor (an emailed code once email is
   set up), shorter sessions, lockout after failed attempts, and optionally
   limiting admin sign-in to certain networks.
3. **A separate admin site** on its own subdomain. The strongest separation,
   but a second deployment to run.

Suggested starting point: 1 and 2 together.

### Open questions

- Should teachers get the stricter sign-in too?
- Should demo logins stay on the main page or move to a separate demo page?
- Will admins sign in on school networks where emailed codes are awkward?

## To do (owner): Finish email setup

**Added:** 2026-11-12 · **Status:** waiting on the owner

Flagged-message forwards to outside addresses, password reset emails and the
Admin Email page need email sending turned on. This is setup, not code:

1. Create a Resend account and verify the sending domain.
2. In the DigitalOcean console, set `RESEND_API_KEY` (as Encrypted) and
   `EMAIL_FROM` on the web component.
3. Add the district's domain(s) under **Admin → Messaging → Allowed email
   domains**.
4. Use the Admin **Email** page to send a test email to yourself.
