/**
 * FutureFund Classroom - DigitalOcean scheduled market poll helper
 *
 * Why this file exists:
 * DigitalOcean App Platform scheduled jobs execute a command. The application's
 * actual polling logic already lives in POST /api/market/poll, so this helper
 * simply calls that endpoint with the existing X-FutureFund-Cron secret.
 *
 * In App Platform the default MARKET_POLL_URL points at the web service over
 * the app's internal network:
 *
 *   http://web:8080/api/market/poll
 *
 * Keeping polling logic in the API route avoids maintaining two implementations
 * of the market refresh workflow.
 */

const endpoint =
  process.env.MARKET_POLL_URL ?? "http://web:8080/api/market/poll";
const cronSecret = process.env.CRON_SECRET;

if (!cronSecret) {
  console.error("CRON_SECRET is required for the scheduled market poll.");
  process.exit(1);
}

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "X-FutureFund-Cron": cronSecret,
      "User-Agent": "futurefund-digitalocean-market-poll/1.0",
    },
    signal: AbortSignal.timeout(60_000),
  });

  const text = await response.text();

  if (!response.ok) {
    console.error(
      `FutureFund market poll failed with HTTP ${response.status}: ${text.slice(0, 1000)}`
    );
    process.exit(1);
  }

  // The response contains operational status but never the cron secret.
  console.log(`FutureFund market poll succeeded: ${text.slice(0, 2000)}`);
} catch (error) {
  console.error(
    `FutureFund market poll could not reach ${endpoint}:`,
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
}
