# FutureFund Classroom User Manual

This manual explains the day-to-day app experience for students, teachers, and
district admins.

## Sign In

Users sign in from the FutureFund Classroom login page with either district
credentials or district SSO when configured.

Demo accounts may be available in non-production environments. Production
district deployments should use persisted credentials or SSO.

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

### Messaging and Discussions

Messaging is text-only. The app includes a first-pass profanity filter.

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
- Configure market simulator settings for assigned classes when district policy
  allows teacher controls.

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

### Teacher Class Market Controls

When enabled, teachers can configure assigned class markets through the market
simulator controls exposed by the platform.

Teachers may adjust:

- Simulation mode.
- Scenario.
- Volatility multiplier.
- Starting cash.
- Allowed symbols.

Market configuration changes are saved intentionally and audited. Draft edits
do not take effect until saved.

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

### Market Data Access

Market data is served from `/api/market` through the central simulator. The
endpoint requires authentication and scopes access by class.

Students can view only their own class market. Teachers can view managed
classes. Admins can view district class markets.

### Credential Vault

Use the Credential Vault for tokens, usernames/passwords, SSO client secrets,
webhook signing secrets, and integration credentials.

Secret values are stored through backend vault/Secret Manager paths and should
not be copied into support tickets, messages, logs, screenshots, or exports.

## Support

For account issues, roster issues, market feed problems, incorrect simulated
portfolio data, or classroom moderation needs, create a support case in the
Admin portal or contact the configured district support owner.

