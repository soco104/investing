import { expect, test, type Browser, type Page } from "@playwright/test";

import { accounts, signIn } from "./helpers";

// Running market (v0.2.12). Avery is a student in 7th Grade Finance A; Elena
// teaches it. The class market runs on its own; Elena can pause it, change
// its speed and set its hours. Tests run in order and leave the class
// running at 1x, always open.
const avery = accounts.student;
const elena = accounts.teacher;
const className = "7th Grade Finance A";

type Clock = { hours: string; label: string; open: boolean; speed: number; status: string; tradingAllowed: boolean };
type Live = { market: { clock: Clock; symbols: Array<{ priceCents: number; ticker: string }> } };

async function signedIn(browser: Browser, account: { email: string; password: string }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, account.email, account.password);
  return { context, page };
}

async function clockAction(page: Page, body: Record<string, unknown>) {
  const response = await page.request.post("/api/teacher/market", { data: { action: "clock", className, ...body } });
  return { body: (await response.json()) as { clock?: Clock; message?: string }, status: response.status() };
}

async function classPortfolioId(page: Page) {
  const body = (await (await page.request.get("/api/portfolios")).json()) as {
    portfolios: Array<{ className: string; id: string; kind: string }>;
  };
  return body.portfolios.find((item) => item.className === className && item.kind === "class")?.id ?? "";
}

async function live(page: Page, portfolioId: string) {
  return (await (await page.request.get(`/api/portfolios/live?portfolioId=${portfolioId}`)).json()) as Live;
}

const prices = (data: Live) => data.market.symbols.map((symbol) => `${symbol.ticker}:${symbol.priceCents}`).join(",");

test("students see Market Speed, and prices move on their own", async ({ browser }) => {
  const teacher = await signedIn(browser, elena);
  const fast = await clockAction(teacher.page, { op: "speed", speed: 10 });
  expect(fast.status).toBe(200);
  expect(fast.body.clock).toMatchObject({ label: "10x", speed: 10, tradingAllowed: true });

  const student = await signedIn(browser, avery);
  await student.page.getByRole("tab", { name: "Market" }).click();
  await expect(student.page.getByTestId("market-speed")).toHaveText("Market Speed: 10x");

  const portfolioId = await classPortfolioId(student.page);
  const first = prices(await live(student.page, portfolioId));
  await expect.poll(async () => prices(await live(student.page, portfolioId)), { timeout: 30_000 }).not.toBe(first);

  // Someone else's portfolio can't be watched.
  expect((await teacher.page.request.get(`/api/portfolios/live?portfolioId=${portfolioId}`)).status()).toBe(404);

  // Back to normal speed; the student's label follows without a reload.
  await clockAction(teacher.page, { op: "speed", speed: 1 });
  await expect(student.page.getByTestId("market-speed")).toHaveText("Market Speed: 1x", { timeout: 15_000 });
  await teacher.context.close();
  await student.context.close();
});

test("a teacher pauses the market: prices freeze and students can't trade", async ({ browser }) => {
  const teacher = await signedIn(browser, elena);
  await teacher.page.getByRole("tab", { name: "Market" }).click();
  const panel = teacher.page.getByRole("region", { name: "Teacher market controls" });
  await panel.getByLabel("Class market").selectOption(className);
  await panel.getByRole("button", { name: "Pause market" }).click();
  await expect(panel.getByTestId("class-clock-label")).toHaveText("Paused");
  await expect(panel.getByRole("button", { name: "Resume market" })).toBeVisible();

  const student = await signedIn(browser, avery);
  await student.page.getByRole("tab", { name: "Market" }).click();
  await expect(student.page.getByTestId("market-speed")).toHaveText("Market Speed: Paused");
  await expect(student.page.getByTestId("market-blocked")).toContainText("Market paused by your teacher");
  await expect(student.page.getByRole("button", { name: "Buy", exact: true }).first()).toBeDisabled();

  // Prices hold still while paused.
  const portfolioId = await classPortfolioId(student.page);
  const frozen = prices(await live(student.page, portfolioId));
  await student.page.waitForTimeout(2500);
  expect(prices(await live(student.page, portfolioId))).toBe(frozen);

  // The server refuses the trade, whatever the screen allows.
  const trade = { portfolioId, shares: 1, side: "buy", ticker: "BND" };
  const refused = await student.page.request.post("/api/portfolios/trade", { data: trade });
  expect(refused.status()).toBe(409);
  expect(((await refused.json()) as { message: string }).message).toContain("paused by your teacher");

  // Resume: the label and trading come back without a reload.
  await panel.getByRole("button", { name: "Resume market" }).click();
  await expect(panel.getByTestId("class-clock-label")).toHaveText("Running at 1x");
  await expect(student.page.getByTestId("market-speed")).toHaveText("Market Speed: 1x", { timeout: 15_000 });
  await expect(student.page.getByTestId("market-blocked")).toHaveCount(0);
  // Trading works again, and the confirmation says which price was used.
  await student.page.getByRole("button", { name: "Buy", exact: true }).first().click();
  await expect(student.page.getByText(/Bought 1 share of \w[\w-]*\. Price: \$[\d,.]+ a share\./)).toBeVisible();
  await teacher.context.close();
  await student.context.close();
});

test("market hours, and who may change the clock", async ({ browser }) => {
  const teacher = await signedIn(browser, elena);

  // U.S. hours: open or closed depends on when the test runs, so check that
  // the label and trading agree with it either way.
  const hours = await clockAction(teacher.page, { hours: "us_market", op: "hours" });
  expect(hours.status).toBe(200);
  expect(hours.body.clock?.hours).toBe("us_market");
  expect(hours.body.clock?.label).toBe(hours.body.clock?.open ? "1x" : "Closed");
  expect(hours.body.clock?.tradingAllowed).toBe(hours.body.clock?.open);

  const always = await clockAction(teacher.page, { hours: "always", op: "hours" });
  expect(always.body.clock).toMatchObject({ hours: "always", label: "1x", open: true, tradingAllowed: true });

  // Only 1x, 2x, 5x and 10x are speeds.
  expect((await clockAction(teacher.page, { op: "speed", speed: 3 })).status).toBe(400);
  // A class that isn't the teacher's.
  const other = await teacher.page.request.post("/api/teacher/market", {
    data: { action: "clock", className: "Some Other Class", op: "pause" },
  });
  expect(other.status()).toBe(403);
  await teacher.context.close();

  // Students can't touch the clock.
  const student = await signedIn(browser, avery);
  expect((await clockAction(student.page, { op: "pause" })).status).toBe(403);
  await student.context.close();
});
