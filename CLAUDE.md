# FutureFund Classroom

Financial literacy app for grades 6–12 (Next.js on vinext, Drizzle/Postgres,
deployed on DigitalOcean App Platform).

## Versioning (required for every change)

Every change that ships gets a version bump, following semantic versioning:

- **Minor** (0.2.0 → 0.3.0): a new feature or noticeable change.
- **Patch** (0.2.0 → 0.2.1): a bug fix or small tweak.
- **Major** (→ 1.0.0): only when the owner says so (e.g. launching with real
  schools).

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

Changes that only touch docs or repo process (nothing in the running app)
don't need a version bump.

Don't create tags or GitHub releases by hand: `.github/workflows/release.yml`
does that automatically when a new version reaches `main`.

## Working on this repo

- The owner is a beginner-level coder: explain git and deploy steps plainly.
- Work on a branch and open a pull request; merging to `main` deploys to the
  live site.
- Before opening a PR, run `npx vitest run` and `npx eslint` on changed files.
  `npx tsc --noEmit` has some pre-existing errors; don't add new ones.
