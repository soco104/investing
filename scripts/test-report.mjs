// Builds the test report shown on each pull request (and in the GitHub
// Actions run summary) from the results of the CI checks.
//
// Inputs (written by the CI workflow):
//   test-results/unit-results.json   Vitest JSON reporter output
//   test-results/e2e-results.json    Playwright JSON reporter output
//   CHECK_LINT, CHECK_TYPECHECK, CHECK_UNIT, CHECK_E2E   step outcomes
//   TYPECHECK_SUMMARY                e.g. "TypeScript errors: 17 (baseline: 17)"
//   RUN_URL                          link to the Actions run (artifacts)
//
// Output: test-results/report.md

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

const icon = (outcome) =>
  outcome === "success" ? "✅" : outcome === "skipped" ? "⏭️" : "❌";

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function unitSummary(results) {
  if (!results) return { failures: [], line: "No results (the step didn't finish)." };

  const failures = [];
  for (const file of results.testResults ?? []) {
    for (const test of file.assertionResults ?? []) {
      if (test.status === "failed") {
        failures.push(
          `${file.name.replace(/^.*\/tests\//, "tests/")} › ${test.fullName ?? test.title}`
        );
      }
    }
  }

  return {
    failures,
    line: `${results.numPassedTests} passed, ${results.numFailedTests} failed, ${
      results.numPendingTests ?? 0
    } skipped, in ${results.testResults?.length ?? 0} files`,
  };
}

function e2eSummary(results) {
  if (!results) return { failures: [], rows: [], line: "No results (the step didn't finish)." };

  const rows = [];
  const failures = [];

  function walk(suite, parents) {
    const titles = suite.title ? [...parents, suite.title] : parents;
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const last = test.results?.[test.results.length - 1];
        const status = test.status; // expected | unexpected | flaky | skipped
        const name = [...titles.slice(1), spec.title].join(" › ");
        const seconds = last ? (last.duration / 1000).toFixed(1) : "-";
        const mark =
          status === "expected" ? "✅" : status === "flaky" ? "⚠️ flaky" : status === "skipped" ? "⏭️" : "❌";
        rows.push(`| ${mark} | ${name} | ${seconds}s |`);
        if (status === "unexpected") {
          const message = (last?.error?.message ?? "").split("\n")[0].replace(/\u001b\[[0-9;]*m/g, "");
          failures.push(`${name}: ${message}`);
        }
      }
    }
    for (const child of suite.suites ?? []) walk(child, titles);
  }

  for (const suite of results.suites ?? []) walk(suite, []);

  const stats = results.stats ?? {};
  return {
    failures,
    line: `${stats.expected ?? 0} passed, ${stats.unexpected ?? 0} failed, ${
      stats.flaky ?? 0
    } flaky, ${stats.skipped ?? 0} skipped, in ${((stats.duration ?? 0) / 1000).toFixed(0)}s`,
    rows,
  };
}

const outcomes = {
  e2e: process.env.CHECK_E2E ?? "skipped",
  lint: process.env.CHECK_LINT ?? "skipped",
  typecheck: process.env.CHECK_TYPECHECK ?? "skipped",
  unit: process.env.CHECK_UNIT ?? "skipped",
};
const unit = unitSummary(readJson("test-results/unit-results.json"));
const e2e = e2eSummary(readJson("test-results/e2e-results.json"));
const version = JSON.parse(readFileSync("package.json", "utf8")).version;
const allPassed = Object.values(outcomes).every((outcome) => outcome === "success");

const lines = [
  "<!-- futurefund-test-report -->",
  `## ${allPassed ? "✅" : "❌"} Test report — v${version}`,
  "",
  "| Check | Result | Details |",
  "|---|---|---|",
  `| Lint | ${icon(outcomes.lint)} | ESLint on the whole repo |`,
  `| Type check | ${icon(outcomes.typecheck)} | ${process.env.TYPECHECK_SUMMARY ?? ""} |`,
  `| Unit tests | ${icon(outcomes.unit)} | ${unit.line} |`,
  `| Browser tests | ${icon(outcomes.e2e)} | ${e2e.line} |`,
  "",
];

const failures = [
  ...unit.failures.map((failure) => `- **Unit:** ${failure}`),
  ...e2e.failures.map((failure) => `- **Browser:** ${failure}`),
];

if (failures.length > 0) {
  lines.push("### Failures", "", ...failures, "");
}

if (e2e.rows.length > 0) {
  lines.push(
    "<details><summary>Browser tests (each has a screenshot in the evidence report)</summary>",
    "",
    "| | Test | Time |",
    "|---|---|---|",
    ...e2e.rows,
    "",
    "</details>",
    ""
  );
}

if (process.env.RUN_URL) {
  lines.push(
    `**Evidence:** download **e2e-report** from the [Actions run](${process.env.RUN_URL}) and open \`index.html\` for screenshots of every browser test (plus traces and videos of any failures).`,
    ""
  );
}

lines.push(
  "_Bugs found by tests are logged as GitHub issues with the `bug` label._"
);

mkdirSync("test-results", { recursive: true });
writeFileSync("test-results/report.md", `${lines.join("\n")}\n`);
console.log(lines.join("\n"));
