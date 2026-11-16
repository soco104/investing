# FutureFund Classroom User Manual

This manual explains the day-to-day app experience for students, teachers, and
district admins. It describes version 0.2.19; the version you are using is shown
in small text at the bottom of every page.

## What Is Saved in This Version

FutureFund Classroom is still a prototype, and not everything you do is saved
yet. Know which is which before using it with a class:

**Saved** (kept after you refresh or sign out):

- Signing in. You stay signed in when you refresh the page (see Staying Signed
  In below).
- Student portfolios: cash, stocks, trades, allocation targets, and the
  portfolio history for every class and school year.
- Teacher market controls: price raises and lowers and the Strait of Hormuz
  scenario, until the teacher undoes them or resets the market.
- Learning quests: quests saved in Quest Studio, imported quests, class
  assignments and due dates, student submissions, comments, and grades.
- Everything in the Admin portal: users, permissions, schools, market
  integrations, the Market Simulator's class settings, the Credential Vault,
  support cases, password resets, email, privacy posture, and portfolio
  corrections.

- Inbox messages and discussion posts (deleted after 90 days unless kept),
  flags, and the parent contacts an admin adds to a profile.

Some screens still show built-in sample data rather than real records: the
teacher's class analytics and Active Students view (including its quest
progress figures), and the sidebar figures (financial readiness, learning streak).


## Sign In

Users sign in from the FutureFund Classroom login page with their email and
password. A **Continue with district SSO** button is shown; it works only once
the district's identity provider has been connected (otherwise it shows a
message saying SSO is not configured yet).

### Demo Login

On demo sites, the **Email** field has a small arrow on its right. Click it and
choose **Demo super user (all roles)** to fill in the demo email and password,
then click **Sign in**. You can still type any email address into the field.

Demo accounts have an extra step: after the password is accepted, the page asks
a security question. Type the answer and click **Sign in** again. Capital
letters and extra spaces don't matter. After five wrong answers, the account is
locked for 15 minutes.

Live district sites hide the demo option. Demo logins can be turned on or off
by the site operator (see the Admin Guide).

### Switching Role Views

Users with access to more than one portal (for example the demo super user, or
an Admin) can use the **Assume role** menu at the top right to switch between
the Student, Teacher, and Admin views. The menu only lists views the account
has permission to use.

In the Student view, teachers and admins see their own **Practice** portfolio,
not a student's.

### When an Admin Helps With Your Account

If you report a problem, an admin may use **View as student** to see the app as
you and fix it. Anything they do in your account, such as a trade, appears in
your portfolio history marked "By admin [name] on the student's behalf", so you
can always tell their actions from yours.

### Forgot Your Password?

Ask your teacher or district admin to reset it. You'll get an email titled
**Reset your FutureFund Classroom password** with a link:

1. Open the link within **30 minutes**. It works only once.
2. Enter a new password of at least 10 characters, twice, and click **Set new
   password**.
3. Click **Go to sign in** and sign in with the new password.

If the link has expired or was already used, ask for a new reset.

### Staying Signed In

Refreshing the page or closing and reopening the tab keeps you signed in, for
up to 8 hours after you sign in. After that, you'll be asked to sign in again.

### Signing Out

Click **Sign out** at the top right. This ends your session, so refreshing the
page afterward shows the login page. On a shared or classroom computer, always
sign out when you're done.

## Student Experience

Students use FutureFund Classroom to practice financial literacy with simulated
money only. The app does not place trades, move funds, connect to brokerage
accounts, or provide financial advice.

Students can:

- View their dashboard and learning progress.
- Open the learning quests assigned to their class, submit a reflection, and
  comment on their submission.
- Review a simulated portfolio.
- Adjust allocation targets.
- View recent simulated trades or portfolio changes.
- Search for visible student or teacher profiles.
- Send saved text-only messages to the people they are allowed to message.
- Join classroom discussion rooms.

