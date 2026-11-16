import { expect, test, type Browser, type Page } from "@playwright/test";
import postgres from "postgres";

import { accounts, signIn } from "./helpers";

// Life event debriefs (v0.2.18). Elena plays a card at Avery with "Require a
// debrief". Avery gets an Inbox message, writes her debrief on the Market
// page, and Elena grades and releases it.
const elena = accounts.teacher;
const avery = accounts.student;
const className = "7th Grade Finance A";

// Leave nothing behind for the tests that follow: undo every life event (so
// cash is back), and clear the debrief messages and debriefs.
test.afterAll(async ({ browser }) => {
  const teacher = await signedIn(browser, elena);
  const list = (await (await teacher.page.request.get("/api/teacher/life-events")).json()) as {
    events: Array<{ id: string; undoneAt: string | null }>;
  };

  for (const event of list.events.filter((item) => !item.undoneAt)) {
    await teacher.page.request.post("/api/teacher/life-events", { data: { action: "undo", eventId: event.id } });
  }

  await teacher.context.close();

  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });

  try {
    await sql`
      truncate message_flag_forwards, message_flags, message_keeps, messages,
        conversation_participants, conversations, life_event_debriefs, life_event_hits, life_events
    `;
  } finally {
    await sql.end();
  }
});

async function signedIn(browser: Browser, account: { email: string; password: string }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, account.email, account.password);
  return { context, page };
}

