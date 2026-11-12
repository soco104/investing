import { expect, test } from "@playwright/test";

import packageJson from "../../package.json" with { type: "json" };
import {
  accounts,
  SECURITY_ANSWER,
  signIn,
  signInButton,
  submitCredentials,
} from "./helpers";

test.describe("Sign in and out", () => {
  test("login page shows the version and the demo login option", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("footer").first()).toHaveText(`v${packageJson.version}`);

    await page.getByRole("button", { name: "Choose the demo login" }).click();
    await page.getByText("Demo super user (all roles)").click();
    await expect(page.locator("#login-email")).toHaveValue(accounts.superUser.email);
  });

  test("wrong password is rejected without revealing the security question", async ({
    page,
  }) => {
    await submitCredentials(page, accounts.superUser.email, "wrong-password");
    await expect(page.getByText(/did not match/)).toBeVisible();
    await expect(page.locator("#login-security-answer")).toHaveCount(0);
  });

  test("demo login requires the security question; a wrong answer is rejected", async ({
    page,
  }) => {
    await submitCredentials(page, accounts.superUser.email, accounts.superUser.password);
    await expect(page.locator('label[for="login-security-answer"]')).toHaveText(
      "What city was Sean born in?"
    );

    await page.locator("#login-security-answer").fill("Boston");
    await signInButton(page).click();
    await expect(page.getByText(/That answer isn't right\. \d tries? left\./)).toBeVisible();

    await page.locator("#login-security-answer").fill(` ${SECURITY_ANSWER.toUpperCase()} `);
    await signInButton(page).click();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("every demo account needs the security question (regression: issue #10)", async ({
    page,
  }) => {
    for (const account of [accounts.studentMaya, accounts.teacher, accounts.admin]) {
      await submitCredentials(page, account.email, account.password);
      await expect(page.locator("#login-security-answer"), account.email).toBeVisible();
    }
  });

  test("refreshing the page keeps you signed in (regression: issue #14)", async ({
    page,
  }) => {
    await signIn(page, accounts.student.email, accounts.student.password);
    await page.reload();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator("#login-email")).toHaveCount(0);
  });

  test("sign out ends the session, so refreshing shows the login page (regression: issue #13)", async ({
    page,
  }) => {
    await signIn(page, accounts.student.email, accounts.student.password);
    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.locator("#login-email")).toBeVisible();

    await page.reload();
    await expect(page.locator("#login-email")).toBeVisible();

    const me = await page.request.get("/api/auth/me");
    expect(await me.json()).toMatchObject({ authenticated: false });
  });

  // Runs last in this file: it locks the Jordan demo account for 15 minutes
  // (in this server process only).
  test("five wrong security answers lock the account", async ({ page }) => {
    await submitCredentials(
      page,
      accounts.studentJordan.email,
      accounts.studentJordan.password
    );

    // Wait for each exact message, so the next answer isn't typed while the
    // previous one is still being checked.
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      const remaining = 5 - attempt;
      await page.locator("#login-security-answer").fill(`Wrong ${attempt}`);
      await signInButton(page).click();
      await expect(
        page.getByText(
          `That answer isn't right. ${remaining} ${remaining === 1 ? "try" : "tries"} left.`
        )
      ).toBeVisible();
    }

    await page.locator("#login-security-answer").fill("Wrong 5");
    await signInButton(page).click();
    await expect(page.getByText(/Too many wrong answers/)).toBeVisible();

    // Even the right answer is refused while locked.
    await page.locator("#login-security-answer").fill(SECURITY_ANSWER);
    await signInButton(page).click();
    await expect(page.getByText(/Too many wrong answers/)).toBeVisible();
  });
});