### Learning Quests

Learning quests are activities your teacher assigns to your class. The
**Learning quests** card on your dashboard lists them with the class, the due
date, and a status: **To do**, **Submitted**, **Submitted · locked** (the due
date has passed), or **Past due** (not submitted, and the due date has
passed). If none are assigned yet, it says so.

Click **Open quest** to see the objective, any market setup, and how it's
scored. Some scoring rules may be hidden: they're used for teacher assessment
and are only shown if your teacher makes them visible.

To turn in your work:

1. Write your answer in **Your reflection** (or **Your response**).
2. Click **Submit**. Your teacher can see it right away.
3. Until the end of the due date, you can change it and click **Save changes**.
   After the due date, your submission is locked and can't be changed.

**Your grade.** When your teacher releases your grade, the quest shows
**Graded** in your list. Open it to see **Your grade**: your teacher's
feedback, and your points if the quest shares them. Some quests show points
for each scoring rule; some show only the total or only feedback.

Once you've submitted, a **Comments** section appears under your work. You and
your teacher can post comments there at any time, including after the due
date. Reflections and comments with language that isn't allowed are refused;
edit and try again.

### Your Profile and Portfolios

Each student has **one profile** that stays with them across school years. Inside
it, every class you're assigned to gets **its own portfolio for each school
year** (for example "7th Grade Finance A · 2026–27"). Over time, your profile
builds a record of every portfolio you've managed, which you can look back on,
review, and present.

- A new class portfolio is created the first time you sign in during the school
  year. It starts with your class's **starting cash** (set by your district).
- When the school year ends, that year's portfolios become **read-only
  records**: you can still open and review them, but not trade in them.
- Teachers and admins see a **Practice portfolio** in the Student view, so they
  can try the student experience without affecting any student.

### Simulated Portfolio

Open the Portfolio page from **Portfolio value** on the Home page. It shows:

- Which portfolio you're viewing (class and school year).
- Current portfolio value: your cash plus your stocks at today's class prices.
- A value chart built from your saved history (one point per day).
- Your allocation targets, and recent activity (trades, corrections, resets).
- **Your portfolios**: every portfolio on your profile, by school year, with
  its value, gain or loss, number of trades, and whether it's current or a
  read-only record. Click **View** to open an older one.

To change your **allocation targets**, move the sliders and click **Save
allocation**. Targets that don't add up to 100% are saved as a draft for your
teacher to review.

Portfolio values are educational simulations. They may use delayed market data,
teacher-defined scenarios, or a frozen classroom market selected by the
teacher/admin.

### Class Market Context

Each class has a shared simulated market context. All students in the same
class see the same class market conditions, while each student keeps their own
portfolio decisions and activity history.

The market may be:

- `Shared provider`: based on centrally cached provider data.
- `Teacher scenario`: provider data plus teacher-selected classroom scenario
  behavior.
- `Frozen market`: market movement paused for instruction or assessment.

Students can only view their own class market context.

### Market Page

The Market page is available to students and teachers. It shows your class's
simulated market prices in a quote table with price cells colored green for
gains and red for losses. Each row includes the symbol, price, movement, a
trade box, the daily range, and classroom news for that symbol. The label at
the top shows which portfolio you're trading in.

**Life happens.** Your teacher can play a life event card on you: a surprise
bill (a car repair, a rent increase) or a windfall (a tax refund, a bonus).
When that happens, a **Life happens** box appears at the top of the Market
page with what happened, the amount, and a question to think about, and your
cash changes right away. Bills take a percent of your starting cash. In
grades 9-12 your cash can go below zero; in grades 6-8 it stops at $0.

If your teacher asks for a **debrief**, you'll also get an Inbox message about
what happened to you, and the Life happens box shows three questions and a box
to answer them. Click **Submit debrief**. You can change it with **Save
changes** until the due date. When your teacher releases your grade, your
points and feedback appear there.

