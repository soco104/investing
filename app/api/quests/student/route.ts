import { recordAuditEvent } from "@/lib/server/audit";
import { userFromRequest } from "@/lib/server/auth";
import { listStudentQuests, questErrorResponse, submitReflection } from "@/lib/server/quests";

function unauthorized() {
  return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });
}

// Students: the quests assigned to their classes, with their submissions.
export async function GET(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return unauthorized();

  try {
    return Response.json({ ok: true, quests: await listStudentQuests(user) });
  } catch (error) {
    return questErrorResponse(error);
  }
}

// Students: submit or edit a reflection (until the due date).
export async function POST(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as {
    assignmentId?: string;
    reflection?: string;
  };

  if (!body.assignmentId || typeof body.reflection !== "string") {
    return Response.json({ message: "Write a reflection first.", ok: false }, { status: 400 });
  }

  try {
    const result = await submitReflection(user, body.assignmentId, body.reflection);

    if (user.actingAdmin) {
      await recordAuditEvent({
        action: "view_as.action",
        actor: user.actingAdmin,
        context: { action: "quest.submitted", studentEmail: user.email },
        reason: "Action while viewing as student",
        targetId: result.submissionId,
        targetType: "quest_submission",
      });
    }

    return Response.json({ ok: true, ...result });
  } catch (error) {
    return questErrorResponse(error);
  }
}
