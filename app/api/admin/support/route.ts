import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { createSupportTicket } from "@/lib/server/repository";

type SupportCaseRequest = {
  category: string;
  summary: string;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as SupportCaseRequest;

  if (!body.category || !body.summary) {
    return Response.json(
      { message: "category and summary are required.", ok: false },
      { status: 400 }
    );
  }

  const caseId = `SUP-${Date.now()}`;
  const audit = await recordAuditEvent({
    action: "support_case.created",
    actor: user,
    context: {
      category: body.category,
      status: "Pending support",
      summary: body.summary,
    },
    reason: body.summary,
    targetId: caseId,
    targetType: "support_ticket",
  });
  await createSupportTicket({
    actor: user,
    category: body.category,
    summary: body.summary,
    ticketId: caseId,
  });

  return Response.json(
    {
      audit,
      case: {
        category: body.category,
        createdAt: new Date().toISOString(),
        id: caseId,
        requester: `${user.firstName} ${user.lastName}`.trim() || user.email,
        status: "Pending support",
        summary: body.summary,
      },
      ok: true,
    },
    { status: 201 }
  );
}
