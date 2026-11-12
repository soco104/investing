# FutureFund Classroom

Financial literacy app for grades 6–12 (Next.js on vinext, Drizzle/Postgres,
deployed on DigitalOcean App Platform).

## Versioning (required for every change)

Every change gets a version bump and patch notes, **including small ones**
(process, config, workflow, `CLAUDE.md` changes). Semantic versioning:

- **Patch** (0.2.3 → 0.2.4): every update during the 0.2 series, including
  new features, fixes, tweaks, and process/config updates.
- **Minor** (0.2.x → 0.3.0): only when the owner declares a milestone.
- **Major** (→ 1.0.0): only when the owner says so (e.g. launching with real
  schools).

**The one exception: documentation-only changes** (e.g. `README.md`,
`docs/roadmap.md`, deployment runbooks) don't need a version bump or patch
notes. **But changes to `docs/user-manual.md` or `docs/admin-guide.md` always
do** (patch bump), because teachers and admins rely on them.

When planning a change, include the version bump and a draft of its patch
notes in the plan, so the owner can see what users will be told before the work
starts.

In the same pull request as the change:

1. Bump `"version"` in `package.json`. That's the only place the number lives;
   the app reads it via `lib/version.ts` and shows it at the bottom of each page.
2. Add an entry at the top of `CHANGELOG.md` with the new version and date,
   under **Added** / **Changed** / **Fixed** / **Removed**, in plain English,
   and add its compare link at the bottom.
3. Add the patch notes to the **top** of `docs/patch-notes.md` (newest first,
   directly under the intro line), headed `## vX.Y.Z — YYYY-MM-DD`, with `###`
   sections by feature area (e.g. `### Demo Login`). Write them for teachers and
   admins: what changed and how to use it, plus any settings to change.
4. Put the version in the PR title, e.g. `v0.3.0: Add class leaderboard`.
5. If the change affects anything `docs/user-manual.md` or
   `docs/admin-guide.md` describes (screens, steps, settings, environment
   variables, what is or isn't saved), update those guides too, and update the
   version they say they describe. A pull request that changes app behavior
   without checking the guides is not finished.

If several small changes go in one pull request, they share one version and
one patch notes entry.

Don't create tags or GitHub releases by hand: `.github/workflows/release.yml`
does that automatically when a new version reaches `main`.

## Working on this repo

- The owner is a beginner-level coder: explain git and deploy steps plainly.
- Work on a branch and open a pull request; merging to `main` deploys to the
  live site.
- Never merge pull requests, even docs-only ones. The owner reviews and merges
  every one.
- Future goals live in `docs/roadmap.md`. Check it when planning related work.

## Testing (required for every change)

- **CI runs on every pull request** (`.github/workflows/ci.yml`): lint, the
  type-check baseline, unit tests, and browser tests against PostgreSQL. It
  posts a test report on the PR. Don't ask the owner to merge until CI passes.
- **Before opening a PR, run locally:** `npm run lint`,
  `npm run typecheck:baseline` (no new TypeScript errors; if you fix some,
  lower `scripts/typescript-baseline.json`), `npm test`, and
  `npm run test:e2e` (needs `DATABASE_URL` for a scratch PostgreSQL database).
- **Every change that affects what users see or do adds browser tests** in
  `tests/e2e/` for the new or changed flow, alongside unit tests for server
  code. The browser suite is the regression suite: never delete a test to make
  CI pass; fix the app or update the test to the new intended behavior and
  say so in the PR.
- **Every bug found** (by tests, review, or the owner) gets a GitHub issue
  with the `bug` label, stating the version that introduced it, how it was
  found, and the fix. Close it with the PR that fixes it, add a regression
  test named after the issue (e.g. "… (regression: issue #10)"), and list it
  under **Fixed** in the changelog and patch notes.
- **PR descriptions** summarize what was tested and link the CI test report.
