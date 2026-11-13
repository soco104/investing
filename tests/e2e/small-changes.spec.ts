import { execFileSync } from "node:child_process";

import { expect, test, type Browser, type Page } from "@playwright/test";
import postgres from "postgres";

import { accounts, assumeRole, signIn } from "./helpers";

// v0.2.14 small changes: Buy max, the Stocks value card, who shows in New
// message, demo messages and flags, and a check that staff-only features
// stay hidden from students.
const avery = accounts.student;
const noah = accounts.studentNoah; // fresh portfolio, used for Buy max
const elena = accounts.teacher;
const sam = accounts.admin;

async function signedIn(browser: Browser, account: { email: string; password: string }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, account.email, account.password);
  return { context, page };
}

async function recipientOptions(page: Page) {
  await page.getByRole("tab", { name: /Inbox/ }).click();
  await page.getByRole("button", { name: "New message" }).click();
  const picker = page.locator("#new-message-recipient");
  await expect(picker).toBeEnabled();
  return picker.locator("option").allTextContents();
}

test("Buy max buys as many whole shares as the cash covers", async ({ page }) => {
  await signIn(page, noah.email, noah.password);
  await page.getByRole("tab", { name: "Market" }).click();

  const before = (await (await page.request.get("/api/portfolios")).json()) as {
    portfolios: Array<{ cashCents: number; id: string; kind: string }>;
  };
  const portfolio = before.portfolios.find((item) => item.kind === "class") ?? before.portfolios[0];
  expect(portfolio.cashCents).toBeGreaterThan(0);

  // Selling with "max" isn't a thing.
  const badSell = await page.request.post("/api/portfolios/trade", {
    data: { max: true, portfolioId: portfolio.id, shares: 0, side: "sell", ticker: "BND" },
  });
  expect(badSell.status()).toBe(400);

  const button = page.getByRole("button", { name: /^Buy max BND:/ });
  await expect(button).toBeEnabled();
  await expect(button).toHaveText(/Buy max \([\d,]+\)/);
  await button.click();
  await expect(page.getByText(/Bought [\d,]+ shares of BND\. Price: \$[\d,.]+ a share\./)).toBeVisible();

  // What's left can't buy another whole BND share, and nothing was overspent.
  const after = (await (await page.request.get("/api/portfolios")).json()) as {
    portfolios: Array<{
      cashCents: number;
      holdings: Array<{ quantityUnits: number; ticker: string }>;
      id: string;
      market: { symbols: Array<{ priceCents: number; ticker: string }> };
    }>;
  };
  const updated = after.portfolios.find((item) => item.id === portfolio.id);
  const bnd = updated?.market.symbols.find((symbol) => symbol.ticker === "BND");
  expect(updated?.cashCents).toBeGreaterThanOrEqual(0);
  expect(updated?.cashCents).toBeLessThan((bnd?.priceCents ?? 0) * 1.02);
  const held = updated?.holdings.find((holding) => holding.ticker === "BND");
  expect((held?.quantityUnits ?? 0) % 10_000).toBe(0); // whole shares only
  expect(held?.quantityUnits).toBeGreaterThan(0);

  // With almost no cash left, Buy max is off for an expensive symbol.
  await expect(page.getByRole("button", { name: /^Buy max SPY: 0 whole shares/ })).toBeDisabled();
  const refused = await page.request.post("/api/portfolios/trade", {
    data: { max: true, portfolioId: portfolio.id, shares: 0, side: "buy", ticker: "SPY" },
  });
  expect(refused.status()).toBe(400);
  expect(((await refused.json()) as { message: string }).message).toContain("enough cash");

  // The Stocks value card totals the shares and jumps to the Stocks section.
  const card = page.getByRole("button", { name: /Stocks value/ });
  await expect(card).toContainText(/shares in 1 stock/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await card.click();
  await expect(page.locator("#market-stocks")).toBeInViewport();
});

test("New message lists the right people for students, teachers and admins", async ({ browser }) => {
  const student = await signedIn(browser, avery);
  const studentOptions = await recipientOptions(student.page);
  expect(studentOptions).toEqual(expect.arrayContaining(["Elena Rivera"]));
  expect(studentOptions.some((option) => option.startsWith("Noah Kim"))).toBe(true);
  expect(studentOptions.some((option) => option.startsWith("Sofia Garcia"))).toBe(true);
  // Not students in other classes, and not admins.
  expect(studentOptions.some((option) => /Maya Patel|Liam Chen|Jordan Lee|Sam Gordon/.test(option))).toBe(false);
  await student.context.close();

  const teacher = await signedIn(browser, elena);
  const teacherOptions = await recipientOptions(teacher.page);
  for (const name of ["Avery Johnson", "Noah Kim", "Sofia Garcia", "Maya Patel", "Liam Chen", "Jordan Lee", "Zoe Brooks"]) {
    expect(teacherOptions.some((option) => option.startsWith(name)), name).toBe(true);
  }
  expect(teacherOptions).toEqual(expect.arrayContaining(["Sam Gordon", "Demo User"]));
  // Students are labelled with their class.
  expect(teacherOptions).toContain("Noah Kim (7th Grade Finance A)");
  await teacher.context.close();

  const admin = await signedIn(browser, sam);
  const adminOptions = await recipientOptions(admin.page);
  expect(adminOptions).toEqual(expect.arrayContaining(["Elena Rivera", "Demo User"]));
  expect(adminOptions.some((option) => option.startsWith("Zoe Brooks"))).toBe(true);
  await admin.context.close();
});

test.describe("demo messages", () => {
  const databaseUrl = process.env.DATABASE_URL as string;
  const clear = async () => {
    const sql = postgres(databaseUrl, { max: 1, onnotice: () => undefined });
    try {
      await sql`
        truncate message_flag_forwards, message_flags, message_keeps, messages,
          conversation_participants, conversations
      `;
    } finally {
      await sql.end();
    }
  };

  // The test database starts with no messages, so load the demo ones here and
  // clear them again for the tests that follow.
  test.beforeAll(async () => {
    await clear();
    execFileSync(process.execPath, ["scripts/seed-demo-messages.mjs"], { env: process.env, stdio: "pipe" });
    // Running it twice must not duplicate anything.
    execFileSync(process.execPath, ["scripts/seed-demo-messages.mjs"], { env: process.env, stdio: "pipe" });
  });
  test.afterAll(clear);

  test("every demo inbox has messages, with rooms and flagged examples", async ({ browser }) => {
    for (const account of [avery, noah, accounts.studentSofia, accounts.studentMaya, elena, sam, accounts.superUser]) {
      // Maya's and Jordan's sign-ins are changed by other tests; skip sign-in problems for them only.
      if (account === accounts.studentMaya) continue;

      const { context, page } = await signedIn(browser, account);
      const inbox = (await (await page.request.get("/api/messages?view=mine")).json()) as {
        conversations: Array<{ messages: unknown[]; title: string }>;
      };
      expect(inbox.conversations.length, account.email).toBeGreaterThan(0);
      expect(inbox.conversations.every((item) => item.messages.length > 0), account.email).toBe(true);
      await context.close();
    }

    const student = await signedIn(browser, avery);
    await student.page.getByRole("tab", { name: /Inbox/ }).click();
    await expect(student.page.getByRole("button", { name: /Elena Rivera/ })).toBeVisible();
    await expect(student.page.getByRole("button", { name: /Noah Kim/ })).toBeVisible();
    await student.page.getByRole("tab", { name: /Discussion/ }).click();
    await expect(student.page.getByRole("button", { name: /Week 3: Stocks or bonds\?/ })).toBeVisible();
    await student.context.close();

    // The teacher sees both demo flags; the admin sees the forwarded one.
    const teacher = await signedIn(browser, elena);
    const flags = teacher.page.getByTestId("flagged-messages");
    await expect(flags).toContainText("555-201-0142");
    await expect(flags).toContainText("Possible phone number");
    await expect(flags).toContainText("You should just quit the class.");
    await teacher.context.close();

    const admin = await signedIn(browser, sam);
    const forwarded = (await (await admin.page.request.get("/api/messages/flags")).json()) as {
      flags: Array<{ body: string; forwards: unknown[]; status: string }>;
    };
    expect(forwarded.flags).toHaveLength(1);
    expect(forwarded.flags[0]).toMatchObject({ status: "forwarded" });
    expect(forwarded.flags[0].body).toContain("quit the class");
    await admin.context.close();
  });
});

test("staff-only features stay hidden from students", async ({ browser }) => {
  // A real student: no teacher or admin controls on screen, and the server refuses them.
  const student = await signedIn(browser, avery);
  await student.page.getByRole("tab", { name: "Market" }).click();
  await expect(student.page.getByTestId("market-speed")).toBeVisible();
  await expect(student.page.getByRole("region", { name: "Teacher market controls" })).toHaveCount(0);
  await expect(student.page.getByRole("button", { name: "Market history" })).toHaveCount(0);
  await student.page.getByRole("tab", { name: /Inbox/ }).click();
  await expect(student.page.getByRole("button", { name: "New message" })).toBeVisible();
  await expect(student.page.getByRole("button", { name: "Student conversations" })).toHaveCount(0);
  await expect(student.page.getByTestId("flagged-messages")).toHaveCount(0);
  // The role menu offers a student nothing but Student.
  await student.page.getByRole("button", { name: /Assume role/ }).click();
  await expect(student.page.getByRole("menuitem", { name: /^Student/ })).toBeVisible();
  await expect(student.page.getByRole("menuitem", { name: /^(Teacher|Admin)/ })).toHaveCount(0);
  await student.page.keyboard.press("Escape");

  const staffOnly = [
    "/api/teacher/market",
    "/api/teacher/market/history?className=7th%20Grade%20Finance%20A&from=2026-11-13T00:00:00Z&to=2026-11-13T01:00:00Z",
    "/api/messages?view=oversight",
    "/api/messages/flags",
    "/api/admin/email-domains",
    "/api/admin/users",
    "/api/admin/class-market",
  ];

  for (const url of staffOnly) {
    const response = await student.page.request.get(url);
    expect([401, 403, 404, 405], `${url} -> ${response.status()}`).toContain(response.status());
  }

  for (const [url, data] of [
    ["/api/teacher/market", { action: "clock", className: "7th Grade Finance A", op: "pause" }],
    ["/api/messages/flags", { action: "resolve", flagId: "x" }],
    ["/api/admin/email-domains", { action: "add", domain: "evil.com" }],
    ["/api/admin/message-cleanup", {}],
    ["/api/alternate-contacts", { action: "add", email: "p@x.org", name: "P", studentEmail: avery.email }],
    ["/api/admin/view-as", { reason: "x", studentEmail: accounts.studentNoah.email }],
  ] as const) {
    const response = await student.page.request.post(url, { data });
    expect([401, 403], `${url} -> ${response.status()}`).toContain(response.status());
  }
  await student.context.close();

  // An admin viewing as a student gets the student's screen and limits too.
  const admin = await signedIn(browser, sam);
  const started = await admin.page.request.post("/api/admin/view-as", {
    data: { reason: "Checking what a student can see", studentEmail: avery.email },
  });
  expect(started.ok()).toBe(true);
  expect((await admin.page.request.get("/api/teacher/market")).status()).toBe(403);
  expect((await admin.page.request.get("/api/messages/flags")).status()).toBe(403);
  await admin.page.reload();
  await admin.page.getByRole("tab", { name: "Market" }).click();
  await expect(admin.page.getByTestId("market-speed")).toBeVisible();
  await expect(admin.page.getByRole("region", { name: "Teacher market controls" })).toHaveCount(0);
  await admin.page.request.delete("/api/admin/view-as");
  await admin.context.close();

  // "Assume role: Student" is different: you are still an admin, so the
  // controls show, labelled as staff-only.
  const superUser = await signedIn(browser, accounts.superUser);
  await assumeRole(superUser.page, "Student");
  await superUser.page.getByRole("tab", { name: "Market" }).click();
  await expect(superUser.page.getByTestId("staff-only-badge")).toHaveText("Teachers and admins only");
  await superUser.context.close();
});
