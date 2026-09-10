import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";

type QuestTransferRequest = {
  action: "export" | "import";
  count?: number;
  payload?: unknown;
  reason?: string;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "questImportExport");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as QuestTransferRequest;

  if (body.action !== "export" && body.action !== "import") {
    return Response.json(
      { message: "action must be export or import.", ok: false },
      { status: 400 }
    );
  }

  const audit = await recordAuditEvent({
    action:
      body.action === "export"
        ? "quest_templates.exported"
        : "quest_templates.imported",
    actor: user,
    context: {
      count: body.count ?? 0,
      payloadType: body.payload ? typeof body.payload : "none",
    },
    reason: body.reason,
    targetId: `quest-transfer-${Date.now()}`,
    targetType: "learning_quest_template",
  });

  return Response.json({ audit, ok: true, persisted: true }, { status: 201 });
}