**The market runs on its own.** Prices move through the day, and the page
updates by itself every few seconds. The **Market Speed** label in the upper
left shows how the market is running:

- **1x, 2x, 5x or 10x:** running, at normal speed or sped up by your teacher.
- **Paused:** your teacher has paused the market (for a discussion, say).
- **Closed:** your class follows U.S. market hours and the market is closed.

While the market is **Paused** or **Closed**, prices hold still and **trading
is off**: the Buy and Sell buttons are disabled until it starts again.

**To trade:**

1. Set how many shares: click **−** or **+** to change the amount by one, or
   type a number in the box.
2. Click **Buy** or **Sell**.

Or click **Buy max** to spend your cash on as many whole shares as it covers.
The number in brackets on the button is how many that is; the confirmation
shows how many you bought and at what price. Buy max is greyed out when you
can't afford one whole share.

The **Stocks value** card above the table shows what your shares are worth
and how many you own. Click it to jump to the **Stocks** list lower down.

Trades use the class's price at the moment you click (prices keep moving, so
it can be a few cents different from a moment earlier) and are checked by the
server: you can't
spend more cash than you have, or sell more shares than you own. A message
above the table confirms each trade or explains why it didn't go through.

**Whole or fractional shares:** classes for grade 10 and above can trade
fractional shares (up to 4 decimal places, e.g. 2.5 or 0.125). Grades 6–9
trade whole shares only. The note at the top of the page says which applies.

Trades are saved: they appear in your portfolio's activity and value history,
and in your profile's **Stocks** box.

**Stock info:** click a symbol (it's underlined) to open its stock info popup.
It shows the price, today's change, a price chart, and a plain-language
"What is this?" description, plus how much of it you own. **Trade** closes the
popup and takes you to that symbol's share box. Depending on your class's
**Stock info level**, you see one of two versions:

- **Basic** (the default for grades 6–8): the essentials above, with a
  one-month chart.
- **Full** (the default for grades 9–12): adds chart ranges (1 day, 1 week,
  1 month, 1 year), key figures (market cap, P/E ratio, volume, 52-week high
  and low), the sector, and news headlines.

The stock info is **sample data** for classroom practice in this version (the
popup is labelled), not real company data.

### Messaging and Discussions

Messaging is text-only, and messages are saved.

- **Start a conversation:** open **Inbox**, choose **New message**, pick a
  person and click **Start conversation**. You only see people you may message:
  students can message classmates and their teachers; teachers can message
  their students, other teachers and admins; admins can message everyone.
  Students are listed with their class. If the list says "No one to message
  yet", the account isn't in a class with anyone else.
- **Discussion rooms** belong to a class. Teachers create them with **New
  discussion room**; the class can post in them.
- **Keep:** messages are deleted after **90 days** unless someone in the
  conversation ticks **Keep** on the message (or it has an open flag).
- **Language check:** the server blocks disrespectful language before a message
  is sent. If you see "Message blocked", rewrite it respectfully.
- **Safety:** messages that share personal details (phone number, email, home
  address, social account) or suggest bullying or a safety concern are still
  sent, but your teacher is notified. Anyone can also use **Flag** on a message.
- **Teachers can read student conversations.** The Inbox tells students this.

Keep messages classroom appropriate.

## Teacher Experience

Teachers use the Teacher portal to manage classroom learning activity.

Teachers can:

- View class-level student performance.
- Open student performance details.
- Review quest progress.
- Create, save, copy, and assign learning quests, and read and comment on
  student submissions.
- Import or export quest templates when permitted.
- View teacher profiles showing managed classes and authored quests.
- Message students and participate in classroom discussions, create discussion
  rooms, and read their students' conversations (Inbox, **Student
  conversations**, read-only).
- Review **Flagged messages** on the Teacher dashboard: **Resolve** a flag, or
  **Forward** it to the admins, to an email address on the admin-set allowed
  list, or to a parent on file. Forwarded emails to outside people include the
  flagged message, so only forward when needed.
