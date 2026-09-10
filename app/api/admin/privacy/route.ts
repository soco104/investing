import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { createPrivacyPosture } from "@/lib/server/repository";

type PrivacyPostureRequest = {
  posture: "standard" | "strict" | "state_specific";
  privacyContactEmail: string;
  reason?: string;
  stateCode?: string;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as PrivacyPostureRequest;

  if (!body.posture || !body.privacyContactEmail) {
    return Response.json(
      { message: "posture and privacyContactEmail are required.", ok: false },
      { status: 400 }
    );
  }

  await createPrivacyPosture({
    actor: user,
    posture: body.posture,
    privacyContactEmail: body.privacyContactEmail,
    stateCode: body.stateCode,
  });

  const audit = await recordAuditEvent({
    action: "privacy.updated",
    actor: user,
    context: {
      posture: body.posture,
      privacyContactEmail: body.privacyContactEmail,
      stateCode: body.stateCode,
    },
    reason: body.reason,
    targetId: "district-lincoln-usd",
    targetType: "privacy_posture",
  });

  return Response.json({ audit, ok: true, persisted: true });
}
