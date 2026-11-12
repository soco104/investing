import { validateAllocationTargets } from "@/lib/portfolio-rules";
import { recordAuditEvent } from "@/lib/server/audit";
import { userFromRequest } from "@/lib/server/auth";
import { portfolioErrorResponse, saveAllocationTargets } from "@/lib/server/portfolios";

export async function POST(request: Request) {
  const user = await userFromRequest(request);

  if (!user) {
    return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    portfolioId?: string;
    targets?: unknown;
  };
  const targets = validateAllocationTargets(body.targets);

  if (!body.portfolioId || !targets) {
    return Response.json(
      { message: "Each allocation target must be a whole number from 0 to 100.", ok: false },
      { status: 400 }
    );
  }

  try {
    const portfolio = await saveAllocationTargets(user, body.portfolioId, targets);

    if (user.actingAdmin) {
      await recordAuditEvent({
        action: "view_as.action",
        actor: user.actingAdmin,
        context: { action: "allocation.saved", studentEmail: user.email, targets },
        reason: "Action while viewing as student",
        targetId: body.portfolioId,
        targetType: "portfolio",
      });
    }

    return Response.json({ ok: true, portfolio });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}