- Send a **parent or guardian email** to the admins to add to a student's
  profile as an alternate contact.
- Use the Market page's Teacher market controls to move prices and trigger a
  classroom scenario for a class, all their classes, a group, or one student.

### Active Students

The Active Students view shows class breakdowns for:

- Goals and quest progress.
- Portfolio performance.
- Allocation distribution.
- Discussion participation.
- Flags requiring review.

Discussion and flag counts can open detail popups for that student.

### Quest Studio

Quest Studio lets teachers create learning quests with:

- Title and objective.
- Optional market parameters.
- Reflection requirements.
- Scoring rules.
- Student scoring visibility.

Teachers should review hidden scoring rules before assigning a quest.

**Saving.** Click **New quest** to start one, fill it in, and click **Save
quest**. Your saved quests are listed under **Monitor quests**; click one to
open it in the editor, change it, and click **Save quest** again. You can only
edit your own quests.

**The library.** Click **See library** to open a list of every teacher's saved
quests (click **Hide library** to close it). Click **Copy** next to a quest to
add a copy to your own quests; the copy opens in the editor so you can change
it before assigning. Copying never changes the original.

**Assigning.** With a saved quest open, click **Assign** (or **Assign quest**
on the class roster). Tick one or more of your classes, optionally choose a
**Due date**, and click **Assign quest**. Students in those classes see the
quest on their dashboard right away. Assigning the quest to the same class
again changes its due date. Students can edit their submission until the end
of the due date; after that it's locked and only comments can be added.

**Submissions.** **Monitor quests** is the box on the right of Quest Studio.
Each quest there shows how many classes it's assigned to, how many scoring
rules are hidden, and how many students have submitted. Click a quest and the
page scrolls to its **Submissions** section, just under the list: for each
assigned class,
every student, whether they've submitted (and whether they edited it), and
what they wrote. Use the **Comments** box under a submission to reply; the
student sees your comment when they open the quest.

**Grading.** Each student in the Submissions list has a **Grade** box.

1. Click **Grade** (or **Enter a grade** for a student who didn't submit).
2. Give points for each scoring rule: whole points from 0 up to the rule's
   maximum. The total adds up as you type.
3. Add **Feedback for the student** if you like.
4. If the due date hasn't passed, tick **Grade before the due date**. The
   student can still change their answer until then; if they do, the grade is
   marked **Answer changed since grading** so you can check it.
5. Click **Save grade**. It is saved as a **draft** the student can't see.
6. Click **Release grade** when you want the student to see it, or **Release
   all graded** (next to the class average) to release every draft for the
   class at once.

Use **Change grade** to adjust a grade later. A released grade stays
released, so the student sees the change straight away. Each student shows as
**Not submitted**, **Submitted**, **Graded (draft)** or **Released**. A
student who didn't submit gets no grade unless you enter one.

What the student sees follows the quest's score visibility: **hidden** shows
feedback only, **summary** adds the total, and **full** adds points for each
rule you marked visible to students. Students never see the grading view.

**Import and export** (if you have the Quest import/export permission):
**Export** fills the box with your saved quests as JSON, to keep or share.
To import, paste quest JSON (one quest or a list) and click **Import**; the
quests are checked and saved to your own quests as drafts. If any quest is
invalid (for example, it has no title), nothing is imported and the message
says which one to fix.

### Teacher Class Market Controls

A class's market settings (simulation mode, scenario, volatility multiplier,
starting cash, and allowed symbols) are set by an admin on the Admin portal's
**Market Simulator** page. There is not yet a teacher screen for these
settings; ask your admin to change them.

Teachers change their students' prices from the **Teacher market controls**
panel on the Market page:

