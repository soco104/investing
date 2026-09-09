# FutureFund Classroom

FutureFund Classroom is a gamified financial literacy MVP for school districts.
Students practice budgeting, investing, retirement planning, and risk decisions
with simulated portfolios. Teachers and district leaders get classroom progress
views that focus on learning evidence instead of real-money trading outcomes.

## Version 1 Scope

- Web-first student dashboard for simulated portfolio learning
- Teacher view for assignments, roster progress, concept mastery, and quest
  authoring
- User-level text-only inbox for direct teacher-student and approved peer
  messages with a first-pass profanity filter
- Classroom discussion board for shared quest conversations
- Admin portal for user management, permissions, support routing, market API
  setup, password resets, portfolio corrections, template governance, and
  scoring policy controls
- Admin drill-in pages for school setup, market data integrations, and district
  privacy posture selection
- Mock market data API for classroom-safe quote behavior
- Initial database schema for districts, schools, classrooms, students,
  simulated portfolios, holdings, lessons, teacher-created quests, hidden
  scoring rules, market parameters, assignments, submissions, user-owned inbox
  threads, classroom discussion rooms, message moderation status, admin users,
  role assignments, support tickets, market data integrations, password reset
  requests, privacy posture settings, portfolio correction audits, and lesson
  progress

## Development

Install dependencies:

```bash
npm install
```

Run the local app:

```bash
npm run dev
```

Build the app:

```bash
npm run build
```

Lint the app:

```bash
npm run lint
```

## Product Guardrails

- Simulated money only in the MVP
- No real trades, bank transfers, brokerage accounts, or financial advice
- Designed for student privacy workflows expected by districts
- Market data should be routed through a provider adapter before production use
- Student-facing quest screens should only expose scoring rules that a teacher
  or system administrator has explicitly made visible
- Messaging starts as text-only communication with profanity blocking and
  moderation fields in the data model
- Admin changes that affect access or simulated portfolio data should carry an
  audit reason

## License

This repository includes the GNU General Public License v3.0 in `LICENSE`.
