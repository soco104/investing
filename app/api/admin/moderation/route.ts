import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { reviewModerationItem } from "@/lib/server/moderation";

type ModerationRequest = {
  action: "allow" | "block" | "escalate";
  messageId: string;
  note: string;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as ModerationRequest;

  if (!body.messageId || !body.action) {
    return Response.json(
      { message: "messageId and action are required.", ok: false },
      { status: 400 }
    );
  }

  const moderation = reviewModerationItem(body);
  const audit = await recordAuditEvent({
    action: "moderation.reviewed",
    actor: user,
    context: moderation,
    reason: body.note,
    targetId: body.messageId,
    targetType: "conversation_message",
  });

  return Response.json({ audit, moderation, ok: true });
}
