import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { createRetentionPlan, type RetentionRequest } from "@/lib/server/retention";
import { createRetentionRequest, defaultDistrictId } from "@/lib/server/repository";

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as Omit<
    RetentionRequest,
    "districtId" | "requestedByUserId"
  >;

  if (!body.targetId || !body.targetType || !body.type || !body.reason) {
    return Response.json(
      { message: "targetId, targetType, type, and reason are required.", ok: false },
      { status: 400 }
    );
  }

  const plan = createRetentionPlan({
    ...body,
    districtId: defaultDistrictId,
    requestedByUserId: user.id,
  });
  const audit = await recordAuditEvent({
    action:
      body.type === "delete"
        ? "retention.delete_requested"
        : "retention.export_requested",
    actor: user,
    context: { plan },
    reason: body.reason,
    targetId: body.targetId,
    targetType: body.targetType,
  });
  await createRetentionRequest({
    districtId: defaultDistrictId,
    reason: body.reason,
    requestedByUserId: user.id,
    targetId: body.targetId,
    targetType: body.targetType,
    type: body.type,
  });

  return Response.json({ audit, ok: true, plan }, { status: 202 });
}