1. **Class market:** pick one of your classes. Only classes whose **Teacher
   controls** setting is on are listed (an admin sets this in Market
   Simulator). Admins can pick any class.
   Only teachers and admins ever see this box (it is labelled **Teachers and
   admins only**). It still shows when you use **Assume role: Student**,
   because you are still signed in as yourself.
2. **Who it applies to:**
   - **This class:** every student in the class.
   - **All my classes:** every class you can change. A symbol that isn't in a
     class's market is skipped for that class, and the message says so.
   - **A group of students:** tick the students' names.
   - **One student:** pick the student.
3. **Raise** or **Lower** next to a symbol moves its price 3%. Each click is a
   separate change, and changes stack.
4. **Strait of Hormuz scenario:** enter the affected symbols (comma-separated)
   and the oil spike % (1–60), then click **Trigger scenario**. Energy and
   oil-service symbols rise by the spike; travel symbols (like JETS) fall by
   about half of it. The whole scenario is one change.

**Market clock:** the box under the class picker controls the selected
class's running market.

- **Pause market** freezes prices and turns off trading for the class;
  students see a "Market paused by your teacher" banner. **Resume market**
  carries on from the same moment.
- **Speed:** 1x, 2x, 5x or 10x. Faster speeds make prices move as if more time
  were passing. Students see the speed in the **Market Speed** label.
- **Market hours:** **Always open (24 hours)**, the default, or **U.S. market
  hours** (9:30 AM to 4:00 PM Eastern on weekdays; holidays are not skipped).
  Outside those hours students see **Closed** and can't trade.

**Market events:** in Teacher market controls, the **Market events** box
starts a ready-made event for the selected class: Recession, Inflation spike,
Rate cut, Sector shock: tech selloff, or Company scandal (choose the
company's symbol). Each symbol moves by an amount that fits the kind of
investment it is. Pick a **Difficulty** (Gentle is half as big, Tough half
again as big) and click **Start market event**. Undo it under Active changes.

**Life events:** the **Life events** box under Teacher market controls plays a
life event card on students' cash.

1. Choose the class and a **card** (expenses and windfalls from the deck, or
   **Write my own** for a title, description and percent).
2. Choose **who it hits**: the whole class, a random handful (and how many),
   or one student.
3. Click **Preview** to see each student's amount and cash afterwards. Nothing
   changes yet.
4. Click **Play this card**. Students see the event on their Market page.
5. Use **Undo** under Played events to put the cash back.

**Difficulty, Surprise me and combos:** **Difficulty** scales deck cards
(a Tough 8% card costs 12%). **Surprise me** picks a random card. To test
students harder, choose **Also start a market event (combo)** or click one of
the ready-made combos (Recession + hours cut, Inflation spike + rent
increase, Tech selloff + fridge breakdown); the market event applies to the
whole class and is undone under Active changes.

**Debriefs:** before playing, tick **Require a debrief report** and choose a
due date (or none). Each student hit gets an Inbox message from you about what
happened to them, with three questions (simpler for grades 6-8), and writes a
debrief on their Market page. Under Played events, click **Debriefs** to read
the reports next to each student's outcome. Click **Grade** to score out of
10 (explains what happened 4, uses portfolio evidence 3, realistic plan 3)
and add feedback. Grades stay drafts until you click **Release grade** or
**Release all graded**. Undo removes debriefs nobody has written yet.

Amounts are a percent of each student's starting cash. Grades 9-12 can go into
debt; grades 6-8 stop at $0 and the card takes what is there. Playing a card
at the whole class includes students who haven't signed in yet.

**Market history (rewind):** click **Market history** in the Market clock box
to look back at the selected class's prices. It is view-only: nothing you do
there changes prices, trades or portfolios.

- **Timeframe:** **Last hour**, **Today**, **Past 7 days** or **Past 30 days**,
  or set your own **From** and **To** and click **Show this timeframe** (up to
  31 days). History begins when the running market was first used.
- **Symbol:** pick one symbol to see its price in dollars, or **All symbols**
  to compare them by percent change.
- **What happened:** your price changes and scenarios (and their undos),
  pauses, resumes and speed changes are numbered on the chart and listed
  below it with their times. A paused stretch shows as a flat line.
- The chart shows what the whole class saw. A change for one student or a
  group is listed but doesn't move the line.

The clock always applies to the whole class. Your own practice portfolio
follows your first class's market, so its clock affects your practice trading
too. Every clock change is saved and audited.

**Stock info level:** choose what students in the selected class see when
they click a symbol: **Default for the grade**, **Basic**, or **Full** (see
Market Page above). It saves as soon as you pick, and it doesn't depend on who
the price changes apply to. You always see the Full version yourself. Admins
can also change this for any class.

Changes are saved and take effect right away: students see the new price and
your news line (for example "Teacher update: SPY moved up 3%.") on their
Market page, and their trades use the changed price. The prices in the panel
are what the whole class sees; a change for a group or one student only
changes those students' prices.

**Active changes** lists every change in effect for the class, who made it and
who it applies to. Click **Undo** to remove a change (a scenario is undone as
a whole), or **Reset to normal** to remove them all. Undone changes are kept
as records. Every change, undo and reset is recorded in the audit log.

Changes don't change any student's cash or shares; they change the price.
Students who already own a symbol see its value move with the price.

### Requesting a Portfolio Reset

If a student's class portfolio needs to start over (for example, they traded
during a test window), ask an admin to reset it:

