import { requirePermission } from "@/lib/server/auth";
import { getClassMarketHistory } from "@/lib/server/market-history";
import { portfolioErrorResponse } from "@/lib/server/portfolios";

// GET /api/teacher/market/history?className=...&from=ISO&to=ISO&ticker=SPY
// Market rewind: a class's prices over a timeframe, with what happened in it.
// View-only; teachers see their own classes, admins any class.
export async function GET(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) return response;

  const params = new URL(request.url).searchParams;

  try {
    const history = await getClassMarketHistory(user, {
      className: params.get("className") ?? "",
      fromMs: Date.parse(params.get("from") ?? ""),
      ticker: params.get("ticker"),
      toMs: Date.parse(params.get("to") ?? ""),
    });

    return Response.json({ ok: true, ...history });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}
