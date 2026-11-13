import { userFromRequest } from "@/lib/server/auth";
import { getPortfolioLiveMarket, portfolioErrorResponse } from "@/lib/server/portfolios";

// GET /api/portfolios/live?portfolioId=...
// Current prices and the market clock for one of your portfolios. The Market
// screen calls this every few seconds while the market is running.
export async function GET(request: Request) {
  const user = await userFromRequest(request);

  if (!user) {
    return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });
  }

  const portfolioId = new URL(request.url).searchParams.get("portfolioId") ?? "";

  try {
    return Response.json({ market: await getPortfolioLiveMarket(user, portfolioId), ok: true });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}
