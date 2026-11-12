import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { hashToken } from "@/lib/server/crypto";
import {
  appBaseUrl,
  passwordResetEmail,
  sendEmail,
} from "@/lib/server/email";
import { createPasswordReset } from "@/lib/server/repository";

type PasswordResetRequest = {
  email: string;
  reason?: string;
};

const RESET_MINUTES_VALID = 30;

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
  const expiresAt = new Date(Date.now() + 1000 * 60 * RESET_MINUTES_VALID);

  try {
    await createPasswordReset({
      expiresAt,
      requestedByUserId: user.id,
      tokenHash: await hashToken(resetToken),
      userEmail: email,
    });
  } catch {
    return Response.json(
      { message: `No user was found with the email ${email}.`, ok: false },
      { status: 404 }
    );
  }

  const resetUrl = `${appBaseUrl(request)}/reset-password?token=${encodeURIComponent(
    resetToken
  )}`;
  const delivery = await sendEmail({
    ...passwordResetEmail(resetUrl, RESET_MINUTES_VALID),
    kind: "password_reset",
    requestedByUserId: user.id,
    to: email,
  });

  const audit = await recordAuditEvent({
    action: "password_reset.requested",
    actor: user,
    context: {
      delivery: delivery.status,
      email,
      expiresAt: expiresAt.toISOString(),
    },
    reason: body.reason,
    targetId: email,
    targetType: "password_reset",
  });

  return Response.json({
    audit,
    delivery: delivery.status,
    deliveryError: delivery.error,
    ok: true,
    resetStatus: delivery.status === "sent" ? "email_sent" : "pending_delivery",
    // Only outside production, to make local testing possible without email.
    resetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl,
  });
}
