# FutureFund Classroom User Manual

This manual explains the day-to-day app experience for students, teachers, and
district admins. It describes version 0.2.7; the version you are using is shown
in small text at the bottom of every page.

## What Is Saved in This Version

FutureFund Classroom is still a prototype, and not everything you do is saved
yet. Know which is which before using it with a class:

**Saved** (kept after you refresh or sign out):

- Signing in. You stay signed in when you refresh the page (see Staying Signed
  In below).
- Student portfolios: cash, stocks, trades, allocation targets, and the
  portfolio history for every class and school year.
- Everything in the Admin portal: users, permissions, schools, market
  integrations, the Market Simulator's class settings, the Credential Vault,
  support cases, password resets, email, privacy posture, and portfolio
  corrections. (Quest
  import/export records an audit entry, but the quests themselves are not
  stored yet.)

**Not saved yet** (lost when the page is refreshed or you sign out):

- Inbox messages and discussion posts.
- Quests created or edited in Quest Studio.
- The teacher's quick Market page controls (raise/lower prices, Strait of
  Hormuz scenario).

Some screens still show built-in sample data rather than real records: the
teacher's class analytics and Active Students view, messages, quests, and the
sidebar figures (financial readiness, learning streak).


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
- Open learning quests.
- Review a simulated portfolio.
- Adjust allocation targets.
- View recent simulated trades or portfolio changes.
- Search for visible student or teacher profiles.
- Send text-only messages where permitted.
- Join classroom discussion rooms.

### Learning Quests

Learning quests are teacher-created activities with an objective, instructions,
portfolio task, and scoring rules.

Some scoring rules may be hidden. Hidden rules are used for teacher assessment
and are not shown to students unless the teacher or admin makes them visible.

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
- Create and modify learning quests.
- Import or export quest templates when permitted.
- View teacher profiles showing managed classes, authored quests, and inbox.
- Message students and participate in classroom discussions.
- Use quick Market page controls to move prices and trigger a classroom
  scenario.

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

In this version, quests created or edited in Quest Studio are not saved: they
reset when the page is refreshed. Quest export downloads a copy you can keep
and import again later, but imported quests are also not saved on the server
yet.

### Teacher Class Market Controls

A class's market settings (simulation mode, scenario, volatility multiplier,
starting cash, and allowed symbols) are set by an admin on the Admin portal's
**Market Simulator** page. There is not yet a teacher screen for these
settings; ask your admin to change them.

Teachers can use the Market page for quick classroom scenario controls. They
can raise or lower selected symbol prices and trigger the initial Strait of
Hormuz blockade scenario. The scenario creates a major oil-price shock against
teacher-selected symbols, raising energy or oil-service symbols and lowering
travel symbols that are negatively affected by fuel costs.

In this version, these quick controls are not saved: they affect only the
teacher's current screen and reset when the page is refreshed. Students trade
at the class's saved market prices, not the teacher's on-screen changes.

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
