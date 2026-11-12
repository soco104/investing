import { recordAuditEvent } from "@/lib/server/audit";
import { userFromRequest } from "@/lib/server/auth";
import { executeTrade, portfolioErrorResponse } from "@/lib/server/portfolios";

type TradeRequest = {
  portfolioId?: string;
  shares?: number;
  side?: "buy" | "sell";
  ticker?: string;
};

// Buy or sell at the class's current simulated price. All checks (cash,
// shares owned, whole vs fractional shares, read-only years) are on the server.
export async function POST(request: Request) {
  const user = await userFromRequest(request);

  if (!user) {
    return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as TradeRequest;

  if (!body.portfolioId || !body.ticker || !body.side) {
    return Response.json(
      { message: "portfolioId, ticker, side, and shares are required.", ok: false },
      { status: 400 }
    );
  }

  try {
    const portfolio = await executeTrade(user, {
      portfolioId: body.portfolioId,
      shares: Number(body.shares),
      side: body.side,
      ticker: body.ticker,
    });

    if (user.actingAdmin) {
      await recordAuditEvent({
        action: "view_as.action",
        actor: user.actingAdmin,
        context: {
          action: `trade.${body.side}`,
          shares: Number(body.shares),
          studentEmail: user.email,
          ticker: body.ticker,
        },
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
