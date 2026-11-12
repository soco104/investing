import { defineConfig, devices } from "@playwright/test";

/**
 * Browser (end-to-end) tests: tests/e2e/*.spec.ts.
 *
 * Needs a PostgreSQL database in DATABASE_URL. The global setup runs the
 * migrations and loads the demo data before the tests, so the tests always
 * start from the same known state.
 *
 *   DATABASE_URL=postgres://... npm run test:e2e
 *
 * Results: playwright-report/ (HTML, with screenshots of every test) and
 * test-results/e2e-results.json (used for the pull request summary).
 */
const port = Number(process.env.E2E_PORT ?? 3123);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  // One at a time: the tests share one database and one server.
  workers: 1,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results/e2e-results.json" }],
  ],
  use: {
    baseURL,
    // Evidence: a screenshot at the end of every test, and a full trace and
    // video when a test fails.
    screenshot: "on",
    trace: "retain-on-failure",
    // Video needs ffmpeg, which `npx playwright install chromium` provides;
    // set E2E_VIDEO=off where it isn't available.
    video: process.env.E2E_VIDEO === "off" ? "off" : "retain-on-failure",
    viewport: { width: 1280, height: 900 },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
        // Optional: use an already-installed Chrome/Chromium instead of
        // Playwright's download (e.g. where downloads are blocked).
        launchOptions: process.env.CHROMIUM_PATH
          ? { executablePath: process.env.CHROMIUM_PATH }
          : {},
      },
    },
  ],
  webServer: {
    // `next dev` runs on Node with process.env, like the DigitalOcean server.
    // (`npm run dev` uses vinext's Cloudflare-style dev server, which doesn't
    // pass DATABASE_URL through to the app.)
    command: `npx next dev -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...(process.env as Record<string, string>),
      DATABASE_URL: process.env.DATABASE_URL ?? "",
      DEMO_SECURITY_ANSWER: process.env.DEMO_SECURITY_ANSWER ?? "Concord",
      // Email isn't configured in tests: emails are written to the server log.
      RESEND_API_KEY: "",
      EMAIL_FROM: "",
    },
    stdout: "pipe",
    stderr: "pipe",
  },
});
