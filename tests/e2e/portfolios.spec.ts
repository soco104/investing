import { expect, test, type Page } from "@playwright/test";

import { schoolYearFor } from "../../lib/school-year";
import { accounts, assumeRole, signIn } from "./helpers";

// Avery is a 7th-grade student (whole shares). The portfolio is created on
// first sign-in with the class's starting cash. Tests in this file run in
// order and build on each other's trades.
const student = accounts.student;
const studentClass = "7th Grade Finance A";
// Default school year (Aug 28 – Jun 1), as configured by the seed.
const schoolYear = schoolYearFor(new Date()).label.replace("-", "–");

type PortfolioJson = {
  allocation: Array<{ name: string; value: number }>;
  allowFractional: boolean;
  cashCents: number;
  className: string;
  holdings: Array<{ quantityUnits: number; ticker: string }>;
  id: string;
  activity: Array<{ kind: string; note: string }>;
  kind: string;
  schoolYear: string;
  startingCashCents: number;
};

async function myPortfolio(page: Page) {
  const response = await page.request.get("/api/portfolios");
  const body = (await response.json()) as { portfolios: PortfolioJson[] };
  return body.portfolios[0];
}

// The market table row for a symbol (found by its own amount box, since the
// symbol cell also shows how many shares are held).
function row(page: Page, ticker: string) {
  return page.getByRole("row").filter({ has: page.getByLabel(`Shares of ${ticker}`) });
}

async function openMarket(page: Page) {
  await page.getByRole("tab", { name: "Market" }).click();
  await expect(page.getByText(`${studentClass} · ${schoolYear}`)).toBeVisible();
}

