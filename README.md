# FutureFund Classroom

FutureFund Classroom is a gamified financial literacy MVP for school districts.
Students practice budgeting, investing, retirement planning, and risk decisions
with simulated portfolios. Teachers and district leaders get classroom progress
views that focus on learning evidence instead of real-money trading outcomes.

## Version 1 Scope

- Web-first student dashboard for simulated portfolio learning
- Teacher view for assignments, roster progress, and concept mastery
- District view for rollout, privacy posture, and integration planning
- Mock market data API for classroom-safe quote behavior
- Initial database schema for districts, schools, classrooms, students,
  simulated portfolios, holdings, lessons, and lesson progress

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

## License

This repository includes the GNU General Public License v3.0 in `LICENSE`.
