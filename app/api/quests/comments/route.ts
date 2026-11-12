import { recordAuditEvent } from "@/lib/server/audit";
import { userFromRequest } from "@/lib/server/auth";
import { addComment, questErrorResponse } from "@/lib/server/quests";

// Add a comment to a quest submission: the student who wrote it, a teacher of
// the class, or an admin. Allowed before and after the due date.
export async function POST(request: Request) {
  const user = await userFromRequest(request);

  if (!user) {
    return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { body?: string; submissionId?: string };

  if (!body.submissionId || typeof body.body !== "string") {
    return Response.json({ message: "Write a comment first.", ok: false }, { status: 400 });
  }

  try {
    const result = await addComment(user, body.submissionId, body.body);

    if (user.actingAdmin) {
      await recordAuditEvent({
        action: "view_as.action",
        actor: user.actingAdmin,
        context: { action: "quest.commented", studentEmail: user.email },
        reason: "Action while viewing as student",
        targetId: body.submissionId,
        targetType: "quest_submission",
      });
    }

    return Response.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    return questErrorResponse(error);
  }
}
