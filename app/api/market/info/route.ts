import { userFromRequest } from "@/lib/server/auth";
import { portfolioErrorResponse } from "@/lib/server/portfolios";
import { getStockInfo } from "@/lib/server/stock-info";

// GET /api/market/info?ticker=SPY&range=1M&className=...
// The stock info popup. The server picks the level (Basic or Full) from the
// student's class, so a Basic class can't ask for Full data.
export async function GET(request: Request) {
  const user = await userFromRequest(request);

  if (!user) {
    return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;

  try {
    const info = await getStockInfo(user, {
      className: params.get("className"),
      range: params.get("range"),
      ticker: params.get("ticker") ?? "",
    });

    return Response.json({ info, ok: true });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}
