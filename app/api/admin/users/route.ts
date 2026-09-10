import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { createOrUpdateUsers } from "@/lib/server/repository";

type UserMutationRequest = {
  action: "create" | "import" | "enable" | "disable";
  reason?: string;
  users?: unknown[];
  targetUserId?: string;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as UserMutationRequest;
  const count = body.action === "import" ? (body.users?.length ?? 0) : 1;
  const persistence = await createOrUpdateUsers({
    action: body.action,
    actor: user,
    reason: body.reason,
    targetUserId: body.targetUserId,
    users: body.users as Parameters<typeof createOrUpdateUsers>[0]["users"],
  });
  const audit = await recordAuditEvent({
    action:
      body.action === "import"
        ? "users.imported"
        : body.action === "create"
          ? "user.created"
          : "user.updated",
    actor: user,
    context: { action: body.action, count },
    reason: body.reason,
    targetId: body.targetUserId ?? `user-batch-${Date.now()}`,
    targetType: "user",
  });

  return Response.json({ audit, ok: true, persisted: true, persistence }, { status: 201 });
}