test.describe("Student portfolios", () => {
  test("a new portfolio starts with the class's starting cash", async ({ page }) => {
    await signIn(page, student.email, student.password);
    const portfolio = await myPortfolio(page);

    expect(portfolio).toMatchObject({ className: studentClass, kind: "class" });
    expect(portfolio.schoolYear.replace("-", "–")).toBe(schoolYear);
    expect(portfolio.cashCents).toBe(portfolio.startingCashCents);
  });

  test("buy with − / + and the amount box; the trade survives a refresh", async ({ page }) => {
    await signIn(page, student.email, student.password);
    await openMarket(page);

    const bnd = row(page, "BND");
    const amount = bnd.getByLabel("Shares of BND");
    await expect(amount).toHaveValue("1");
    await bnd.getByRole("button", { name: "One more BND share" }).click();
    await bnd.getByRole("button", { name: "One more BND share" }).click();
    await bnd.getByRole("button", { name: "One more BND share" }).click();
    await bnd.getByRole("button", { name: "One fewer BND share" }).click();
    await expect(amount).toHaveValue("3");

    await bnd.getByRole("button", { name: "Buy", exact: true }).click();
    await expect(page.getByText("Bought 3 shares of BND.")).toBeVisible();

    await page.reload();
    await openMarket(page);
    await expect(row(page, "BND")).toContainText("3 held");

    const portfolio = await myPortfolio(page);
    expect(portfolio.holdings).toContainEqual(
      expect.objectContaining({ quantityUnits: 30_000, ticker: "BND" })
    );
  });

  test("typing a larger amount, and selling", async ({ page }) => {
    await signIn(page, student.email, student.password);
    await openMarket(page);

    const bnd = row(page, "BND");
    await bnd.getByLabel("Shares of BND").fill("2");
    await bnd.getByRole("button", { name: "Sell" }).click();
    await expect(page.getByText("Sold 2 shares of BND.")).toBeVisible();
    await expect(row(page, "BND")).toContainText("1 held");
  });

  test("the server refuses overspending, overselling, and fractions in a whole-share class", async ({
    page,
  }) => {
    await signIn(page, student.email, student.password);
    await openMarket(page);
    await expect(page.getByText(/This class trades whole shares/)).toBeVisible();

    const spy = row(page, "SPY");
    await spy.getByLabel("Shares of SPY").fill("1000");
    await spy.getByRole("button", { name: "Buy", exact: true }).click();
    await expect(page.getByText("Not enough cash for that trade.")).toBeVisible();

    await spy.getByLabel("Shares of SPY").fill("5");
    await spy.getByRole("button", { name: "Sell" }).click();
    await expect(page.getByText("You don't own that many shares.")).toBeVisible();

    const bnd = row(page, "BND");
    await bnd.getByLabel("Shares of BND").fill("0.5");
    await bnd.getByRole("button", { name: "Buy", exact: true }).click();
    await expect(page.getByText("This class trades whole shares only.")).toBeVisible();
  });

  test("grade 10+ classes can trade fractional shares", async ({ browser }) => {
    const adminPage = await browser.newPage();
    await signIn(adminPage, accounts.superUser.email, accounts.superUser.password);
    const setGrade = (gradeLevel: number | null) =>
      adminPage.request.post("/api/admin/class-market", {
        data: { className: studentClass, gradeLevel },
      });

    expect((await setGrade(11)).ok()).toBe(true);

    try {
      const page = await browser.newPage();
      await signIn(page, student.email, student.password);
      await openMarket(page);
      await expect(page.getByText(/can trade fractional shares/)).toBeVisible();

      const bnd = row(page, "BND");
      await bnd.getByLabel("Shares of BND").fill("0.5");
      await bnd.getByRole("button", { name: "Buy", exact: true }).click();
      await expect(page.getByText("Bought 0.5 shares of BND.")).toBeVisible();
      await expect(row(page, "BND")).toContainText("1.5 held");
      await page.close();
    } finally {
      await setGrade(null);
      await adminPage.close();
    }
  });

  test("allocation targets save", async ({ page }) => {
    await signIn(page, student.email, student.password);
    await page.getByText("Portfolio value").first().click();
    await expect(page.getByRole("heading", { name: "Portfolio", exact: true })).toBeVisible();

    const before = (await myPortfolio(page)).allocation.find((t) => t.name === "Index stocks");
    // Index stocks is the first allocation slider.
    const slider = page.getByRole("slider").first();
    await slider.focus();
    await page.keyboard.press("ArrowRight");
    await page.getByRole("button", { name: "Save allocation" }).click();

    await expect
      .poll(async () => (await myPortfolio(page)).allocation.find((t) => t.name === "Index stocks")?.value)
      .toBe((before?.value ?? 0) + 1);
  });

  test("the portfolio history lists this school year's class portfolio", async ({ page }) => {
    await signIn(page, student.email, student.password);
    await page.getByText("Portfolio value").first().click();

    const history = page.getByRole("region", { name: "Your portfolios" });
    await expect(history).toBeVisible();
    const current = history.getByRole("row").filter({ hasText: studentClass });
    await expect(current).toContainText(schoolYear);
    await expect(current).toContainText("Current");
    await expect(current).toContainText("Viewing");
  });

  test("staff get a practice portfolio in the Student view", async ({ page }) => {
    await signIn(page, accounts.superUser.email, accounts.superUser.password);
    await page.getByRole("tab", { name: "Market" }).click();
    await expect(page.getByText(`Practice portfolio · ${schoolYear}`)).toBeVisible();
    await expect(page.getByText(/can trade fractional shares/)).toBeVisible();
  });
});

