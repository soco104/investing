# FutureFund Classroom User Manual

This manual explains the day-to-day app experience for students, teachers, and
district admins. It describes version 0.2.9; the version you are using is shown
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
  assignments and due dates, student submissions, and comments.
- Everything in the Admin portal: users, permissions, schools, market
  integrations, the Market Simulator's class settings, the Credential Vault,
  support cases, password resets, email, privacy posture, and portfolio
  corrections.

**Not saved yet** (lost when the page is refreshed or you sign out):

- Inbox messages and discussion posts.

Some screens still show built-in sample data rather than real records: the
teacher's class analytics and Active Students view (including its quest
progress figures), messages, and the sidebar figures (financial readiness, learning streak).


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
- Send text-only messages where permitted.
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

**To trade:**

1. Set how many shares: click **−** or **+** to change the amount by one, or
   type a number in the box.
2. Click **Buy** or **Sell**.

Trades use the class's current price and are checked by the server: you can't
spend more cash than you have, or sell more shares than you own. A message
above the table confirms each trade or explains why it didn't go through.

**Whole or fractional shares:** classes for grade 10 and above can trade
fractional shares (up to 4 decimal places, e.g. 2.5 or 0.125). Grades 6–9
trade whole shares only. The note at the top of the page says which applies.

Trades are saved: they appear in your portfolio's activity and value history,
and in your profile's **Stocks** box.

### Messaging and Discussions

Messaging is text-only. The app includes a first-pass profanity filter that
blocks a message before it is sent.

In this version, messages and discussion posts are not saved: they reset when
the page is refreshed.

Users should keep messages classroom appropriate. Teachers and admins may
review escalated or blocked discussions according to district policy.

## Teacher Experience

Teachers use the Teacher portal to manage classroom learning activity.

Teachers can:

- View class-level student performance.
- Open student performance details.
- Review quest progress.
- Create, save, copy, and assign learning quests, and read and comment on
  student submissions.
- Import or export quest templates when permitted.
- View teacher profiles showing managed classes, authored quests, and inbox.
- Message students and participate in classroom discussions.
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

**Submissions.** Under **Monitor quests**, each quest shows how many classes
it's assigned to, how many scoring rules are hidden, and how many students
have submitted. Click a quest to see **Submissions**: for each assigned class,
every student, whether they've submitted (and whether they edited it), and
what they wrote. Use the **Comments** box under a submission to reply; the
student sees your comment when they open the quest. Grading submissions with
the rubric is planned for a later update.

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