1. On the Teacher dashboard, find **Portfolio resets** and click **Request
   portfolio reset**.
2. Choose the student (only students in your classes are listed) and give a
   reason.
3. Click **Send request**.

An admin approves or denies the request, and you get an email with the
outcome. The status also shows under **Portfolio resets**. An approved reset
puts the portfolio back to the class's starting cash; everything before the
reset stays in the portfolio's history. Only one request per portfolio can be
waiting at a time.

## Admin Experience

Admins use the Admin portal for district/system configuration.

Admins can:

- Manage schools.
- Create and import users.
- Enable or disable users.
- Manage permissions.
- Configure market API integrations.
- Configure the central Market Simulator and class market contexts.
- Manage the Credential Vault.
- Select privacy posture.
- Review monitoring, logs, and integration health.
- Trigger password resets.
- Set the school year dates.
- View the app as a specific student to troubleshoot (see the Admin Guide,
  "View as Student").
- Apply audited corrections to a student's portfolio cash, and approve or deny
  teachers' portfolio reset requests.
- Import/export learning quests.

### Market Simulator

The Market Simulator page shows how provider feeds, the central quote cache,
class simulation rules, and student portfolios fit together.

Admins can manage each class context:

- Feed status.
- Simulation mode.
- Scenario.
- Volatility multiplier.
- Starting cash (for new portfolios in that class).
- Grade level (grade 10 and above can trade fractional shares; "From name"
  reads it from class names like "7th Grade Finance A").
- Teacher controls.
- Allowed symbols.

Changes are edited locally first and applied only when `Save` is clicked.
Saved changes are kept on the server and recorded in the audit log.

### Market Data Access

Market data is served from `/api/market` through the central simulator. The
endpoint requires authentication and scopes access by class.

Students can view only their own class market. Teachers can view managed
classes. Admins can view district class markets.

This endpoint is used by market integrations. The Market page itself currently
shows built-in classroom sample quotes.

### Credential Vault

Use the Credential Vault for tokens, usernames/passwords, SSO client secrets,
webhook signing secrets, and integration credentials.

Secret values are stored through backend vault/Secret Manager paths and should
not be copied into support tickets, messages, logs, screenshots, or exports.

## Support

For account issues, roster issues, market feed problems, incorrect simulated
portfolio data, or classroom moderation needs, create a support case in the
Admin portal or contact the configured district support owner.
