import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { eventDebriefs, gradeDebrief, releaseDebriefGrades } from "@/lib/server/debriefs";
import { portfolioErrorResponse } from "@/lib/server/portfolios";

// Debriefs for a life event (v0.2.18): teachers of the class (with teacher
// controls on) and admins review, grade and release.
export async function GET(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) return response;

  const eventId = new URL(request.url).searchParams.get("eventId");

  if (!eventId) return Response.json({ message: "Choose an event.", ok: false }, { status: 400 });

  try {
    return Response.json({ ok: true, ...(await eventDebriefs(user, eventId)) });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}

type Body = {
  action?: "grade" | "release" | "releaseAll";
  confirmEarly?: boolean;
  debriefId?: string;
  eventId?: string;
  feedback?: string;
  scores?: Record<string, number | string>;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) return response;

  const body = (await request.json().catch(() => ({}))) as Body;
  const bad = (message: string) => Response.json({ message, ok: false }, { status: 400 });

  try {
    if (body.action === "grade") {
      if (!body.debriefId) return bad("Choose a debrief.");

      const result = await gradeDebrief(user, {
        confirmEarly: body.confirmEarly === true,
        debriefId: body.debriefId,
        feedback: body.feedback,
        scores: body.scores,
      });

      await recordAuditEvent({
        action: result.changed ? "debrief.grade_changed" : "debrief.graded",
        actor: user.actingAdmin ?? user,
        context: { className: result.className, previousTotal: result.previousTotal, student: result.studentName, title: result.title, totalPoints: result.totalPoints },
        reason: result.changed ? "Debrief grade changed" : "Debrief graded",
        targetId: body.debriefId,
        targetType: "life_event_debrief",
      });

      return Response.json({ ok: true, ...result });
    }

    if (body.action === "release" || body.action === "releaseAll") {
      const result = await releaseDebriefGrades(user, {
        debriefId: body.action === "release" ? body.debriefId : null,
        eventId: body.eventId,
      });

      await recordAuditEvent({
        action: "debrief.grade_released",
        actor: user.actingAdmin ?? user,
        context: { className: result.className, released: result.released, title: result.title },
        reason: "Debrief grades released",
        targetId: body.debriefId ?? body.eventId ?? "",
        targetType: "life_event_debrief",
      });

      return Response.json({ ok: true, ...result });
    }

    return bad("Unknown debrief action.");
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}
