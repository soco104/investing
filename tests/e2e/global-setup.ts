import { execFileSync } from "node:child_process";

/**
 * Prepares the database before the browser tests: runs the migrations and
 * loads the demo data. The seed resets the demo accounts' passwords, so tests
 * that change a password don't affect the next run.
 */
export default function globalSetup() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Browser tests need a PostgreSQL database. Set DATABASE_URL, e.g. " +
        "DATABASE_URL=postgres://postgres@127.0.0.1:5432/futurefund_test npm run test:e2e"
    );
  }

  for (const script of ["scripts/digitalocean-migrate.mjs", "scripts/seed-demo-data.mjs"]) {
    execFileSync(process.execPath, [script], {
      env: process.env,
      stdio: ["ignore", "ignore", "inherit"],
    });
  }
}
