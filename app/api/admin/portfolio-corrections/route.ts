import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { createPortfolioCorrection } from "@/lib/server/repository";

type PortfolioCorrectionRequest = {
  adjustmentCents: number;
  afterSnapshot?: unknown;
  beforeSnapshot?: unknown;
  portfolioId: string;
  reason: string;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(
    request,
    "portfolioCorrections"
  );

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as PortfolioCorrectionRequest;

  if (!body.portfolioId || !body.reason || !Number.isFinite(body.adjustmentCents)) {
    return Response.json(
      {
        message: "portfolioId, adjustmentCents, and reason are required.",
        ok: false,
      },
      { status: 400 }
    );
  }

  const audit = await recordAuditEvent({
    action: "portfolio.corrected",
    actor: user,
    context: {
      adjustmentCents: body.adjustmentCents,
      afterSnapshot: body.afterSnapshot,
      beforeSnapshot: body.beforeSnapshot,
    },
    reason: body.reason,
    targetId: body.portfolioId,
    targetType: "portfolio",
  });
  await createPortfolioCorrection({
    adjustmentCents: body.adjustmentCents,
    afterSnapshot: body.afterSnapshot,
    beforeSnapshot: body.beforeSnapshot,
    correctedByUserId: user.id,
    portfolioId: body.portfolioId,
    reason: body.reason,
  });

  return Response.json({ audit, ok: true, persisted: true }, { status: 201 });
}
