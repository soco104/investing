import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";

type IncidentRequest = {
  severity: "info" | "warn" | "error" | "critical";
  summary: string;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as IncidentRequest;

  if (!body.severity || !body.summary) {
    return Response.json(
      { message: "severity and summary are required.", ok: false },
      { status: 400 }
    );
  }

  const incidentId = `incident-${Date.now()}`;
  const audit = await recordAuditEvent({
    action: "incident.opened",
    actor: user,
    context: {
      checklist: [
        "Triage customer impact.",
        "Preserve logs and trace IDs.",
        "Apply containment or rollback.",
        "Notify district contact if student data or class availability is affected.",
        "Document resolution and postmortem.",
      ],
      severity: body.severity,
      summary: body.summary,
    },
    reason: body.summary,
    targetId: incidentId,
    targetType: "incident_response_record",
  });

  return Response.json(
    {
      audit,
      incident: {
        id: incidentId,
        ownerUserId: user.id,
        severity: body.severity,
        status: "open",
        summary: body.summary,
      },
      ok: true,
    },
    { status: 201 }
  );
}
