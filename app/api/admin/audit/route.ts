import { listAuditEvents } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";

export async function GET(request: Request) {
  const { response } = await requirePermission(request, "adminPortal");

  if (response) {
    return response;
  }

  return Response.json({ events: listAuditEvents(), ok: true });
}
