import { areDemoLoginsEnabled } from "@/lib/server/auth";

// Read at request time (not build time) so the live site can turn demo
// logins on or off with the DEMO_LOGINS env var, without rebuilding.
export async function GET() {
  return Response.json({ enabled: areDemoLoginsEnabled() });
}
