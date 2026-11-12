import { spawnSync } from "node:child_process";

/**
 * Loads the demo users (including the demo-user@demo.edu super user) into the
 * database at startup when DEMO_LOGINS=true. The seed is idempotent, so it is
 * safe to run on every deploy; it also resets the demo accounts' passwords.
 *
 * Runs the seed as a child process because seed-demo-data.mjs manages its own
 * connections and exit behavior.
 */
if (process.env.DEMO_LOGINS === "true") {
  console.log("DEMO_LOGINS=true: seeding demo users...");
  const result = spawnSync(process.execPath, ["scripts/seed-demo-data.mjs"], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    // Don't take the site down over demo data; log and keep starting.
    console.error(`Demo seed failed with exit code ${result.status}.`);
  }
}
