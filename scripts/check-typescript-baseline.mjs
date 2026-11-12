// Fails if the TypeScript error count goes above the known baseline.
//
// The project has some type errors that predate this check. Rather than
// ignore type checking entirely, this script holds the line: new errors fail
// the build, and fixing old ones lets the baseline be lowered.
//
//   npm run typecheck:baseline

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const baselineFile = new URL("./typescript-baseline.json", import.meta.url);
const { maxErrors } = JSON.parse(readFileSync(baselineFile, "utf8"));

const result = spawnSync("npx", ["tsc", "--noEmit", "-p", "."], {
  encoding: "utf8",
  shell: process.platform === "win32",
});
const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
const errors = output.split("\n").filter((line) => line.includes("error TS"));

console.log(`TypeScript errors: ${errors.length} (baseline: ${maxErrors})`);

if (errors.length > maxErrors) {
  console.error(
    `\n${errors.length - maxErrors} new TypeScript error(s). All current errors:\n`
  );
  console.error(errors.join("\n"));
  process.exit(1);
}

if (errors.length < maxErrors) {
  console.log(
    `Fewer errors than the baseline. Lower "maxErrors" in ` +
      `scripts/typescript-baseline.json to ${errors.length} to lock in the improvement.`
  );
}
