import { expect, test, type Browser, type Page } from "@playwright/test";

import { accounts, signIn } from "./helpers";

// Learning quests (v0.2.9). Elena (teacher) saves, copies and assigns quests;
// Avery (7th Grade Finance A) submits, edits until the due date, and comments.
// Tests run in order; each uses its own quest title.
const teacher = accounts.teacher;
const student = accounts.student;
const studentClass = "7th Grade Finance A";

function isoDate(daysFromToday: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function openQuestStudio(page: Page) {
  await signIn(page, teacher.email, teacher.password);
  await expect(page.getByRole("heading", { name: "Quest Studio" })).toBeVisible();
}

/** Creates and saves a new quest with the given title. */
async function createQuest(page: Page, title: string) {
  await page.getByRole("button", { name: "New quest" }).click();
  await page.locator("#quest-title").fill(title);
  await page.getByRole("button", { name: "Save quest" }).click();
  await expect(page.getByRole("status").filter({ hasText: `Saved "${title}".` })).toBeVisible();
}

async function assignToClass(page: Page, dueDate: string) {
  await page.getByRole("button", { name: "Assign", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("checkbox", { name: studentClass }).check();
  await dialog.getByLabel("Due date (optional)").fill(dueDate);
  await dialog.getByRole("button", { name: "Assign quest" }).click();
  await expect(dialog).toBeHidden();
}

/** Signs Avery in on a separate browser and opens one of her quests. */
async function openStudentQuest(browser: Browser, title: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, student.email, student.password);
  await page.getByRole("button", { name: new RegExp(title) }).click();
  const dialog = page.getByRole("dialog", { name: title });
  await expect(dialog).toBeVisible();
  return { context, dialog, page };
}

test.describe("Learning quests", () => {
  test("a saved quest is still there after a refresh", async ({ page }) => {
    const title = `Saved quest ${Date.now()}`;
    await openQuestStudio(page);
    await createQuest(page, title);

    await page.reload();
    await expect(page.getByRole("heading", { name: "Quest Studio" })).toBeVisible();
    await expect(page.getByRole("button", { name: new RegExp(title) })).toBeVisible();
  });

  test("See library opens the shared library; Copy adds a quest to your own", async ({ page }) => {
    await openQuestStudio(page);
    await page.getByRole("button", { name: "See library" }).click();

    const library = page.getByRole("region", { name: "Quest library" });
    await expect(library).toContainText("Open the Roth IRA lab");
    await library.getByRole("button", { name: "Copy Open the Roth IRA lab" }).click();
    await expect(page.getByRole("status")).toContainText(
      'Copied "Open the Roth IRA lab" into your quests.'
    );
    await expect(page.locator("#quest-title")).toHaveValue("Open the Roth IRA lab");

    await page.getByRole("button", { name: "Hide library" }).click();
    await expect(library).toBeHidden();
  });

  test("assign → student submits and edits → teacher sees it and comments → student sees the comment", async ({
    browser,
    page,
  }) => {
    const title = `Budget reflection ${Date.now()}`;
    await openQuestStudio(page);
    await createQuest(page, title);
    await assignToClass(page, isoDate(7));
    await expect(page.getByRole("status")).toContainText(`Assigned "${title}" to ${studentClass}`);

    // Avery submits, then edits before the due date.
    const avery = await openStudentQuest(browser, title);
    await avery.dialog.getByLabel("Your reflection").fill("I kept 20% in savings first.");
    await avery.dialog.getByRole("button", { name: "Submit" }).click();
    await expect(avery.dialog.getByRole("status")).toContainText("Submitted!");
    await avery.dialog.getByLabel("Your reflection").fill("I kept 25% in savings first.");
    await avery.dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(avery.dialog.getByRole("status")).toContainText("Your changes are saved.");

    // The teacher sees the edited submission and comments on it.
    await page.reload();
    await page.getByRole("button", { name: new RegExp(title) }).click();
    const submissions = page.getByRole("region", { name: "Submissions" });
    // Avery's class has three students since v0.2.14 (Noah and Sofia were added).
    await expect(submissions).toContainText("1 of 3 submitted");
    // v0.2.15: the status badge and an "Edited" badge are now separate.
    await expect(submissions).toContainText("Edited");
    await expect(submissions.getByTestId("grade-status").first()).toBeVisible();
    await expect(submissions).toContainText("I kept 25% in savings first.");
    await submissions.getByLabel("Add a comment").fill("Nice work. Why 25%?");
    await submissions.getByRole("button", { name: "Post comment" }).click();
    await expect(submissions).toContainText("Nice work. Why 25%?");

    // Avery sees the comment and replies.
    await avery.page.reload();
    await avery.page.getByRole("button", { name: new RegExp(title) }).click();
    const again = avery.page.getByRole("dialog", { name: title });
    const comments = again.getByRole("region", { name: "Comments" });
    await expect(comments).toContainText("Nice work. Why 25%?");
    await comments.getByLabel("Add a comment").fill("It covers one month of bills.");
    await comments.getByRole("button", { name: "Post comment" }).click();
    await expect(comments).toContainText("It covers one month of bills.");
    await avery.context.close();
  });

  test("after the due date the submission is locked, but comments still work", async ({
    browser,
    page,
  }) => {
    const title = `Due soon ${Date.now()}`;
    await openQuestStudio(page);
    await createQuest(page, title);
    await assignToClass(page, isoDate(3));

    const avery = await openStudentQuest(browser, title);
    await avery.dialog.getByLabel("Your reflection").fill("First answer.");
    await avery.dialog.getByRole("button", { name: "Submit" }).click();
    await expect(avery.dialog.getByRole("status")).toContainText("Submitted!");

    // The teacher moves the due date into the past.
    await assignToClass(page, isoDate(-1));

    // The server refuses edits after the due date.
    const assignment = (
      (await (await avery.page.request.get("/api/quests/student")).json()) as {
        quests: Array<{ assignmentId: string; title: string }>;
      }
    ).quests.find((quest) => quest.title === title);
    const refused = await avery.page.request.post("/api/quests/student", {
      data: { assignmentId: assignment?.assignmentId, reflection: "Too late edit." },
    });
    expect(refused.status()).toBe(409);

    await avery.page.reload();
    await avery.page.getByRole("button", { name: new RegExp(title) }).click();
    const locked = avery.page.getByRole("dialog", { name: title });
    await expect(locked.getByText("The due date has passed, so this submission is locked.")).toBeVisible();
    await expect(locked.getByLabel("Your reflection")).toHaveValue("First answer.");
    await expect(locked.getByLabel("Your reflection")).toHaveAttribute("readonly", "");
    await expect(locked.getByRole("button", { name: "Save changes" })).toHaveCount(0);

    const comments = locked.getByRole("region", { name: "Comments" });
    await comments.getByLabel("Add a comment").fill("Can I still explain my answer?");
    await comments.getByRole("button", { name: "Post comment" }).click();
    await expect(comments).toContainText("Can I still explain my answer?");
    await avery.context.close();
  });

  test("import saves quests; export downloads your saved quests", async ({ page }) => {
    const title = `Imported quest ${Date.now()}`;
    await openQuestStudio(page);

    const box = page.getByPlaceholder("Paste exported learning quest JSON");
    await box.fill(
      JSON.stringify([{ criteria: [{ label: "Explains the choice", points: 10, visibleToStudents: true }], title }])
    );
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(page.getByText("1 learning quest imported, saved to your quests, and audited.")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("button", { name: new RegExp(title) })).toBeVisible();

    await page.getByRole("button", { name: "Export", exact: true }).click();
    await expect(page.getByText(/saved quests? exported as JSON and audited/)).toBeVisible();
    await expect(box).toHaveValue(new RegExp(title));

    // Bad JSON is rejected without saving anything.
    await box.fill(JSON.stringify({ title: "" }));
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(page.getByText("Import failed: Quest 1: Give the quest a title.")).toBeVisible();
  });

  test("students can't submit to another class's quest or use teacher quest APIs", async ({
    browser,
    page,
  }) => {
    // The teacher assigns a quest to 7th Grade Finance B (not Avery's class).
    const context = await browser.newContext();
    const teacherPage = await context.newPage();
    await signIn(teacherPage, teacher.email, teacher.password);
    const saved = await teacherPage.request.post("/api/quests", {
      data: { action: "save", quest: { title: `Class B only ${Date.now()}` } },
    });
    const { id: questId } = (await saved.json()) as { id: string };
    await teacherPage.request.post("/api/quests", {
      data: { action: "assign", classNames: ["7th Grade Finance B"], questId },
    });
    const submissions = (await (
      await teacherPage.request.get(`/api/quests/submissions?questId=${questId}`)
    ).json()) as { classes: Array<{ className: string }> };
    expect(submissions.classes.map((c) => c.className)).toEqual(["7th Grade Finance B"]);
    await context.close();

    await signIn(page, student.email, student.password);
    expect((await page.request.get("/api/quests")).status()).toBe(403);
    const mine = (await (await page.request.get("/api/quests/student")).json()) as {
      quests: Array<{ questId: string }>;
    };
    expect(mine.quests.some((quest) => quest.questId === questId)).toBe(false);
    const response = await page.request.post("/api/quests/student", {
      data: { assignmentId: "quest-assignment-not-mine", reflection: "Hi" },
    });
    expect(response.status()).toBe(404);
  });
});
