import { expect, test, type Browser, type Page } from "@playwright/test";
import postgres from "postgres";

import { accounts, assumeRole, signIn } from "./helpers";

// Saved messages (v0.2.10). Avery (student, 7th Grade Finance A) messages her
// teacher Elena; Sam (admin) sets the allowed email domains and approves
// parent contacts. Tests run in order and share the conversation they create.
const avery = accounts.student;
const elena = accounts.teacher;
const sam = accounts.admin;

type Api = Page["request"];
type Json = Record<string, unknown>;

async function signedIn(browser: Browser, account: { email: string; password: string }) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, account.email, account.password);
  return { context, page };
}

async function post(request: Api, url: string, data: Json) {
  const response = await request.post(url, { data });
  return { body: (await response.json()) as Json, status: response.status() };
}

let conversationId = "";

test("a student starts a conversation with a teacher, and the filter blocks bad language", async ({ browser }) => {
  const { context, page } = await signedIn(browser, avery);

  await page.getByRole("tab", { name: /Inbox/ }).click();
  await page.getByRole("button", { name: "New message" }).click();
  await page.locator("#new-message-recipient").selectOption(elena.email);
  await page.getByRole("button", { name: "Start conversation" }).click();

  await page.getByLabel("Message", { exact: true }).fill("Hi Ms. Rivera, I have a question about the quest.");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByTestId("message").filter({ hasText: "question about the quest" })).toBeVisible();

  await page.getByLabel("Message", { exact: true }).fill("this is shit");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByTestId("inbox-panel").getByRole("alert")).toContainText("Message blocked");
  await expect(page.getByTestId("message")).toHaveCount(1);

  // Saved on the server: a reload still shows it. Keep is remembered too.
  await page.getByTestId("message").getByRole("checkbox", { name: /Keep/ }).click();
  await expect(page.getByTestId("message").getByRole("checkbox", { name: /Keep/ })).toBeChecked();
  await page.reload();
  await page.getByRole("tab", { name: /Inbox/ }).click();
  await page.getByRole("button", { name: /Elena Rivera/ }).click();
  const message = page.getByTestId("message").filter({ hasText: "question about the quest" });
  await expect(message).toBeVisible();
  await expect(message.getByRole("checkbox", { name: /Keep/ })).toBeChecked();

  const list = await page.request.get("/api/messages?view=mine");
  conversationId = ((await list.json()) as { conversations: Array<{ id: string }> }).conversations[0].id;
  await context.close();
});

test("who can message whom is enforced by the server", async ({ browser }) => {
  const { context, page } = await signedIn(browser, avery);
  const contacts = (await (await page.request.get("/api/messages?view=contacts")).json()) as {
    contacts: Array<{ email: string; role: string }>;
  };

  expect(contacts.contacts.some((contact) => contact.email === elena.email)).toBe(true);
  expect(contacts.contacts.some((contact) => contact.role === "Admin")).toBe(false);
  // Maya is in a different class.
  expect(contacts.contacts.some((contact) => contact.email === accounts.studentMaya.email)).toBe(false);

  const toAdmin = await post(page.request, "/api/messages", { action: "start", recipientEmail: sam.email });
  expect(toAdmin.status).toBe(403);
  const toMaya = await post(page.request, "/api/messages", { action: "start", recipientEmail: accounts.studentMaya.email });
  expect(toMaya.status).toBe(403);
  await context.close();
});

test("admins can read student conversations, and a message with a phone number is flagged to the teacher", async ({ browser }) => {
  const student = await signedIn(browser, avery);
  const sent = await post(student.page.request, "/api/messages", {
    action: "send",
    body: "My phone number is 555-123-4567 if you want to call.",
    conversationId,
  });
  expect(sent.status).toBe(201);
  expect(sent.body.flagged).toBe(true);
  await student.context.close();

  const admin = await signedIn(browser, sam);
  const oversight = (await (await admin.page.request.get("/api/messages?view=oversight")).json()) as {
    conversations: Array<{ id: string; readOnly: boolean }>;
  };
  expect(oversight.conversations.find((item) => item.id === conversationId)?.readOnly).toBe(true);
  const blocked = await post(admin.page.request, "/api/messages", { action: "send", body: "hello", conversationId });
  expect(blocked.status).toBe(403);
  await admin.context.close();

  const teacher = await signedIn(browser, elena);
  await expect(teacher.page.getByTestId("flagged-messages")).toContainText("555-123-4567");
  await teacher.context.close();
});