test.describe("Corrections and resets", () => {
  test("an admin correction changes the student's cash, with before and after", async ({
    browser,
  }) => {
    const studentPage = await browser.newPage();
    await signIn(studentPage, student.email, student.password);
    const before = (await myPortfolio(studentPage)).cashCents;

    const page = await browser.newPage();
    await signIn(page, accounts.superUser.email, accounts.superUser.password);
    await assumeRole(page, "Admin");
    await page.getByRole("heading", { name: "Portfolio corrections" }).first().click();
    await page.getByLabel("Student email").fill(student.email);
    await page.getByLabel(/Cash adjustment/).fill("25");
    await page.getByLabel("Audit reason").fill("E2E: classroom error");
    await page.getByRole("button", { name: "Apply correction" }).click();
    await expect(page.getByText(/Correction applied and audited\. Cash went from/)).toBeVisible();

    expect((await myPortfolio(studentPage)).cashCents).toBe(before + 2500);
    await studentPage.close();
    await page.close();
  });

  test("teacher requests a reset; admin approves; the portfolio resets and keeps its history", async ({
    browser,
  }) => {
    // Unique per run, so earlier runs' requests in the same database don't match.
    const reason = `E2E reset ${Date.now()}`;
    const adminNote = `Approved ${Date.now()}`;
    // Teacher asks.
    const teacher = await browser.newPage();
    await signIn(teacher, accounts.teacher.email, accounts.teacher.password);
    await assumeRole(teacher, "Teacher");
    await teacher.getByRole("button", { name: "Request portfolio reset" }).click();
    const dialog = teacher.getByRole("dialog");
    await dialog.getByRole("combobox").click();
    // The class has several students since v0.2.14, so pick Avery by name.
    await teacher.getByRole("option", { name: new RegExp(`Avery Johnson · ${studentClass}`) }).click();
    await dialog.getByLabel("Reason").fill(reason);
    await dialog.getByRole("button", { name: "Send request" }).click();
    await expect(dialog.getByText(/Request sent/)).toBeVisible();

    // A second request for the same portfolio is refused while one is pending.
    await dialog.getByRole("combobox").click();
    // The class has several students since v0.2.14, so pick Avery by name.
    await teacher.getByRole("option", { name: new RegExp(`Avery Johnson · ${studentClass}`) }).click();
    await dialog.getByLabel("Reason").fill("again");
    await dialog.getByRole("button", { name: "Send request" }).click();
    await expect(dialog.getByText(/already a pending reset request/)).toBeVisible();
    await teacher.keyboard.press("Escape");

    // Admin approves.
    const admin = await browser.newPage();
    await signIn(admin, accounts.superUser.email, accounts.superUser.password);
    await assumeRole(admin, "Admin");
    await admin.getByRole("heading", { name: "Portfolio corrections" }).first().click();
    const queue = admin.getByRole("region", { name: "Portfolio reset requests" });
    const request = queue.getByRole("listitem").filter({ hasText: reason });
    await request.getByLabel("Note to the teacher (optional)").fill(adminNote);
    await request.getByRole("button", { name: "Approve reset" }).click();
    await expect(queue.getByText(/Approved: the portfolio was reset/)).toBeVisible();

    // The student's portfolio is back to starting cash, with the reset in its history.
    const studentPage = await browser.newPage();
    await signIn(studentPage, student.email, student.password);
    const portfolio = await myPortfolio(studentPage);
    expect(portfolio.cashCents).toBe(portfolio.startingCashCents);
    expect(portfolio.holdings).toEqual([]);
    expect(portfolio.activity[0]).toMatchObject({ kind: "reset" });
    expect(portfolio.activity.some((entry) => entry.kind === "buy")).toBe(true);

    // The teacher sees the outcome.
    await teacher.reload();
    await assumeRole(teacher, "Teacher");
    await expect(teacher.getByText(`Approved · ${adminNote}`)).toBeVisible();

    await Promise.all([teacher.close(), admin.close(), studentPage.close()]);
  });
});

test.describe("School year setting", () => {
  test("admins can change the school year dates", async ({ page }) => {
    await signIn(page, accounts.superUser.email, accounts.superUser.password);
    await assumeRole(page, "Admin");

    await page.getByRole("heading", { name: "School year", exact: true }).first().click();
    const dialog = page.getByRole("dialog");
    // Save is enabled once the saved dates have loaded.
    await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeEnabled();
    await expect(dialog.getByLabel("First day month")).toHaveValue("08");
    await expect(dialog.getByLabel("First day day")).toHaveValue("28");
    await expect(dialog.getByLabel("Last day month")).toHaveValue("06");

    await dialog.getByLabel("First day day").selectOption("20");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(dialog.getByText("Saved. The change is recorded in the audit log.")).toBeVisible();

    // Regression: issue #19. The server has exactly what the admin picked.
    const saved = await page.request.get("/api/admin/school-year");
    expect((await saved.json()).settings).toEqual({ end: "06-01", start: "08-20" });

    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("heading", { name: "School year", exact: true }).first().click();
    await expect(page.getByRole("dialog").getByLabel("First day day")).toHaveValue("20");

    // Put the default back for other tests.
    await page.getByRole("dialog").getByRole("button", { name: /Use default/ }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByRole("dialog").getByText(/Saved\./)).toBeVisible();
  });
});
