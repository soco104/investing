import { recordAuditEvent } from "@/lib/server/audit";
import { userFromRequest } from "@/lib/server/auth";
import { messageErrorResponse, runMessageCleanup } from "@/lib/server/messages";

// Deletes messages older than 90 days that nobody kept. Also runs by itself
// once a day; this endpoint lets an admin (or a scheduled job with the cron
// secret) run it on demand.
export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  const viaCron = Boolean(secret) && request.headers.get("x-futurefund-cron") === secret;
  const user = viaCron ? null : await userFromRequest(request);

  if (!viaCron && (!user || user.role !== "Admin")) {
    return Response.json({ message: "Only admins can run the message cleanup.", ok: false }, { status: 403 });
  }

  try {
    const result = await runMessageCleanup();

    if (user) {
      await recordAuditEvent({
        action: "message.cleanup",
        actor: user.actingAdmin ?? user,
        context: result,
        reason: "Message cleanup run by an admin",
        targetId: "messages",
        targetType: "message",
      });
    }

    return Response.json({ ok: true, ...result });
  } catch (error) {
    return messageErrorResponse(error);
  }
}
