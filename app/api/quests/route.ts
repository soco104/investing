import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import {
  assignQuest,
  copyQuest,
  listQuests,
  questErrorResponse,
  saveQuest,
} from "@/lib/server/quests";

// Teachers: their own quests (?scope=mine, the default) or the shared library
// of every teacher's quests (?scope=library).
export async function GET(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) return response;

  try {
    const scope = new URL(request.url).searchParams.get("scope") === "library" ? "library" : "mine";
    return Response.json({ ok: true, quests: await listQuests(user, scope), scope });
  } catch (error) {
    return questErrorResponse(error);
  }
}

type Body = {
  action?: "save" | "copy" | "assign";
  classNames?: string[];
  dueDate?: string | null;
  quest?: unknown;
  questId?: string | null;
};

// Save a quest, copy one from the library, or assign one to classes.
export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) return response;

  const body = (await request.json().catch(() => ({}))) as Body;

  try {
    if (body.action === "save") {
      const result = await saveQuest(user, body.questId ?? null, body.quest);
      await recordAuditEvent({
        action: "quest.saved",
        actor: user,
        context: { created: result.created },
        reason: result.created ? "Created learning quest" : "Edited learning quest",
        targetId: result.id,
        targetType: "learning_quest",
      });
      return Response.json({ ok: true, ...result }, { status: result.created ? 201 : 200 });
    }

    if (body.action === "copy" && body.questId) {
      const result = await copyQuest(user, body.questId);
      await recordAuditEvent({
        action: "quest.copied",
        actor: user,
        context: { fromQuestId: body.questId },
        reason: "Copied learning quest from library",
        targetId: result.id,
        targetType: "learning_quest",
      });
      return Response.json({ ok: true, ...result }, { status: 201 });
    }

    if (body.action === "assign" && body.questId) {
      const result = await assignQuest(user, body.questId, body.classNames ?? [], body.dueDate);
      await recordAuditEvent({
        action: "quest.assigned",
        actor: user,
        context: { classNames: result.classNames, dueAt: result.dueAt },
        reason: "Assigned learning quest",
        targetId: body.questId,
        targetType: "learning_quest",
      });
      return Response.json({ ok: true, ...result });
    }

    return Response.json({ message: "Unknown quest action.", ok: false }, { status: 400 });
  } catch (error) {
    return questErrorResponse(error);
  }
}
