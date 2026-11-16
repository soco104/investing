import { recordAuditEvent } from "@/lib/server/audit";
import { userFromRequest } from "@/lib/server/auth";
import { submitDebrief } from "@/lib/server/debriefs";
import { portfolioErrorResponse } from "@/lib/server/portfolios";

// A student writes or edits their life event debrief (v0.2.18), until the
// due date. Only their own.
export async function POST(request: Request) {
  const user = await userFromRequest(request);

  if (!user) return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { debriefId?: string; report?: string };

  if (!body.debriefId) return Response.json({ message: "Choose a debrief.", ok: false }, { status: 400 });

  try {
    const result = await submitDebrief(user, body.debriefId, body.report);

    if (result.firstTime || user.actingAdmin) {
      await recordAuditEvent({
        action: user.actingAdmin ? "view_as.action" : "debrief.submitted",
        actor: user.actingAdmin ?? user,
        context: { studentEmail: user.email, title: result.title },
        reason: user.actingAdmin ? "Action while viewing as student" : "Debrief submitted",
        targetId: body.debriefId,
        targetType: "life_event_debrief",
      });
    }

    return Response.json({ ok: true, ...result });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}
