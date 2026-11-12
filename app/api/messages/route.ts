import { recordAuditEvent } from "@/lib/server/audit";
import { userFromRequest } from "@/lib/server/auth";
import {
  createRoom,
  flagMessage,
  listConversations,
  listContacts,
  markRead,
  messageErrorResponse,
  sendMessage,
  setKeep,
  startConversation,
} from "@/lib/server/messages";

const unauthorized = () => Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });

// GET /api/messages?view=mine|oversight|rooms|contacts
export async function GET(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return unauthorized();

  const view = new URL(request.url).searchParams.get("view") ?? "mine";

  try {
    if (view === "contacts") return Response.json({ contacts: await listContacts(user), ok: true });
    if (view === "rooms") return Response.json({ conversations: await listConversations(user, "room", "mine"), ok: true });

    return Response.json({
      conversations: await listConversations(user, "direct", view === "oversight" ? "oversight" : "mine"),
      ok: true,
    });
  } catch (error) {
    return messageErrorResponse(error);
  }
}

type Body = {
  action?: string;
  body?: string;
  className?: string;
  conversationId?: string;
  keep?: boolean;
  messageId?: string;
  reason?: string;
  recipientEmail?: string;
  title?: string;
};

export async function POST(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return unauthorized();

  const input = (await request.json().catch(() => ({}))) as Body;
  const bad = (message: string) => Response.json({ message, ok: false }, { status: 400 });

  try {
    let result: Record<string, unknown> = {};
    let viewAsAction = "";
    let targetId = input.conversationId ?? input.messageId ?? "";

    switch (input.action) {
      case "start":
        if (!input.recipientEmail) return bad("Choose someone to message.");
        result = await startConversation(user, input.recipientEmail);
        viewAsAction = "message.started";
        break;
      case "send":
        if (!input.conversationId || typeof input.body !== "string") return bad("Write a message first.");
        result = await sendMessage(user, input.conversationId, input.body);
        viewAsAction = "message.sent";
        targetId = String(result.messageId);
        break;
      case "keep":
        if (!input.messageId) return bad("Choose a message.");
        await setKeep(user, input.messageId, input.keep !== false);
        viewAsAction = "message.kept";
        if (input.keep !== false) {
          await recordAuditEvent({
            action: "message.kept",
            actor: user.actingAdmin ?? user,
            context: { studentEmail: user.actingAdmin ? user.email : undefined },
            reason: "Message marked Keep",
            targetId: input.messageId,
            targetType: "message",
          });
        }
        break;
      case "read":
        if (!input.conversationId) return bad("Choose a conversation.");
        await markRead(user, input.conversationId);
        return Response.json({ ok: true });
      case "flag": {
        if (!input.messageId) return bad("Choose a message.");
        const flag = await flagMessage(user, input.messageId, input.reason ?? "");
        result = flag;
        viewAsAction = "message.flagged";
        if (!flag.alreadyFlagged) {
          await recordAuditEvent({
            action: "message.flagged",
            actor: user.actingAdmin ?? user,
            context: { reason: input.reason ?? "" },
            reason: "Message flagged for review",
            targetId: input.messageId,
            targetType: "message",
          });
        }
        break;
      }
      case "createRoom":
        if (!input.className || !input.title) return bad("Choose a class and a title.");
        result = await createRoom(user, input.className, input.title);
        viewAsAction = "room.created";
        break;
      default:
        return bad("Unknown message action.");
    }

    if (user.actingAdmin) {
      await recordAuditEvent({
        action: "view_as.action",
        actor: user.actingAdmin,
        context: { action: viewAsAction, studentEmail: user.email },
        reason: "Action while viewing as student",
        targetId,
        targetType: "message",
      });
    }

    return Response.json({ ok: true, ...result }, { status: input.action === "send" || input.action === "start" ? 201 : 200 });
  } catch (error) {
    return messageErrorResponse(error);
  }
}
