import { expect, test, type Page } from "@playwright/test";

import { accounts, signIn } from "./helpers";

// Quest grading (v0.2.15). Elena (teacher) grades Avery's submission with the
// quest's scoring rules. A grade is a draft until released; Avery then gets a
// read-only report. New quests have three rules worth 40, 30 and 30 points
// and show students the total only ("summary").
const teacher = accounts.teacher;
const student = accounts.student;
const studentClass = "7th Grade Finance A";

function isoDate(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

type SubmissionsView = {
  classes: Array<{
    assignmentId: string;
    averagePercent: number | null;
    draftCount: number;
    students: Array<{ email: string; grade: { answerChanged: boolean; status: string; totalPoints: number } | null; status: string }>;
  }>;
};
type StudentQuest = { assignmentId: string; grade: null | { feedback: string; maxPoints: number | null; rules: unknown[]; totalPoints: number | null }; title: string };

async function grade(page: Page, data: Record<string, unknown>) {
  const response = await page.request.post("/api/quests/grades", { data });
  return { body: (await response.json()) as Record<string, unknown>, status: response.status() };
}

const scores = (a: number, b: number, c: number) => ({ "decision-quality": a, reflection: c, "teacher-hidden-signal": b });

test("a teacher grades a submission, releases it, and the student gets a grade report", async ({ browser, page }) => {
  const title = `Graded quest ${Date.now()}`;

  // Teacher creates and assigns the quest (due in a week).
  await signIn(page, teacher.email, teacher.password);
  await expect(page.getByRole("heading", { name: "Quest Studio" })).toBeVisible();
  await page.getByRole("button", { name: "New quest" }).click();
  await page.locator("#quest-title").fill(title);
  await page.getByRole("button", { name: "Save quest" }).click();
  await expect(page.getByRole("status").filter({ hasText: `Saved "${title}".` })).toBeVisible();
  await page.getByRole("button", { name: "Assign", exact: true }).click();
  const assign = page.getByRole("dialog");
  await assign.getByRole("checkbox", { name: studentClass }).check();
  await assign.getByLabel("Due date (optional)").fill(isoDate(7));
  await assign.getByRole("button", { name: "Assign quest" }).click();
  await expect(assign).toBeHidden();

  // Avery submits.
  const averyContext = await browser.newContext();
  const avery = await averyContext.newPage();
  await signIn(avery, student.email, student.password);
  await avery.getByRole("button", { name: new RegExp(title) }).click();
  const quest = avery.getByRole("dialog", { name: title });
  await quest.getByLabel("Your reflection").fill("I would keep three months of bills in savings.");
  await quest.getByRole("button", { name: "Submit" }).click();
  await expect(quest.getByRole("status")).toContainText("Submitted!");
  await avery.keyboard.press("Escape");

  // The teacher grades it. Before the due date the form asks for a tick first.
  await page.reload();
  await page.getByRole("button", { name: new RegExp(title) }).click();
  const submissions = page.getByRole("region", { name: "Submissions" });
  const panel = submissions.getByRole("region", { name: "Grade for Avery Johnson" });
  await expect(panel).toContainText("Not graded yet");
  await panel.getByRole("button", { name: "Grade", exact: true }).click();
  await panel.getByLabel("Decision matches the learning objective").fill("35");
  await panel.getByLabel("Teacher-only misconception check").fill("20");
  await panel.getByLabel("Reflection uses portfolio evidence").fill("25");
  await expect(panel.getByTestId("grade-form-total")).toHaveText("Total: 80 of 100 points");
  await panel.getByLabel("Feedback for the student (optional)").fill("Clear reasoning. Add one number from your portfolio next time.");
  await expect(panel.getByRole("button", { name: "Save grade" })).toBeDisabled();
  await panel.getByRole("checkbox").check();
  await panel.getByRole("button", { name: "Save grade" }).click();
  await expect(panel.getByTestId("grade-total")).toContainText("80 of 100 points");
  await expect(panel.getByTestId("grade-total")).toContainText("draft, not visible to the student");
  await expect(submissions.getByTestId("class-grade-summary")).toContainText("Class average: 80%");

  // It's a draft: Avery sees no grade yet.
  const mine = async () => {
    const body = (await (await avery.request.get("/api/quests/student")).json()) as { quests: StudentQuest[] };
    return body.quests.find((item) => item.title === title) as StudentQuest;
  };
  const assigned = await mine();
  expect(assigned.grade).toBeNull();
  const assignmentId = assigned.assignmentId;

  // Avery edits her answer, so the grade is marked for the teacher.
  await avery.getByRole("button", { name: new RegExp(title) }).click();
  await quest.getByLabel("Your reflection").fill("I would keep three months of bills ($2,400) in savings.");
  await quest.getByRole("button", { name: "Save changes" }).click();
  await expect(quest.getByRole("status")).toContainText("Your changes are saved.");
  await avery.keyboard.press("Escape");
  await page.reload();
  await page.getByRole("button", { name: new RegExp(title) }).click();
  await expect(panel.getByTestId("answer-changed")).toBeVisible();

  // Release for the class; Avery now gets her report: the total and feedback,
  // but no rule breakdown (this quest shows students the total only).
  await submissions.getByRole("button", { name: "Release all graded (1)" }).click();
  await expect(panel.getByTestId("grade-total")).toContainText("released to the student");
  await avery.reload();
  await expect(avery.getByRole("button", { name: new RegExp(title) })).toContainText("Graded · 80 of 100");
  await avery.getByRole("button", { name: new RegExp(title) }).click();
  const report = avery.getByRole("dialog", { name: title }).getByTestId("grade-report");
  await expect(report).toContainText("80 of 100 points");
  await expect(report).toContainText("Add one number from your portfolio next time.");
  await expect(report).not.toContainText("Teacher-only misconception check");
  const released = await mine();
  expect(released.grade).toMatchObject({ maxPoints: 100, rules: [], totalPoints: 80 });
  // The student's report never includes the grading view's fields.
  expect(JSON.stringify(released.grade)).not.toContain("scores");
  expect(JSON.stringify(released.grade)).not.toContain("gradedBy");

  // The teacher changes the grade; the student sees the new one (still released).
  await panel.getByRole("button", { name: "Change grade" }).click();
  await panel.getByLabel("Reflection uses portfolio evidence").fill("30");
  await panel.getByRole("checkbox").check();
  await panel.getByRole("button", { name: "Save changes" }).click();
  await expect(panel.getByTestId("grade-total")).toContainText("85 of 100 points");
  expect((await mine()).grade?.totalPoints).toBe(85);

  // Rules the server enforces.
  const base = { action: "save", assignmentId, confirmEarly: true, studentEmail: student.email };
  expect((await grade(page, { ...base, confirmEarly: false, scores: scores(1, 1, 1) })).status).toBe(409); // before the due date
  expect((await grade(page, { ...base, scores: scores(41, 1, 1) })).status).toBe(400); // over a rule's maximum
  expect((await grade(page, { ...base, scores: { "decision-quality": 10 } })).status).toBe(400); // a rule left out
  expect((await grade(page, { ...base, scores: scores(1, 1, 1), studentEmail: accounts.studentMaya.email })).status).toBe(404); // not in the class
  // Students can't grade, even themselves.
  expect((await grade(avery, { ...base, scores: scores(40, 30, 30) })).status).toBe(403);
  expect((await mine()).grade?.totalPoints).toBe(85);

  // A student who didn't submit gets no grade unless the teacher enters one.
  const view = (await (await page.request.get(`/api/quests/submissions?questId=${encodeURIComponent(await questIdFor(page, title))}`)).json()) as SubmissionsView;
  const noah = view.classes[0].students.find((item) => item.email === accounts.studentNoah.email);
  expect(noah).toMatchObject({ grade: null, status: "not_submitted" });
  const zero = await grade(page, { ...base, scores: scores(0, 0, 0), studentEmail: accounts.studentNoah.email });
  expect(zero.status).toBe(200);
  expect(zero.body).toMatchObject({ status: "draft", totalPoints: 0 });

  // An admin can adjust a grade.
  const adminContext = await browser.newContext();
  const admin = await adminContext.newPage();
  await signIn(admin, accounts.admin.email, accounts.admin.password);
  const adjusted = await grade(admin, { ...base, feedback: "Adjusted by the office.", scores: scores(40, 30, 30) });
  expect(adjusted.status).toBe(200);
  expect(adjusted.body).toMatchObject({ changed: true, previousTotal: 85, status: "released", totalPoints: 100 });
  expect((await mine()).grade).toMatchObject({ feedback: "Adjusted by the office.", totalPoints: 100 });
  await adminContext.close();
  await averyContext.close();
});

async function questIdFor(page: Page, title: string) {
  const body = (await (await page.request.get("/api/quests")).json()) as { quests: Array<{ id: string; title: string }> };
  return body.quests.find((item) => item.title === title)?.id ?? "";
}
