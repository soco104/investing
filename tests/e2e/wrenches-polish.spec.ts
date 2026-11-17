import { expect, test, type Browser, type Page } from "@playwright/test";

import { accounts, signIn } from "./helpers";

// Wrenches polish (v0.2.19): market event templates, difficulty presets,
// "Surprise me" and combo events. Elena teaches 7th Grade Finance A.
const elena = accounts.teacher;
const avery = accounts.student;
const className = "7th Grade Finance A";

async function signedIn(browser: Browser, account: { email: string; password: string }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, account.email, account.password);
  return { context, page };
}

type View = { changes: Array<{ id: string; label: string; percent: number; ticker: string }> };

async function marketView(page: Page) {
  return (await (await page.request.get(`/api/teacher/market?className=${encodeURIComponent(className)}`)).json()) as View;
}

async function reset(page: Page) {
  await page.request.post("/api/teacher/market", { data: { action: "reset", className } });
}

test("a teacher starts a market event from a template, at a difficulty", async ({ browser }) => {
  const teacher = await signedIn(browser, elena);
  await reset(teacher.page);
  await teacher.page.getByRole("tab", { name: "Market" }).click();
  const panel = teacher.page.getByRole("region", { name: "Teacher market controls" });
  await panel.getByLabel("Class market").selectOption(className);
  const events = panel.getByTestId("market-events");
  await events.getByLabel("Event").selectOption("recession");
  await expect(events).toContainText("The economy shrinks");
  await events.getByLabel("Difficulty").selectOption("gentle");
  await events.getByRole("button", { name: "Start market event" }).click();
  await expect(panel.getByRole("status")).toContainText("Recession started");

  // Gentle = half the realistic moves: QQQ -6% (realistic -12%), BND +2% (realistic +3%, rounded).
  const view = await marketView(teacher.page);
  const byTicker = Object.fromEntries(view.changes.map((change) => [change.ticker, change.percent]));
  expect(byTicker.QQQ).toBe(-6);
  expect(byTicker.BND).toBe(2);
  expect(view.changes.every((change) => change.label.startsWith("Recession"))).toBe(true);

  // A company scandal needs a symbol, and moves only that one.
  const noTicker = await teacher.page.request.post("/api/teacher/market", {
    data: { action: "change", change: { kind: "template", templateId: "company-scandal" }, target: { className, type: "class" } },
  });
  expect(noTicker.status()).toBe(400);
  const scandal = await teacher.page.request.post("/api/teacher/market", {
    data: { action: "change", change: { kind: "template", templateId: "company-scandal", ticker: "QQQ" }, target: { className, type: "class" } },
  });
  expect(scandal.ok()).toBe(true);
  const after = await marketView(teacher.page);
  expect(after.changes.find((change) => change.label.startsWith("Company scandal"))).toMatchObject({ percent: -20, ticker: "QQQ" });
  await reset(teacher.page);
  await teacher.context.close();
});

test("difficulty scales life event cards, Surprise me picks a card, and a combo plays both", async ({ browser }) => {
  const teacher = await signedIn(browser, elena);
  await reset(teacher.page);
  await teacher.page.getByRole("tab", { name: "Market" }).click();
  const panel = teacher.page.getByRole("region", { name: "Life events" });
  await panel.locator("#life-event-class").selectOption(className);

  // Surprise me fills in a card.
  await panel.getByRole("button", { name: "Surprise me" }).click();
  await expect(panel.locator("#life-event-card")).not.toHaveValue("");
  await expect(panel.getByTestId("card-details")).toBeVisible();

  // Tough: an 8% car repair becomes 12%.
  await panel.locator("#life-event-card").selectOption("car-repair");
  await panel.getByLabel("Difficulty").selectOption("tough");
  await expect(panel.getByTestId("card-details")).toContainText("12% of starting cash, tough");

  // The "Recession + hours cut" combo fills in both halves.
  await panel.getByRole("group", { name: "Combo presets" }).getByRole("button", { name: "Recession + hours cut" }).click();
  await expect(panel.locator("#life-event-card")).toHaveValue("hours-cut");
  await expect(panel.getByLabel("Also start a market event (combo)")).toHaveValue("recession");
  await panel.locator("#life-event-target").selectOption("student");
  await panel.locator("#life-event-student").selectOption(avery.email);
  await panel.getByRole("button", { name: "Preview" }).click();
  // Hours cut is 7%; tough makes it 11% (7 x 1.5 = 10.5, rounded).
  await expect(panel.getByTestId("life-event-preview")).toContainText("−11% of starting cash");
  await panel.getByRole("button", { name: "Play this card" }).click();
  await expect(panel.getByRole("status")).toContainText("The market event moved");

  const view = await marketView(teacher.page);
  // Tough recession: QQQ -18% (realistic -12% x 1.5).
  expect(view.changes.find((change) => change.ticker === "QQQ")?.percent).toBe(-18);

  // Tidy up: undo the card and the market event.
  const list = (await (await teacher.page.request.get("/api/teacher/life-events")).json()) as { events: Array<{ id: string; undoneAt: string | null }> };
  for (const event of list.events.filter((item) => !item.undoneAt)) {
    await teacher.page.request.post("/api/teacher/life-events", { data: { action: "undo", eventId: event.id } });
  }
  await reset(teacher.page);
  await teacher.context.close();
});
