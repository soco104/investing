import { requirePermission } from "@/lib/server/auth";
import { listAdminState } from "@/lib/server/repository";

export async function GET(request: Request) {
  const { response } = await requirePermission(request, "adminPortal");

  if (response) {
    return response;
  }

  return Response.json({ ok: true, state: await listAdminState() });
}
