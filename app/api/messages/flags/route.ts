import { recordAuditEvent } from "@/lib/server/audit";
import { userFromRequest } from "@/lib/server/auth";
import { forwardFlag, listFlags, messageErrorResponse, resolveFlag, type ForwardTarget } from "@/lib/server/messages";

// Flagged messages: teachers see flags in their students' conversations;
// admins see the ones teachers forwarded to them.
export async function GET(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });

  try {
    return Response.json({ flags: await listFlags(user), ok: true });
  } catch (error) {
    return messageErrorResponse(error);
  }
}

type Body = {
  action?: "resolve" | "forward";
  contactId?: string;
  email?: string;
  flagId?: string;
  note?: string;
  to?: "admins" | "email" | "alternate_contact";
};

export async function POST(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });

  const input = (await request.json().catch(() => ({}))) as Body;
  const bad = (message: string) => Response.json({ message, ok: false }, { status: 400 });

  if (!input.flagId) return bad("Choose a flag.");

  try {
    if (input.action === "resolve") {
      await resolveFlag(user, input.flagId, input.note ?? "");
      await recordAuditEvent({
        action: "message.flag_resolved",
        actor: user.actingAdmin ?? user,
        context: { note: input.note ?? "" },
        reason: "Flag resolved",
        targetId: input.flagId,
        targetType: "message_flag",
      });
      return Response.json({ ok: true });
    }

    if (input.action === "forward") {
      let target: ForwardTarget;

      if (input.to === "admins") target = { to: "admins" };
      else if (input.to === "email" && input.email) target = { email: input.email, to: "email" };
      else if (input.to === "alternate_contact" && input.contactId) target = { contactId: input.contactId, to: "alternate_contact" };
      else return bad("Choose who to forward this to.");

      const result = await forwardFlag(user, input.flagId, target, input.note ?? "");
      await recordAuditEvent({
        action: "message.flag_forwarded",
        actor: user.actingAdmin ?? user,
        context: { to: result.recipientLabel },
        reason: "Flag forwarded",
        targetId: input.flagId,
        targetType: "message_flag",
      });
      return Response.json({ ok: true, ...result });
    }

    return bad("Unknown flag action.");
  } catch (error) {
    return messageErrorResponse(error);
  }
}
