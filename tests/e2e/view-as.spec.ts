import { expect, test, type Page } from "@playwright/test";

import { accounts, assumeRole, signIn } from "./helpers";

const student = accounts.student;

async function openViewAs(page: Page) {
  await assumeRole(page, "Admin");
  await page.getByRole("heading", { name: "View as student", exact: true }).first().click();
  return page.getByRole("dialog");
}

test.describe("View as student", () => {
  test("only student accounts, and a reason is required", async ({ page }) => {
    await signIn(page, accounts.superUser.email, accounts.superUser.password);
    const dialog = await openViewAs(page);
    const start = dialog.getByRole("button", { name: "Start viewing as student" });

    await dialog.getByLabel("Student email").fill(student.email);
    await start.click();
    await expect(dialog.getByText("Enter the student's email and a reason.")).toBeVisible();

    await dialog.getByLabel("Student email").fill(accounts.teacher.email);
    await dialog.getByLabel("Reason").fill("E2E check");
    await start.click();
    await expect(dialog.getByText("View as is only for student accounts.")).toBeVisible();

    await dialog.getByLabel("Student email").fill("nobody@example.edu");
    await start.click();
    await expect(dialog.getByText(/No active user was found/)).toBeVisible();
  });

  test("an admin views as a student, acts for them, and exits", async ({ browser }) => {
    const page = await browser.newPage();
    await signIn(page, accounts.superUser.email, accounts.superUser.password);
    const dialog = await openViewAs(page);
    await dialog.getByLabel("Student email").fill(student.email);
    await dialog.getByLabel("Reason").fill("E2E: student reports trades failing");
    await dialog.getByRole("button", { name: "Start viewing as student" }).click();

    // The whole app is now the student's, with a banner.
    const banner = page.getByRole("status", { name: "Viewing as student" });
    await expect(banner).toContainText("Viewing as Avery Johnson");
    await expect(banner).toContainText("admin: Demo User");

    // Admin-only views aren't available while viewing as the student.
    await page.getByRole("button", { name: /Assume role/ }).click();
    await expect(page.getByRole("menuitem")).toHaveCount(1);
    await expect(page.getByRole("menuitem").first()).toContainText("Student");
    await page.keyboard.press("Escape");

    // Viewing continues after a refresh (it's part of the admin's session).
    await page.reload();
    await expect(banner).toBeVisible();

    // Act for the student: the trade is saved to their portfolio.
    await page.getByRole("tab", { name: "Market" }).click();
    await expect(page.getByText(/7th Grade Finance A ·/)).toBeVisible();
    const bnd = page.getByRole("row").filter({ has: page.getByLabel("Shares of BND") });
    await bnd.getByRole("button", { name: "Buy", exact: true }).click();
    await expect(page.getByText("Bought 1 share of BND.")).toBeVisible();

    // Exit: back to the admin's own account.
    await banner.getByRole("button", { name: "Exit" }).click();
    await expect(banner).toHaveCount(0);
    await page.getByRole("button", { name: /Assume role/ }).click();
    await expect(page.getByRole("menuitem")).toHaveCount(3);
    await page.keyboard.press("Escape");

    // The student sees the trade, marked as done by the admin on their behalf.
    const studentPage = await browser.newPage();
    await signIn(studentPage, student.email, student.password);
    await expect(studentPage.getByRole("status", { name: "Viewing as student" })).toHaveCount(0);
    const response = await studentPage.request.get("/api/portfolios");
    const { portfolios } = (await response.json()) as {
      portfolios: Array<{ activity: Array<{ byOwner: boolean; kind: string; note: string }> }>;
    };
    const latest = portfolios[0].activity[0];
    expect(latest).toMatchObject({ byOwner: false, kind: "buy" });
    expect(latest.note).toContain("By admin Demo User on the student's behalf");

    await Promise.all([page.close(), studentPage.close()]);
  });
});
