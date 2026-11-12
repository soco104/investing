import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { applyPortfolioCorrection, portfolioErrorResponse } from "@/lib/server/portfolios";

type PortfolioCorrectionRequest = {
  adjustmentCents: number;
  className?: string;
  reason: string;
  studentEmail: string;
};

// Adjusts a student's cash in their current class portfolio, with an audit
// reason. Recorded in the portfolio's activity, the corrections table (before
// and after), and the audit log.
export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "portfolioCorrections");

  if (response || !user) {
    return response;
  }

  const body = (await request.json().catch(() => ({}))) as PortfolioCorrectionRequest;

  if (!body.studentEmail?.trim() || !body.reason?.trim() || !Number.isFinite(body.adjustmentCents)) {
    return Response.json(
      { message: "Enter the student's email, an adjustment, and an audit reason.", ok: false },
      { status: 400 }
    );
  }

  try {
    const result = await applyPortfolioCorrection({
      actor: user,
      adjustmentCents: Math.round(body.adjustmentCents),
      className: body.className?.trim() || undefined,
      reason: body.reason,
      studentEmail: body.studentEmail,
    });
    const audit = await recordAuditEvent({
      action: "portfolio.corrected",
      actor: user,
      context: {
        adjustmentCents: Math.round(body.adjustmentCents),
        afterCashCents: result.afterCents,
        beforeCashCents: result.beforeCents,
        studentEmail: body.studentEmail.trim().toLowerCase(),
      },
      reason: body.reason,
      targetId: result.portfolioId,
      targetType: "portfolio",
    });

    return Response.json({ audit, ok: true, persisted: true, ...result }, { status: 201 });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}
