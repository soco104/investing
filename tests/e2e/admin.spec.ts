import { expect, test } from "@playwright/test";

import { accounts, assumeRole, signIn } from "./helpers";

test.describe("Admin portal", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, accounts.superUser.email, accounts.superUser.password);
  });

  test("the super user can assume every role", async ({ page }) => {
    await page.getByRole("button", { name: /Assume role/ }).click();
    const roles = page.getByRole("menuitem");
    await expect(roles).toHaveCount(3);
    await expect(roles.nth(0)).toContainText("Student");
    await expect(roles.nth(1)).toContainText("Teacher");
    await expect(roles.nth(2)).toContainText("Admin");
    await page.keyboard.press("Escape");
  });

  test("privacy posture saves and is still there after a refresh (regression: issue #12)", async ({
    page,
  }) => {
    await assumeRole(page, "Admin");
    await page.getByText("Set district compliance mode").first().click();
    await expect(page.getByText("Required privacy posture")).toBeVisible();

    const save = page.getByRole("button", { name: "Save", exact: true });
    await expect(save).toBeDisabled();

    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "District custom" }).click();
    await expect(page.getByText("Unsaved changes")).toBeVisible();

    await page.locator("#privacy-contact").fill("not-an-email");
    await save.click();
    await expect(page.getByText("Enter a valid privacy contact email.")).toBeVisible();

    await page.locator("#privacy-contact").fill("privacy@district.example");
    await save.click();
    await expect(page.getByText("Saved. The change is recorded in the audit log.")).toBeVisible();

    await page.reload();
    await assumeRole(page, "Admin");
    await page.getByText("Set district compliance mode").first().click();
    await expect(page.getByRole("combobox").first()).toHaveText("District custom");
    await expect(page.locator("#privacy-contact")).toHaveValue("privacy@district.example");
  });

  test("the Email page shows setup status and logs a test email", async ({ page }) => {
    await assumeRole(page, "Admin");
    await page.getByRole("heading", { name: "Email", exact: true }).first().click();
    const dialog = page.getByRole("dialog");

    // Email isn't configured in the test environment.
    await expect(dialog.getByText("Email is not set up yet.")).toBeVisible();
    await expect(dialog.getByText("RESEND_API_KEY, EMAIL_FROM")).toBeVisible();
    await expect(dialog.locator("#email-test-recipient")).toHaveValue(
      accounts.superUser.email
    );

    await dialog.getByRole("button", { name: "Send test" }).click();
    await expect(dialog.getByText(/written to the server log/)).toBeVisible();
    await expect(
      dialog.getByRole("row").filter({ hasText: accounts.superUser.email }).first()
    ).toContainText("Logged (not sent)");
  });
});
