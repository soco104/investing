import { userFromRequest } from "@/lib/server/auth";

export async function GET(request: Request) {
  const user = await userFromRequest(request);

  return Response.json({ authenticated: Boolean(user), user });
}
