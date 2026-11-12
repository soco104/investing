import { userFromRequest } from "@/lib/server/auth";
import { getProfilePortfolios, portfolioErrorResponse } from "@/lib/server/portfolios";

// The signed-in user's profile: every portfolio (all classes, all school
// years), creating this school year's portfolios on first visit.
export async function GET(request: Request) {
  const user = await userFromRequest(request);

  if (!user) {
    return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });
  }

  try {
    return Response.json({ ok: true, portfolios: await getProfilePortfolios(user) });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}
