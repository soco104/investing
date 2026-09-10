import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";

type PasswordResetRequest = {
  email: string;
  reason?: string;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as PasswordResetRequest;
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return Response.json(
      { message: "A user email is required.", ok: false },
      { status: 400 }
    );
  }

  const audit = await recordAuditEvent({
    action: "password_reset.requested",
    actor: user,
    context: { email, delivery: "pending_email_provider" },
    reason: body.reason,
    targetId: email,
    targetType: "password_reset",
  });

  return Response.json({ audit, ok: true, resetStatus: "pending_delivery" });
}