function isoDate(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function post(page: Page, url: string, data: Record<string, unknown>) {
  const response = await page.request.post(url, { data });
  return { body: (await response.json()) as Record<string, unknown>, status: response.status() };
}

test("event → Inbox message → student debrief → teacher grade → student sees the grade", async ({ browser }) => {
  const teacher = await signedIn(browser, elena);
  await teacher.page.getByRole("tab", { name: "Market" }).click();
  const panel = teacher.page.getByRole("region", { name: "Life events" });
  await panel.locator("#life-event-class").selectOption(className);
  await panel.locator("#life-event-card").selectOption("dental-bill");
  await panel.locator("#life-event-target").selectOption("student");
  await panel.locator("#life-event-student").selectOption(avery.email);
  await panel.getByRole("checkbox", { name: /Require a debrief report/ }).check();
  await panel.getByLabel("Due date").fill(isoDate(3));
  await panel.getByRole("button", { name: "Preview" }).click();
  await panel.getByRole("button", { name: "Play this card" }).click();
  await expect(panel.getByRole("status")).toContainText("Debrief messages sent to 1 student.");
  const debriefsButton = panel.getByRole("button", { name: "Debriefs (0 of 1)" });
  await expect(debriefsButton).toBeVisible();

  // Avery's Inbox has a message about what happened to her.
  const student = await signedIn(browser, avery);
  const inbox = (await (await student.page.request.get("/api/messages?view=mine")).json()) as {
    conversations: Array<{ messages: Array<{ body: string }>; title: string }>;
  };
  const fromElena = inbox.conversations.find((item) => item.title === "Elena Rivera");
  const message = fromElena?.messages.at(-1)?.body ?? "";
  expect(message).toContain("Life event: Dental bill.");
  expect(message).toContain("It cost you $100.00 (10% of your starting cash).");
  expect(message).toContain("Please write a short debrief on your Market page by");
  expect(message).toContain("1. What happened, and how much did it cost you?");

  // She writes it on her Market page.
  await student.page.getByRole("tab", { name: "Market" }).click();
  const form = student.page.getByTestId("student-debrief");
  await expect(form).toContainText("Debrief due");
  await form.getByLabel("Your debrief").fill("The dentist cost $100. I had enough cash. I will keep $150 aside for surprises.");
  await form.getByRole("button", { name: "Submit debrief" }).click();
  await expect(form.getByRole("status")).toContainText("Submitted!");

  // Elena grades it (before the due date, so she ticks the box) and releases it.
  await debriefsButton.click();
  await expect(panel.getByRole("button", { name: "Debriefs (1 of 1)" })).toBeVisible();
  const debriefs = panel.getByTestId("debriefs");
  await expect(debriefs).toContainText("1 of 1 submitted");
  await expect(debriefs.getByTestId("debrief-report")).toContainText("I will keep $150 aside");
  const grading = debriefs.getByRole("group", { name: "Debrief grade for Avery Johnson" });
  await grading.getByRole("button", { name: "Grade" }).click();
  await grading.getByLabel("Explains what happened and how it affected their money").fill("4");
  await grading.getByLabel("Uses evidence from their own portfolio").fill("2");
  await grading.getByLabel("Makes a realistic plan for the next surprise").fill("3");
  await grading.getByLabel("Feedback for Avery Johnson").fill("Good plan. Show how much cash you have left next time.");
  await expect(grading.getByRole("button", { name: "Save grade" })).toBeDisabled();
  await grading.getByRole("checkbox").check();
  await grading.getByRole("button", { name: "Save grade" }).click();
  await expect(grading.getByTestId("debrief-grade")).toContainText("9 of 10 points · draft");
  await expect(debriefs.getByTestId("debrief-summary")).toContainText("class average 90%");

  // A draft is hidden from the student.
  const studentView = async () => {
    const body = (await (await student.page.request.get("/api/portfolios")).json()) as {
      portfolios: Array<{ className: string; lifeEvents?: Array<{ debrief?: { grade: unknown } | null; title: string }> }>;
    };
    return body.portfolios.find((item) => item.className === className)?.lifeEvents?.find((item) => item.title === "Dental bill");
  };
  expect((await studentView())?.debrief?.grade).toBeNull();

  await debriefs.getByRole("button", { name: "Release all graded (1)" }).click();
  await expect(grading.getByTestId("debrief-grade")).toContainText("released");
  await student.page.reload();
  await student.page.getByRole("tab", { name: "Market" }).click();
  const report = student.page.getByTestId("student-debrief").getByTestId("grade-report");
  await expect(report).toContainText("9 of 10 points");
  await expect(report).toContainText("Uses evidence from their own portfolio");
  await expect(report).toContainText("Show how much cash you have left next time.");

  await teacher.context.close();
  await student.context.close();
});

test("debrief rules: no debrief unless asked, only your own, and staff only grade", async ({ browser }) => {
  const teacher = await signedIn(browser, elena);
  const plain = await post(teacher.page, "/api/teacher/life-events", {
    action: "play", choice: { cardId: "tax-refund" }, className, target: { studentEmail: avery.email, type: "student" },
  });
  expect(plain.status).toBe(201);
  expect(plain.body.debriefs).toBeNull();

  const withDebrief = await post(teacher.page, "/api/teacher/life-events", {
    action: "play", choice: { cardId: "work-bonus" }, className, debrief: { dueDate: "" }, target: { studentEmail: accounts.studentNoah.email, type: "student" },
  });
  expect(withDebrief.status).toBe(201);
  const eventId = String(withDebrief.body.eventId);
  const view = (await (await teacher.page.request.get(`/api/teacher/life-events/debriefs?eventId=${eventId}`)).json()) as {
    dueAt: string | null; students: Array<{ debriefId: string }>;
  };
  expect(view.dueAt).toBeNull();
  const debriefId = view.students[0].debriefId;

  // Avery can't write Noah's debrief, or grade anything.
  const student = await signedIn(browser, avery);
  expect((await post(student.page, "/api/life-events/debrief", { debriefId, report: "Not mine" })).status).toBe(404);
  expect((await post(student.page, "/api/teacher/life-events/debriefs", { action: "grade", debriefId, scores: { evidence: 3, impact: 4, plan: 3 } })).status).toBe(403);
  expect((await student.page.request.get(`/api/teacher/life-events/debriefs?eventId=${eventId}`)).status()).toBe(403);
  await student.context.close();

  // Bad scores are refused; with no due date there's no early-grading tick.
  expect((await post(teacher.page, "/api/teacher/life-events/debriefs", { action: "grade", debriefId, scores: { evidence: 9, impact: 4, plan: 3 } })).status).toBe(400);
  const graded = await post(teacher.page, "/api/teacher/life-events/debriefs", { action: "grade", debriefId, scores: { evidence: 0, impact: 0, plan: 0 } });
  expect(graded.status).toBe(200);

  // Undo removes debriefs nobody wrote yet.
  await post(teacher.page, "/api/teacher/life-events", { action: "undo", eventId });
  const after = (await (await teacher.page.request.get(`/api/teacher/life-events/debriefs?eventId=${eventId}`)).json()) as { students: unknown[] };
  expect(after.students).toHaveLength(0);
  await post(teacher.page, "/api/teacher/life-events", { action: "undo", eventId: plain.body.eventId });
  await teacher.context.close();
});
