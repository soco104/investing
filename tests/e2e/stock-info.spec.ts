import { expect, test, type Browser, type Page } from "@playwright/test";

import { accounts, signIn } from "./helpers";

// Stock info popup (v0.2.11). Avery is in 7th Grade Finance A, so her class
// defaults to the Basic level. Elena (her teacher) can change the level; Sam
// (admin) can change it for any class. All data is sample data.
const avery = accounts.student;
const elena = accounts.teacher;
const sam = accounts.admin;
const averyClass = "7th Grade Finance A";

async function signedIn(browser: Browser, account: { email: string; password: string }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, account.email, account.password);
  return { context, page };
}

async function openInfo(page: Page, ticker: string) {
  await page.getByRole("tab", { name: "Market" }).click();
  await page.getByRole("button", { name: `Stock info for ${ticker}` }).click();
  const popup = page.getByTestId("stock-info");
  await expect(popup.getByText("Sample data")).toBeVisible();
  return popup;
}

test("a student in a grade 7 class sees the Basic stock info popup", async ({ browser }) => {
  const { context, page } = await signedIn(browser, avery);
  const popup = await openInfo(page, "SPY");

  await expect(popup.getByRole("heading", { name: "What is this?" })).toBeVisible();
  await expect(popup.getByRole("img", { name: /SPY price chart/ })).toBeVisible();
  await expect(popup.getByTestId("stock-holding")).toBeVisible();
  // Basic: no key figures, headlines or range buttons.
  await expect(popup.getByTestId("stock-key-figures")).toHaveCount(0);
  await expect(popup.getByTestId("stock-headlines")).toHaveCount(0);
  await expect(popup.getByRole("group", { name: "Chart range" })).toHaveCount(0);

  // The server refuses Full data to a Basic class, whatever is asked for.
  const response = await page.request.get(`/api/market/info?ticker=SPY&range=1Y`);
  const body = (await response.json()) as { info: { headlines?: string[]; keyFigures?: unknown; level: string; range: string } };
  expect(body.info.level).toBe("basic");
  expect(body.info.range).toBe("1M");
  expect(body.info.headlines).toBeUndefined();
  expect(body.info.keyFigures).toBeUndefined();

  // A class she isn't in, and a symbol that isn't in her market, are refused.
  expect((await page.request.get("/api/market/info?ticker=SPY&className=8th%20Grade%20Investing%20Lab")).status()).toBe(403);
  expect((await page.request.get("/api/market/info?ticker=NOPE")).status()).toBe(404);

  // Trade closes the popup and jumps to that symbol's share box.
  await popup.getByRole("button", { name: "Trade SPY" }).click();
  await expect(popup).toBeHidden();
  await expect(page.getByLabel("Shares of SPY")).toBeFocused();
  await context.close();
});

test("teachers see Full, and can switch their class to Full for students", async ({ browser }) => {
  const teacher = await signedIn(browser, elena);
  const popup = await openInfo(teacher.page, "SPY");

  await expect(popup.getByTestId("stock-key-figures")).toContainText("Market cap");
  await expect(popup.getByTestId("stock-headlines")).toBeVisible();
  await popup.getByRole("button", { name: "1 year" }).click();
  await expect(popup.getByRole("button", { name: "1 year" })).toHaveAttribute("aria-pressed", "true");
  await teacher.page.keyboard.press("Escape");

  const panel = teacher.page.getByRole("region", { name: "Teacher market controls" });
  await panel.getByLabel("Class market").selectOption(averyClass);
  await expect(panel.getByLabel("Stock info level")).toHaveValue("");
  await panel.getByLabel("Stock info level").selectOption("full");
  await expect(panel.getByText(`Stock info level saved for ${averyClass}.`)).toBeVisible();

  // A teacher can't change a class that isn't theirs.
  const denied = await teacher.page.request.post("/api/teacher/market", {
    data: { action: "infoLevel", className: "Some Other Class", level: "full" },
  });
  expect(denied.status()).toBe(403);
  await teacher.context.close();

  const student = await signedIn(browser, avery);
  const studentPopup = await openInfo(student.page, "QQQ");
  await expect(studentPopup.getByTestId("stock-key-figures")).toContainText("P/E ratio");
  await expect(studentPopup.getByTestId("stock-headlines")).toBeVisible();

  // Students can't change the level.
  const notAllowed = await student.page.request.post("/api/teacher/market", {
    data: { action: "infoLevel", className: averyClass, level: "basic" },
  });
  expect(notAllowed.status()).toBe(403);
  await student.context.close();
});

test("an admin can set a class's stock info level back to Basic", async ({ browser }) => {
  const admin = await signedIn(browser, sam);
  const saved = await admin.page.request.post("/api/teacher/market", {
    data: { action: "infoLevel", className: averyClass, level: "basic" },
  });
  expect(saved.status()).toBe(200);
  expect(((await saved.json()) as { infoLevel: { level: string; setting: string } }).infoLevel).toMatchObject({
    level: "basic",
    setting: "basic",
  });
  await admin.context.close();

  const student = await signedIn(browser, avery);
  const info = (await (await student.page.request.get("/api/market/info?ticker=BND")).json()) as {
    info: { keyFigures?: unknown; level: string };
  };
  expect(info.info.level).toBe("basic");
  expect(info.info.keyFigures).toBeUndefined();
  await student.context.close();
});
