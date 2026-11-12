import { expect, test, type Browser, type Page } from "@playwright/test";

import { accounts, signIn } from "./helpers";

// Teacher market controls (v0.2.8). Elena teaches 7th Grade Finance A (Avery's
// class), 7th Grade Finance B and 8th Grade Investing Lab. Changes are saved on
// the server and change the prices students see and trade at.
const teacher = accounts.teacher;
const student = accounts.student;
const studentClass = "7th Grade Finance A";

type Symbol = { name: string; news?: string | null; priceCents: number; ticker: string };

async function openTeacherControls(page: Page, className = studentClass) {
  await signIn(page, teacher.email, teacher.password);
  await page.getByRole("tab", { name: "Market" }).click();
  const panel = page.getByRole("region", { name: "Teacher market controls" });
  await expect(panel).toBeVisible();
  await panel.getByLabel("Class market").selectOption(className);
  await expect(panel.getByRole("heading", { name: `Active changes in ${className}` })).toBeVisible();
  return panel;
}

/** Avery's view of the class market, from a separate signed-in browser. */
async function studentSymbols(browser: Browser, expectOnScreen?: string) {
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await signIn(page, student.email, student.password);
    if (expectOnScreen) {
      await page.getByRole("tab", { name: "Market" }).click();
      await expect(page.getByText(expectOnScreen).first()).toBeVisible();
    }
    const response = await page.request.get("/api/portfolios");
    const body = (await response.json()) as {
      portfolios: Array<{ className: string; market: { symbols: Symbol[] } }>;
    };
    const portfolio = body.portfolios.find((item) => item.className === studentClass);
    return new Map((portfolio?.market.symbols ?? []).map((symbol) => [symbol.ticker, symbol]));
  } finally {
    await context.close();
  }
}

async function classPrice(page: Page, ticker: string) {
  const response = await page.request.get(
    `/api/teacher/market?className=${encodeURIComponent(studentClass)}`
  );
  const body = (await response.json()) as { market: Array<{ price: number; ticker: string }> };
  return body.market.find((symbol) => symbol.ticker === ticker)?.price ?? NaN;
}

test.describe("Teacher market controls", () => {
  test("raise a symbol for the whole class; students see it; undo puts it back", async ({
    browser,
    page,
  }) => {
    const panel = await openTeacherControls(page);
    const before = await classPrice(page, "SPY");

    await panel.getByRole("button", { name: "Raise SPY" }).click();
    await expect(panel.getByRole("status")).toContainText(
      `Raised SPY 3% for ${studentClass}. Students see the new prices now.`
    );
    const changes = panel.getByRole("list", { name: "Active changes" });
    await expect(changes).toContainText("Raised SPY 3%");
    await expect(changes).toContainText("Whole class");
    expect(await classPrice(page, "SPY")).toBeCloseTo(before * 1.03, 1);

    // The student trades at the raised price and sees the teacher's news.
    const raised = (await studentSymbols(browser, "Teacher update: SPY moved up 3%.")).get("SPY");
    expect(raised?.news).toBe("Teacher update: SPY moved up 3%.");
    expect((raised?.priceCents ?? 0) / 100).toBeCloseTo(before * 1.03, 1);

    // The change survives a refresh (it's saved), then Undo removes it.
    await page.reload();
    await page.getByRole("tab", { name: "Market" }).click();
    const again = page.getByRole("region", { name: "Teacher market controls" });
    await again.getByLabel("Class market").selectOption(studentClass);
    await expect(again.getByRole("list", { name: "Active changes" })).toContainText("Raised SPY 3%");
    await again.getByRole("button", { name: "Undo Raised SPY 3%" }).click();
    await expect(again.getByRole("status")).toContainText("Undid Raised SPY 3%.");
    await expect(again.getByText("No active changes. Students see the normal class market.")).toBeVisible();

    const restored = (await studentSymbols(browser)).get("SPY");
    expect(restored?.news ?? null).not.toBe("Teacher update: SPY moved up 3%.");
    expect((restored?.priceCents ?? 0) / 100).toBeCloseTo(before, 1);
  });

  test("a change for one student leaves the class price alone; reset to normal", async ({
    browser,
    page,
  }) => {
    const panel = await openTeacherControls(page);
    const before = await classPrice(page, "QQQ");

    await panel.getByLabel("Who it applies to").selectOption("student");
    await panel.getByRole("button", { name: "Lower QQQ" }).click();
    await expect(panel.getByRole("status")).toContainText("Choose a student first.");

    await panel.getByLabel("Student", { exact: true }).selectOption({ label: "Avery Johnson" });
    await panel.getByRole("button", { name: "Lower QQQ" }).click();
    await expect(panel.getByRole("status")).toContainText("Lowered QQQ 3% for Avery Johnson.");
    await expect(panel.getByRole("list", { name: "Active changes" })).toContainText("Avery Johnson");

    // Class-wide price is unchanged; only Avery's price moved.
    expect(await classPrice(page, "QQQ")).toBeCloseTo(before, 1);
    const avery = (await studentSymbols(browser)).get("QQQ");
    expect(avery?.news).toBe("Teacher update: QQQ moved down 3%.");
    expect((avery?.priceCents ?? 0) / 100).toBeCloseTo(before * 0.97, 1);

    await panel.getByRole("button", { name: "Reset to normal" }).click();
    await expect(panel.getByRole("status")).toContainText(`${studentClass} is back to normal prices.`);
    await expect(panel.getByText("No active changes. Students see the normal class market.")).toBeVisible();
  });

  test("the Hormuz scenario moves the chosen symbols and skips ones not in the class", async ({
    page,
  }) => {
    const panel = await openTeacherControls(page);

    await panel.getByLabel("Affected symbols").fill("SPY,XLE");
    await panel.getByLabel("Oil spike %").fill("20");
    await panel.getByRole("button", { name: "Trigger scenario" }).click();
    await expect(panel.getByRole("status")).toContainText("Strait of Hormuz scenario started");
    await expect(panel.getByRole("status")).toContainText(`Skipped: XLE (not in ${studentClass}).`);
    await expect(panel.getByRole("list", { name: "Active changes" })).toContainText(
      "Strait of Hormuz blockade: SPY +20%"
    );

    await panel.getByRole("button", { name: "Reset to normal" }).click();
    await expect(panel.getByText("No active changes. Students see the normal class market.")).toBeVisible();
  });

  test("students can't change the market", async ({ page }) => {
    await signIn(page, student.email, student.password);
    const response = await page.request.post("/api/teacher/market", {
      data: { action: "reset", className: studentClass },
    });
    expect(response.status()).toBe(403);
  });
});
