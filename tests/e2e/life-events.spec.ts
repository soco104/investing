import { expect, test, type Browser, type Page } from "@playwright/test";

import { accounts, signIn } from "./helpers";

// Life event cards (v0.2.17). Elena plays cards at 7th Grade Finance A
// (grade 7, so cash stops at $0); Avery sees them on her Market page.
const elena = accounts.teacher;
const avery = accounts.student;
const className = "7th Grade Finance A";

type Hit = { amountCents: number; capped: boolean; cashAfterCents: number; email: string };
type Result = { card?: { title: string }; debtAllowed?: boolean; eventId?: string; hits?: Hit[]; message?: string };

async function signedIn(browser: Browser, account: { email: string; password: string }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, account.email, account.password);
  return { context, page };
}

async function post(page: Page, data: Record<string, unknown>) {
  const response = await page.request.post("/api/teacher/life-events", { data });
  return { body: (await response.json()) as Result, status: response.status() };
}

async function cashOf(page: Page) {
  const body = (await (await page.request.get("/api/portfolios")).json()) as {
    portfolios: Array<{ cashCents: number; className: string; kind: string; startingCashCents: number }>;
  };
  return body.portfolios.find((item) => item.className === className && item.kind === "class") as { cashCents: number; startingCashCents: number };
}

test("a teacher previews and plays a card at the class, the student sees it, and undo puts the cash back", async ({ browser }) => {
  const student = await signedIn(browser, avery);
  const before = await cashOf(student.page);

  const teacher = await signedIn(browser, elena);
  await teacher.page.getByRole("tab", { name: "Market" }).click();
  const panel = teacher.page.getByRole("region", { name: "Life events" });
  await panel.getByLabel("Class").selectOption(className);
  await panel.getByLabel("Card").selectOption("car-repair");
  await expect(panel.getByTestId("card-details")).toContainText("Car repair");
  await expect(panel.getByRole("button", { name: "Play this card" })).toBeDisabled();
  await panel.getByRole("button", { name: "Preview" }).click();
  const preview = panel.getByTestId("life-event-preview");
  await expect(preview).toContainText("Car repair");
  await expect(preview).toContainText("This class stops at $0.");
  await expect(preview).toContainText("Avery Johnson");
  // Classmates who never signed in get a portfolio opened for them, so the
  // whole class really means the whole class.
  await expect(preview).toContainText("Noah Kim");
  await expect(preview).toContainText("Sofia Garcia");

  // Nothing changed yet.
  expect((await cashOf(student.page)).cashCents).toBe(before.cashCents);

  await panel.getByRole("button", { name: "Play this card" }).click();
  await expect(panel.getByRole("status")).toContainText('Played "Car repair"');
  await expect(panel.getByTestId("played-events")).toContainText("Car repair");

  // 8% of starting cash is gone (Avery has at least that much).
  const expected = Math.round(before.startingCashCents * 0.08);
  const after = await cashOf(student.page);
  expect(before.cashCents - after.cashCents).toBe(expected);

  // The student sees the event (the Market page refreshes by itself).
  await student.page.getByRole("tab", { name: "Market" }).click();
  const seen = student.page.getByTestId("student-life-events");
  await expect(seen).toContainText("Car repair", { timeout: 15_000 });
  await expect(seen).toContainText("Think about:");

  // Undo: cash is back, and the event is marked.
  await panel.getByTestId("played-events").getByRole("button", { name: "Undo" }).first().click();
  await expect(panel.getByRole("status")).toContainText('Undid "Car repair"');
  await expect(panel.getByTestId("played-events")).toContainText("Undone");
  expect((await cashOf(student.page)).cashCents).toBe(before.cashCents);
  await expect(seen).toBeHidden({ timeout: 15_000 });
  await teacher.context.close();
  await student.context.close();
});

