import { execFileSync } from "node:child_process";

import postgres from "postgres";

/**
 * Prepares the database before the browser tests: runs the migrations, loads
 * the demo data, and clears saved portfolios, so every run starts from the
 * same known state. Only point DATABASE_URL at a scratch test database.
 */
export default async function globalSetup() {
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

  const sql = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => undefined });

  try {
    // Portfolios are created on first sign-in; start every run without any.
    await sql`
      truncate portfolio_reset_requests, portfolio_value_snapshots,
        portfolio_allocation_targets, portfolio_activity, portfolio_holdings,
        portfolio_corrections, student_portfolios
    `;
    await sql`delete from district_settings`;
    await sql`update class_market_configs set grade_level = null`;
  } finally {
    await sql.end();
  }
}
