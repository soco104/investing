import { expect, type Page } from "@playwright/test";

export const SECURITY_ANSWER = process.env.DEMO_SECURITY_ANSWER ?? "Concord";

// Demo accounts loaded by scripts/seed-demo-data.mjs. Each test file uses its
// own accounts where it changes state (passwords, lockouts), so tests don't
// interfere with each other.
export const accounts = {
  superUser: { email: "demo-user@demo.edu", password: "demo-user" },
  student: { email: "avery.johnson@example.edu", password: "student-demo" },
  studentMaya: { email: "maya.patel@example.edu", password: "student-demo" },
  studentJordan: { email: "jordan.lee@example.edu", password: "student-demo" },
  // Classmates added in v0.2.14. Noah and Sofia are in Avery's class.
  studentNoah: { email: "noah.kim@example.edu", password: "student-demo" },
  studentSofia: { email: "sofia.garcia@example.edu", password: "student-demo" },
  teacher: { email: "elena.rivera@example.edu", password: "teacher-demo" },
  admin: { email: "sam.gordon@example.edu", password: "admin-demo" },
};

export function signInButton(page: Page) {
  return page.getByRole("button", { name: "Sign in", exact: true });
}

/** Enters email and password and clicks Sign in (no security answer yet). */
export async function submitCredentials(page: Page, email: string, password: string) {
  await page.goto("/");
  await expect(page.locator("#login-email")).toBeVisible();
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await signInButton(page).click();
}

/** Full sign-in for a demo account, including the security question. */
export async function signIn(page: Page, email: string, password: string) {
  await submitCredentials(page, email, password);
  await expect(page.locator("#login-security-answer")).toBeVisible();
  await page.locator("#login-security-answer").fill(SECURITY_ANSWER);
  await signInButton(page).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible({
    timeout: 30_000,
  });
}

/** Switches the "Assume role" menu to the given view. */
export async function assumeRole(page: Page, role: "Student" | "Teacher" | "Admin") {
  await page.getByRole("button", { name: /Assume role/ }).click();
  await page.getByRole("menuitem", { name: new RegExp(`^${role}`) }).click();
}
