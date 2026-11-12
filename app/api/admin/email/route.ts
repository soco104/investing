import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import {
  getEmailStatus,
  isValidEmailAddress,
  sendEmail,
  testEmail,
} from "@/lib/server/email";
import { listEmailDeliveries } from "@/lib/server/repository";

// Email setup status and recent deliveries, for the Admin portal.
export async function GET(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  return Response.json({
    deliveries: await listEmailDeliveries(25),
    ok: true,
    status: getEmailStatus(),
  });
}

// Send a test email.
export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json().catch(() => ({}))) as { to?: string };
  const to = body.to?.trim().toLowerCase() ?? "";

  if (!isValidEmailAddress(to)) {
    return Response.json(
      { message: "Enter a valid email address.", ok: false },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    ...testEmail(`${user.firstName} ${user.lastName}`.trim() || user.email),
    kind: "test",
    requestedByUserId: user.id,
    to,
  });

  await recordAuditEvent({
    action: "email.test_sent",
    actor: user,
    context: { delivery: result.status, to },
    reason: "Admin email test",
    targetId: to,
    targetType: "email",
  });

  return Response.json({
    delivery: result.status,
    deliveryError: result.error,
    ok: true,
  });
}