test("random handful, one student, own cards, the $0 floor, and who may play", async ({ browser }) => {
  const teacher = await signedIn(browser, elena);
  const play = (data: Record<string, unknown>) => post(teacher.page, { action: "play", className, ...data });

  // A random handful of 2 hits exactly 2 students, the same ones the preview showed.
  const seed = "test-seed";
  const previewed = await post(teacher.page, { action: "preview", choice: { cardId: "tax-refund" }, className, seed, target: { count: 2, type: "random" } });
  expect(previewed.status).toBe(200);
  expect(previewed.body.hits).toHaveLength(2);
  const played = await play({ choice: { cardId: "tax-refund" }, seed, target: { count: 2, type: "random" } });
  expect(played.status).toBe(201);
  expect(played.body.hits?.map((hit) => hit.email).sort()).toEqual(previewed.body.hits?.map((hit) => hit.email).sort());
  expect(played.body.hits?.every((hit) => hit.amountCents > 0)).toBe(true);

  // One student, with the teacher's own card.
  const own = await play({
    choice: { description: "Your bike was stolen.", kind: "expense", percentOfStartingCash: 100, title: "Stolen bike" },
    target: { studentEmail: accounts.studentNoah.email, type: "student" },
  });
  expect(own.status).toBe(201);
  expect(own.body.hits).toHaveLength(1);
  // Grade 7: it takes everything but never goes below $0...
  expect(own.body.hits?.[0].cashAfterCents).toBeGreaterThanOrEqual(0);
  // ...so a second 100% bill is capped at whatever is left (maybe nothing).
  const again = await play({ choice: { description: "Again.", kind: "expense", percentOfStartingCash: 100, title: "Second disaster" }, target: { studentEmail: accounts.studentNoah.email, type: "student" } });
  expect(again.body.hits?.[0]).toMatchObject({ capped: true, cashAfterCents: 0 });
  await post(teacher.page, { action: "undo", eventId: again.body.eventId });
  await post(teacher.page, { action: "undo", eventId: own.body.eventId });
  await post(teacher.page, { action: "undo", eventId: played.body.eventId });
  const twice = await post(teacher.page, { action: "undo", eventId: played.body.eventId });
  expect(twice.status).toBe(409);

  // Refused: bad cards and targets, other teachers' classes.
  expect((await play({ choice: { cardId: "nope" }, target: { type: "class" } })).status).toBe(404);
  expect((await play({ choice: { description: "x", kind: "expense", percentOfStartingCash: 150, title: "Too much" }, target: { type: "class" } })).status).toBe(400);
  expect((await play({ choice: { cardId: "car-repair" }, target: { count: 0, type: "random" } })).status).toBe(400);
  expect((await play({ choice: { cardId: "car-repair" }, target: { studentEmail: accounts.studentMaya.email, type: "student" } })).status).toBe(404);
  expect((await post(teacher.page, { action: "play", choice: { cardId: "car-repair" }, className: "Some Other Class", target: { type: "class" } })).status).toBe(403);
  await teacher.context.close();

  // Students can't play cards or see the teacher panel.
  const student = await signedIn(browser, avery);
  expect((await post(student.page, { action: "play", choice: { cardId: "tax-refund" }, className, target: { type: "class" } })).status).toBe(403);
  expect((await student.page.request.get("/api/teacher/life-events")).status()).toBe(403);
  await student.page.getByRole("tab", { name: "Market" }).click();
  await expect(student.page.getByRole("region", { name: "Life events" })).toHaveCount(0);
  await student.context.close();
});

test("grades 9-12 can go into debt", async ({ browser }) => {
  const sqlUrl = process.env.DATABASE_URL as string;
  const postgres = (await import("postgres")).default;
  const sql = postgres(sqlUrl, { max: 1, onnotice: () => undefined });
  const lab = "8th Grade Investing Lab";

  try {
    // Make the Lab a grade 10 class for this test (the admin API saves the
    // class's market settings if they don't exist yet).
    const admin = await signedIn(browser, accounts.admin);
    const saved = await admin.page.request.post("/api/admin/class-market", { data: { className: lab, gradeLevel: 10 } });
    expect(saved.ok(), await saved.text()).toBe(true);
    await admin.context.close();

    // Zoe needs a portfolio in the Lab: it's created when she signs in.
    const zoe = await signedIn(browser, { email: "zoe.brooks@example.edu", password: "student-demo" });
    await zoe.context.close();

    const teacher = await signedIn(browser, elena);
    const preview = await post(teacher.page, { action: "preview", choice: { cardId: "car-repair" }, className: lab, target: { type: "class" } });
    expect(preview.status).toBe(200);
    expect(preview.body.debtAllowed).toBe(true);
    const big = await post(teacher.page, {
      action: "play",
      choice: { description: "Everything at once.", kind: "expense", percentOfStartingCash: 100, title: "Disaster" },
      className: lab,
      target: { studentEmail: "zoe.brooks@example.edu", type: "student" },
    });
    expect(big.status).toBe(201);
    expect(big.body.hits?.[0].capped).toBe(false);
    // Zoe started with full cash, so a 100% hit lands at or below $0.
    expect(big.body.hits?.[0].cashAfterCents).toBeLessThanOrEqual(0);
    await post(teacher.page, { action: "undo", eventId: big.body.eventId });
    await teacher.context.close();
  } finally {
    await sql`update class_market_configs set grade_level = null where class_name = ${lab}`;
    await sql.end();
  }
});