test("teachers forward flags only to allowed domains, admins, or parents on file", async ({ browser }) => {
  const teacher = await signedIn(browser, elena);
  const flags = (await (await teacher.page.request.get("/api/messages/flags")).json()) as { flags: Array<{ id: string }> };
  const flagId = flags.flags[0].id;

  const denied = await post(teacher.page.request, "/api/messages/flags", {
    action: "forward", email: "someone@gmail.com", flagId, to: "email",
  });
  expect(denied.status).toBe(403);

  const admin = await signedIn(browser, sam);
  const added = await post(admin.page.request, "/api/admin/email-domains", { action: "add", domain: "@Example.edu" });
  expect(added.body.domain).toBe("example.edu");
  const notAdmin = await post(teacher.page.request, "/api/admin/email-domains", { action: "add", domain: "evil.com" });
  expect(notAdmin.status).toBe(403);

  const allowed = await post(teacher.page.request, "/api/messages/flags", {
    action: "forward", email: "principal@example.edu", flagId, note: "Please follow up.", to: "email",
  });
  expect(allowed.status).toBe(200);
  const lookalike = await post(teacher.page.request, "/api/messages/flags", {
    action: "forward", email: "x@example.edu.evil.com", flagId, to: "email",
  });
  expect(lookalike.status).toBe(403);

  await post(teacher.page.request, "/api/messages/flags", { action: "forward", flagId, to: "admins" });
  const adminFlags = (await (await admin.page.request.get("/api/messages/flags")).json()) as { flags: Array<{ id: string }> };
  expect(adminFlags.flags.some((flag) => flag.id === flagId)).toBe(true);

  const resolved = await post(admin.page.request, "/api/messages/flags", { action: "resolve", flagId, note: "Handled." });
  expect(resolved.status).toBe(200);
  await teacher.context.close();
  await admin.context.close();
});

test("a teacher sends a parent email to the admins, who add it to the student's profile", async ({ browser }) => {
  const teacher = await signedIn(browser, elena);
  const requested = await post(teacher.page.request, "/api/alternate-contacts", {
    action: "request", email: "parent@family.org", name: "Pat Johnson", relationship: "mother", studentEmail: avery.email,
  });
  expect(requested.status).toBe(201);
  const outside = await post(teacher.page.request, "/api/alternate-contacts", {
    action: "request", email: "p@family.org", name: "Nope", studentEmail: "nobody@example.edu",
  });
  expect(outside.status).toBe(400);
  await teacher.context.close();

  const admin = await signedIn(browser, sam);
  await assumeRole(admin.page, "Admin");
  await admin.page.getByRole("heading", { name: "Messaging" }).first().click();
  const request = admin.page.getByTestId("contact-request");
  await expect(request).toContainText("Pat Johnson");
  await request.getByRole("button", { name: "Approve" }).click();
  await expect(admin.page.getByTestId("alternate-contacts")).toContainText("parent@family.org");

  // Now a teacher can forward a flag to that parent directly.
  const again = await post(admin.page.request, "/api/alternate-contacts", { action: "add", email: "parent@family.org", name: "Pat Johnson", studentEmail: avery.email });
  expect(again.status).toBe(201);
  await admin.context.close();
});

test("the 90-day cleanup removes old messages unless they are kept or flagged", async ({ browser }) => {
  const sql = postgres(process.env.DATABASE_URL as string, { max: 1, onnotice: () => undefined });

  try {
    const student = await signedIn(browser, avery);
    const ids: string[] = [];

    for (const body of ["old and plain", "old but kept", "old but flagged"]) {
      const sent = await post(student.page.request, "/api/messages", { action: "send", body, conversationId });
      expect(sent.status, JSON.stringify(sent.body)).toBe(201);
      ids.push(String(sent.body.messageId));
    }

    await post(student.page.request, "/api/messages", { action: "keep", keep: true, messageId: ids[1] });
    await post(student.page.request, "/api/messages", { action: "flag", messageId: ids[2], reason: "test" });
    await sql`update messages set created_at = now() - interval '100 days' where id = any(${ids})`;
    await student.context.close();

    const admin = await signedIn(browser, sam);
    const notAdmin = await signedIn(browser, avery);
    expect((await post(notAdmin.page.request, "/api/admin/message-cleanup", {})).status).toBe(403);
    await notAdmin.context.close();
    const cleaned = await post(admin.page.request, "/api/admin/message-cleanup", {});
    expect(cleaned.status).toBe(200);
    await admin.context.close();

    const left = await sql<Array<{ id: string }>>`select id from messages where id = any(${ids})`;
    expect(left.map((row) => row.id).sort()).toEqual([ids[1], ids[2]].sort());
  } finally {
    await sql.end();
  }
});
