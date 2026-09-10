import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission, type PermissionKey } from "@/lib/server/auth";
import { updatePermission } from "@/lib/server/repository";

type PermissionRequest = {
  enabled: boolean;
  permission: PermissionKey;
  reason?: string;
  targetUserId: string;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as PermissionRequest;

  if (!body.targetUserId || !body.permission) {
    return Response.json(
      { message: "targetUserId and permission are required.", ok: false },
      { status: 400 }
    );
  }

  await updatePermission({
    actor: user,
    enabled: body.enabled,
    permission: body.permission,
    targetUserId: body.targetUserId,
  });

  const audit = await recordAuditEvent({
    action: "permission.changed",
    actor: user,
    context: { enabled: body.enabled, permission: body.permission },
    reason: body.reason,
    targetId: body.targetUserId,
    targetType: "user_permission",
  });

  return Response.json({ audit, ok: true, persisted: true }, { status: 201 });
}
