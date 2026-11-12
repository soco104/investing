import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { escapeHtml, sendEmail } from "@/lib/server/email";
import {
  decideResetRequest,
  listResetRequests,
  portfolioErrorResponse,
} from "@/lib/server/portfolios";

// Admins: the reset request queue (pending first).
export async function GET(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) return response;

  try {
    return Response.json({ ok: true, requests: await listResetRequests() });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}

// Admins: approve (reset to starting cash) or deny a request. The teacher who
// asked is emailed the outcome.
export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) return response;

  const body = (await request.json().catch(() => ({}))) as {
    decision?: "approve" | "deny";
    note?: string;
    requestId?: string;
  };

  if (!body.requestId || (body.decision !== "approve" && body.decision !== "deny")) {
    return Response.json(
      { message: "Choose a request and approve or deny it.", ok: false },
      { status: 400 }
    );
  }

  const approve = body.decision === "approve";
  const note = body.note?.trim() ?? "";

  try {
    const outcome = await decideResetRequest({
      actor: user,
      approve,
      note,
      requestId: body.requestId,
    });
    const audit = await recordAuditEvent({
      action: approve ? "portfolio_reset.approved" : "portfolio_reset.denied",
      actor: user,
      context: { className: outcome.className, studentEmail: outcome.studentEmail },
      reason: note || (approve ? "Reset approved" : "Reset denied"),
      targetId: body.requestId,
      targetType: "portfolio_reset_request",
    });
    const verdict = approve ? "approved" : "denied";
    const lines = [
      `Your request to reset ${outcome.studentEmail}'s portfolio in ${outcome.className} was ${verdict}.`,
      approve
        ? "The portfolio has been reset to the class's starting cash. Its earlier activity is kept in the portfolio history."
        : "The portfolio was not changed.",
      note ? `Note from the admin: ${note}` : "",
    ].filter(Boolean);
    const delivery = await sendEmail({
      html: lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("\n"),
      kind: "portfolio_reset_decision",
      requestedByUserId: user.id,
      subject: `Portfolio reset ${verdict}: ${outcome.studentEmail}`,
      text: lines.join("\n\n"),
      to: outcome.requesterEmail,
    });

    return Response.json({ audit, delivery: delivery.status, ok: true });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}
