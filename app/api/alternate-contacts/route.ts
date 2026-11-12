import { recordAuditEvent } from "@/lib/server/audit";
import { userFromRequest } from "@/lib/server/auth";
import {
  addAlternateContact,
  decideContactRequest,
  listAlternateContacts,
  listContactRequests,
  messageErrorResponse,
  removeAlternateContact,
  requestAlternateContact,
} from "@/lib/server/messages";

// Alternate contacts (a parent or guardian on a student's profile). Teachers
// send a request; an admin approves it, denies it, or adds a contact directly.
export async function GET(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });

  try {
    const requests = user.role === "Student" ? [] : await listContactRequests(user);
    return Response.json({ contacts: await listAlternateContacts(user), ok: true, requests });
  } catch (error) {
    return messageErrorResponse(error);
  }
}

type Body = {
  action?: "request" | "approve" | "deny" | "add" | "remove";
  contactId?: string;
  email?: string;
  name?: string;
  note?: string;
  relationship?: string;
  requestId?: string;
  studentEmail?: string;
};

export async function POST(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });

  const input = (await request.json().catch(() => ({}))) as Body;
  const bad = (message: string) => Response.json({ message, ok: false }, { status: 400 });
  const audit = (action: "alternate_contact.requested" | "alternate_contact.approved" | "alternate_contact.denied" | "alternate_contact.added" | "alternate_contact.removed", targetId: string, context: Record<string, unknown>) =>
    recordAuditEvent({ action, actor: user.actingAdmin ?? user, context, reason: "Alternate contact", targetId, targetType: "alternate_contact" });

  try {
    const contact = { email: input.email ?? "", name: input.name ?? "", note: input.note, relationship: input.relationship, studentEmail: input.studentEmail ?? "" };

    switch (input.action) {
      case "request": {
        const result = await requestAlternateContact(user, contact);
        await audit("alternate_contact.requested", result.requestId, { student: result.studentName });
        return Response.json({ ok: true, ...result }, { status: 201 });
      }
      case "approve":
      case "deny": {
        if (!input.requestId) return bad("Choose a request.");
        const result = await decideContactRequest(user, input.requestId, input.action, input.note ?? "");
        await audit(input.action === "approve" ? "alternate_contact.approved" : "alternate_contact.denied", input.requestId, {});
        return Response.json({ ok: true, ...result });
      }
      case "add": {
        const result = await addAlternateContact(user, contact);
        await audit("alternate_contact.added", result.contactId, { student: result.studentName });
        return Response.json({ ok: true, ...result }, { status: 201 });
      }
      case "remove": {
        if (!input.contactId) return bad("Choose a contact.");
        await removeAlternateContact(user, input.contactId);
        await audit("alternate_contact.removed", input.contactId, {});
        return Response.json({ ok: true });
      }
      default:
        return bad("Unknown contact action.");
    }
  } catch (error) {
    return messageErrorResponse(error);
  }
}
