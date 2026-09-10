import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { hashToken } from "@/lib/server/crypto";
import { createPasswordReset } from "@/lib/server/repository";

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

  const resetToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
  const audit = await recordAuditEvent({
    action: "password_reset.requested",
    actor: user,
    context: {
      email,
      delivery: "pending_email_provider",
      expiresAt: expiresAt.toISOString(),
    },
    reason: body.reason,
    targetId: email,
    targetType: "password_reset",
  });
  await createPasswordReset({
    expiresAt,
    requestedByUserId: user.id,
    tokenHash: await hashToken(resetToken),
    userEmail: email,
  });

  return Response.json({
    audit,
    ok: true,
    resetStatus: "pending_delivery",
    resetUrl:
      process.env.NODE_ENV === "production"
        ? undefined
        : `/reset-password?token=${resetToken}`,
  });
}
