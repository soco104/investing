import { expect, test, type Page } from "@playwright/test";

import { accounts, signIn } from "./helpers";

// Market rewind (v0.2.13). Elena teaches 7th Grade Finance A. She pauses the
// market, raises a symbol and resumes, then looks back at it. View-only.
const elena = accounts.teacher;
const avery = accounts.student;
const className = "7th Grade Finance A";

type History = {
  events: Array<{ detail: string; kind: string; label: string }>;
  message?: string;
  series: Array<{ points: Array<{ at: string; price: number }>; ticker: string }>;
};

async function teacherAction(page: Page, data: Record<string, unknown>) {
  const response = await page.request.post("/api/teacher/market", { data });
  expect(response.ok(), await response.text()).toBe(true);
  return (await response.json()) as Record<string, unknown>;
}

async function history(page: Page, query: Record<string, string>) {
  const params = new URLSearchParams({ className, ...query });
  const response = await page.request.get(`/api/teacher/market/history?${params.toString()}`);
  return { body: (await response.json()) as History, status: response.status() };
}

test("a teacher looks back at a pause and a price change", async ({ page }) => {
  await signIn(page, elena.email, elena.password);
  const startedAt = new Date(Date.now() - 1000).toISOString();

  // Something worth looking back at: pause, raise BND 3%, resume.
  await teacherAction(page, { action: "clock", className, op: "pause" });
  await page.waitForTimeout(1200);
  const change = await teacherAction(page, {
    action: "change",
    change: { direction: "raise", kind: "price", ticker: "BND" },
    target: { className, type: "class" },
  });
  await page.waitForTimeout(1200);
  await teacherAction(page, { action: "clock", className, op: "resume" });
  await page.waitForTimeout(1200);

  const result = await history(page, { from: startedAt, ticker: "BND", to: new Date().toISOString() });
  expect(result.status).toBe(200);
  expect(result.body.events.map((event) => event.label)).toEqual(["Market paused", "Raised BND 3%", "Market resumed"]);

  // The raise shows as a 3% step between the points either side of it.
  const points = result.body.series[0].points;
  const steps = points.slice(1).map((point, index) => point.price / points[index].price - 1);
  expect(Math.max(...steps)).toBeGreaterThan(0.028);
  expect(Math.max(...steps)).toBeLessThan(0.032);

  // During the pause, before the raise, the price didn't move at all.
  const paused = points.filter((_, index) => index > 0 && Math.abs(steps[index - 1]) === 0);
  expect(paused.length).toBeGreaterThan(0);

  // The popup: time selector, symbol picker, chart and the list of events.
  await page.getByRole("tab", { name: "Market" }).click();
  const panel = page.getByRole("region", { name: "Teacher market controls" });
  await panel.getByLabel("Class market").selectOption(className);
  await panel.getByRole("button", { name: "Market history" }).click();
  const popup = page.getByTestId("market-history");
  await expect(popup.getByRole("button", { name: "Last hour" })).toHaveAttribute("aria-pressed", "true");
  await expect(popup.getByTestId("history-chart")).toBeVisible();
  const events = popup.getByRole("list", { name: "Events in this timeframe" });
  await expect(events).toContainText("Market paused");
  await expect(events).toContainText("Raised BND 3%");
  await expect(events).toContainText("Market resumed");

  await popup.getByLabel("Symbol").selectOption("BND");
  await expect(popup.getByTestId("history-summary")).toContainText("BND:");
  await popup.getByRole("button", { name: "Past 7 days" }).click();
  await expect(popup.getByRole("button", { name: "Past 7 days" })).toHaveAttribute("aria-pressed", "true");
  await expect(popup.getByTestId("history-range")).toContainText("History begins");

  // A custom timeframe that ends before it starts is refused.
  await popup.getByLabel("From", { exact: true }).fill("2026-12-31T10:00");
  await popup.getByLabel("To", { exact: true }).fill("2026-12-30T10:00");
  await popup.getByRole("button", { name: "Show this timeframe" }).click();
  await expect(popup.getByRole("alert")).toBeVisible();
  await page.keyboard.press("Escape");

  // Looking back changed nothing: the raise is still active. Then tidy up.
  const view = (await (await page.request.get(`/api/teacher/market?className=${encodeURIComponent(className)}`)).json()) as {
    changes: Array<{ id: string; label: string }>;
    clock: { status: string };
  };
  expect(view.changes.map((item) => item.label)).toContain("Raised BND 3%");
  expect(view.clock.status).toBe("running");
  expect(change.applied).toBeTruthy();
  await teacherAction(page, { action: "reset", className });
});

test("market history is for teachers' own classes and admins only", async ({ browser }) => {
  const range = { from: new Date(Date.now() - 60_000).toISOString(), to: new Date().toISOString() };

  const teacherContext = await browser.newContext();
  const teacherPage = await teacherContext.newPage();
  await signIn(teacherPage, elena.email, elena.password);
  const other = new URLSearchParams({ className: "Some Other Class", ...range });
  expect((await teacherPage.request.get(`/api/teacher/market/history?${other.toString()}`)).status()).toBe(403);
  // Too long, and an unknown symbol.
  expect((await history(teacherPage, { from: "2020-01-01T00:00:00Z", to: "2020-06-01T00:00:00Z" })).status).toBe(400);
  expect((await history(teacherPage, { ...range, ticker: "NOPE" })).status).toBe(404);
  await teacherContext.close();

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await signIn(studentPage, avery.email, avery.password);
  expect((await history(studentPage, range)).status).toBe(403);
  await studentContext.close();

  const adminContext = await browser.newContext();
  const adminPage = await adminContext.newPage();
  await signIn(adminPage, accounts.admin.email, accounts.admin.password);
  const all = await history(adminPage, range);
  expect(all.status).toBe(200);
  expect(all.body.series.length).toBeGreaterThan(1);
  await adminContext.close();
});
