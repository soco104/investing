import { expect, test } from "@playwright/test";

import { accounts, assumeRole, signIn, signInButton, submitCredentials } from "./helpers";

// Uses the Maya demo student; the seed resets her password before each run.
// (Not the teacher: in development the app also accepts built-in copies of a
// few demo accounts with their original passwords, which would make the "old
// password no longer works" check fail. That fallback is off in production.)
const target = accounts.studentMaya;
const newPassword = "E2eNewPassword1";

test.describe("Password reset", () => {
  test("unknown email shows a clear message (regression: issue #11)", async ({ page }) => {
    await signIn(page, accounts.superUser.email, accounts.superUser.password);
    await assumeRole(page, "Admin");
    await page.getByRole("heading", { name: "Password resets" }).first().click();

    await page.locator("#reset-email").fill("nobody@example.edu");
    await page.getByRole("button", { name: "Send reset" }).click();
    await expect(
      page.getByText("No user was found with the email nobody@example.edu.")
    ).toBeVisible();
  });

  test("full reset: email link → set new password → sign in", async ({ page }) => {
    await signIn(page, accounts.superUser.email, accounts.superUser.password);
    await assumeRole(page, "Admin");
    await page.getByRole("heading", { name: "Password resets" }).first().click();
    await page.locator("#reset-email").fill(target.email);
    await page.getByRole("button", { name: "Send reset" }).click();
    await expect(page.getByText(`Reset created for ${target.email}`)).toBeVisible();

    // Email isn't configured in tests, so get a fresh link the same way the
    // email would carry it (the API returns it outside production).
    const reset = await page.request.post("/api/admin/password-resets", {
      data: { email: target.email },
    });
    const { resetUrl } = (await reset.json()) as { resetUrl: string };
    expect(resetUrl).toContain("/reset-password?token=");

    // Close the reset popup, then sign out.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.locator("#login-email")).toBeVisible();
    await page.goto(resetUrl);

    const setPassword = page.getByRole("button", { name: "Set new password" });
    await page.locator("#new-password").fill("short");
    await page.locator("#confirm-password").fill("short");
    await setPassword.click();
    await expect(page.getByText("Use at least 10 characters.")).toBeVisible();

    await page.locator("#new-password").fill(newPassword);
    await page.locator("#confirm-password").fill(`${newPassword}x`);
    await setPassword.click();
    await expect(page.getByText("The two passwords don't match.")).toBeVisible();

    await page.locator("#confirm-password").fill(newPassword);
    await setPassword.click();
    await expect(page.getByText("Your password has been changed.")).toBeVisible();

    // The link only works once.
    await page.goto(resetUrl);
    await page.locator("#new-password").fill("AnotherPassword1");
    await page.locator("#confirm-password").fill("AnotherPassword1");
    await setPassword.click();
    await expect(page.getByText("The reset token is invalid or expired.")).toBeVisible();

    // Old password no longer works; the new one does.
    await submitCredentials(page, target.email, target.password);
    await expect(page.getByText(/did not match/)).toBeVisible();
    await signIn(page, target.email, newPassword);
  });

  test("a link without a reset code explains what to do", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(page.getByText(/missing its reset code/)).toBeVisible();
    await expect(signInButton(page)).toHaveCount(0);
  });
});
