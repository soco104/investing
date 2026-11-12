# FutureFund Classroom

Financial literacy app for grades 6–12 (Next.js on vinext, Drizzle/Postgres,
deployed on DigitalOcean App Platform).

## Versioning (required for every change)

Every change gets a version bump and patch notes, **including small ones**
(process, config, workflow, `CLAUDE.md` changes). Semantic versioning:

- **Minor** (0.2.0 → 0.3.0): a new feature or noticeable change.
- **Patch** (0.2.0 → 0.2.1): a bug fix, small tweak, or process/config update.
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
- Before opening a PR, run `npx vitest run` and `npx eslint` on changed files.
  `npx tsc --noEmit` has some pre-existing errors; don't add new ones.
