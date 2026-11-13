import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { releaseGrades, saveGrade } from "@/lib/server/quest-grading";
import { questErrorResponse } from "@/lib/server/quests";

// Grade quest submissions (v0.2.15). Teachers of the class and admins only;
// students see their grade through /api/quests/student once it is released.
type Body = {
  action?: "save" | "release" | "releaseAll";
  assignmentId?: string;
  confirmEarly?: boolean;
  feedback?: string;
  scores?: Record<string, number | string>;
  studentEmail?: string;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) return response;

  const body = (await request.json().catch(() => ({}))) as Body;
  const bad = (message: string) => Response.json({ message, ok: false }, { status: 400 });

  if (!body.assignmentId) return bad("Choose an assignment.");

  try {
    if (body.action === "save") {
      if (!body.studentEmail) return bad("Choose a student.");

      const result = await saveGrade(user, {
        assignmentId: body.assignmentId,
        confirmEarly: body.confirmEarly === true,
        feedback: body.feedback,
        scores: body.scores,
        studentEmail: body.studentEmail,
      });

      await recordAuditEvent({
        action: result.changed ? "quest.grade_changed" : "quest.graded",
        actor: user.actingAdmin ?? user,
        context: {
          className: result.className,
          maxPoints: result.maxPoints,
          previousTotal: result.previousTotal,
          quest: result.questTitle,
          student: result.studentName,
          totalPoints: result.totalPoints,
        },
        reason: result.changed ? "Quest grade changed" : "Quest graded",
        targetId: body.assignmentId,
        targetType: "quest_assignment",
      });

      return Response.json({ ok: true, ...result });
    }

    if (body.action === "release" || body.action === "releaseAll") {
      if (body.action === "release" && !body.studentEmail) return bad("Choose a student.");

      const result = await releaseGrades(user, {
        assignmentId: body.assignmentId,
        studentEmail: body.action === "release" ? body.studentEmail : null,
      });

      await recordAuditEvent({
        action: "quest.grade_released",
        actor: user.actingAdmin ?? user,
        context: { className: result.className, quest: result.questTitle, released: result.released, student: body.studentEmail ?? "all graded" },
        reason: "Quest grades released",
        targetId: body.assignmentId,
        targetType: "quest_assignment",
      });

      return Response.json({ ok: true, ...result });
    }

    return bad("Unknown grading action.");
  } catch (error) {
    return questErrorResponse(error);
  }
}
