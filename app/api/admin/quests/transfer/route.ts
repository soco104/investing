import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { exportQuests, importQuests, questErrorResponse } from "@/lib/server/quests";

type QuestTransferRequest = {
  action: "export" | "import";
  payload?: unknown;
  reason?: string;
};

// Export your saved quests as JSON, or import quests into your own quests
// (saved as drafts). Both are audited. Since v0.2.9 imports are stored.
export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "questImportExport");

  if (response || !user) {
    return response;
  }

  const body = (await request.json().catch(() => ({}))) as QuestTransferRequest;

  if (body.action !== "export" && body.action !== "import") {
    return Response.json(
      { message: "action must be export or import.", ok: false },
      { status: 400 }
    );
  }

  try {
    if (body.action === "export") {
      const quests = await exportQuests(user);
      const audit = await recordAuditEvent({
        action: "quest_templates.exported",
        actor: user,
        context: { count: quests.length },
        reason: body.reason,
        targetId: `quest-transfer-${Date.now()}`,
        targetType: "learning_quest_template",
      });
      return Response.json({ audit, ok: true, quests });
    }

    const result = await importQuests(user, body.payload);
    const audit = await recordAuditEvent({
      action: "quest_templates.imported",
      actor: user,
      context: { count: result.count, questIds: result.ids },
      reason: body.reason,
      targetId: `quest-transfer-${Date.now()}`,
      targetType: "learning_quest_template",
    });

    return Response.json({ audit, ok: true, persisted: true, ...result }, { status: 201 });
  } catch (error) {
    return questErrorResponse(error);
  }
}
