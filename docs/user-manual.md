# FutureFund Classroom User Manual

This manual explains the day-to-day app experience for students, teachers, and
district admins. It describes version 0.2.2; the version you are using is shown
in small text at the bottom of every page.

## What Is Saved in This Version

FutureFund Classroom is still a prototype, and not everything you do is saved
yet. Know which is which before using it with a class:

**Saved** (kept after you refresh or sign out):

- Signing in.
- Everything in the Admin portal: users, permissions, schools, market
  integrations, the Market Simulator's class settings, the Credential Vault,
  support cases, password resets, portfolio corrections, and quest
  import/export.

**Not saved yet** (lost when the page is refreshed or you sign out):

- Student simulated trades, allocation changes, and portfolio activity.
- Inbox messages and discussion posts.
- Quests created or edited in Quest Studio.
- The teacher's quick Market page controls (raise/lower prices, Strait of
  Hormuz scenario).

Student and teacher dashboards, portfolios, class analytics, and messages start
from built-in sample data rather than each person's real records.

**Refreshing the page signs you out.** Sign in again to continue.

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

Note: when an Admin views the Student portal, the screens show sample student
data, not a specific student's account.

### Signing Out

Click **Sign out** at the top right.

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

### Simulated Portfolio

The portfolio page shows:

- Current simulated portfolio value.
- Historical value chart.
- Asset allocation.
- Recent activity.
- Allocation change controls.

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

The Market page is available to students and teachers. It shows classroom-safe
live market data in a quote table with price cells colored green for gains and
red for losses. Each row includes the symbol, price, daily range, movement, and
latest classroom news for that symbol.

Students can buy or sell simulated shares from this page using portfolio cash.
Trades update available cash, add an entry to recent portfolio activity, and
appear in the student's profile under the `Stocks` information box.

In this version, trades are not saved: they reset when the page is refreshed.
Prices on the Market page come from built-in classroom sample quotes.

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
reset when the page is refreshed. Admins can save quests using quest
import/export in the Admin portal.

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
teacher's current screen and reset when the page is refreshed.

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
- Apply audited simulated portfolio corrections.
- Import/export learning quests.

### Market Simulator

The Market Simulator page shows how provider feeds, the central quote cache,
class simulation rules, and student portfolios fit together.

Admins can manage each class context:

- Feed status.
- Simulation mode.
- Scenario.
- Volatility multiplier.
- Starting cash.
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
