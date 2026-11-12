import { recordAuditEvent } from "@/lib/server/audit";
import { userFromRequest } from "@/lib/server/auth";
import { addAllowedDomain, listAllowedDomains, messageErrorResponse, removeAllowedDomain } from "@/lib/server/messages";

// The domains teachers may forward flagged messages to (admin-managed).
export async function GET(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });
  if (user.role === "Student") return Response.json({ message: "Not authorized.", ok: false }, { status: 403 });

  try {
    return Response.json({ domains: await listAllowedDomains(), ok: true });
  } catch (error) {
    return messageErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const user = await userFromRequest(request);
  if (!user) return Response.json({ message: "Authentication is required.", ok: false }, { status: 401 });

  const input = (await request.json().catch(() => ({}))) as { action?: "add" | "remove"; domain?: string };

  if (typeof input.domain !== "string") return Response.json({ message: "Enter a domain like district.org.", ok: false }, { status: 400 });

  try {
    const add = input.action !== "remove";
    const result = add ? await addAllowedDomain(user, input.domain) : await removeAllowedDomain(user, input.domain);

    await recordAuditEvent({
      action: add ? "email_domain.added" : "email_domain.removed",
      actor: user.actingAdmin ?? user,
      context: { domain: result.domain },
      reason: add ? "Allowed email domain added" : "Allowed email domain removed",
      targetId: result.domain,
      targetType: "email_domain",
    });

    return Response.json({ ok: true, ...result });
  } catch (error) {
    return messageErrorResponse(error);
  }
}
