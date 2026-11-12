import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { createPrivacyPosture } from "@/lib/server/repository";

import { isValidEmailAddress } from "@/lib/server/email";

// Must match the options on the Admin portal's Privacy posture page.
const privacyPostureValues = [
  "standard",
  "state-restricted",
  "district-custom",
] as const;

type PrivacyPostureRequest = {
  posture: (typeof privacyPostureValues)[number];
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
  const privacyContactEmail = body.privacyContactEmail?.trim() ?? "";

  if (!privacyPostureValues.includes(body.posture)) {
    return Response.json(
      { message: "Choose a privacy posture.", ok: false },
      { status: 400 }
    );
  }

  if (!isValidEmailAddress(privacyContactEmail)) {
    return Response.json(
      { message: "Enter a valid privacy contact email.", ok: false },
      { status: 400 }
    );
  }

  const audit = await recordAuditEvent({
    action: "privacy.updated",
    actor: user,
    context: {
      posture: body.posture,
      privacyContactEmail,
      stateCode: body.stateCode,
    },
    reason: body.reason,
    targetId: "district-lincoln-usd",
    targetType: "privacy_posture",
  });
  await createPrivacyPosture({
    actor: user,
    posture: body.posture,
    privacyContactEmail,
    stateCode: body.stateCode,
  });

  return Response.json({ audit, ok: true, persisted: true });
}
