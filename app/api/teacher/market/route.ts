import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { portfolioErrorResponse } from "@/lib/server/portfolios";
import { getClassInfoLevel, saveClassInfoLevel } from "@/lib/server/stock-info";
import {
  clearChange,
  createChange,
  resetClass,
  teacherMarketView,
  type ChangeAction,
  type ChangeTarget,
} from "@/lib/server/teacher-market";

// Teachers (and admins): one class's market as students see it, the active
// changes, and the class roster for choosing a group or one student.
export async function GET(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) return response;

  try {
    const className = new URL(request.url).searchParams.get("className");
    const view = await teacherMarketView(user, className);
    const infoLevel = view.className ? await getClassInfoLevel(view.className) : null;

    return Response.json({ ok: true, ...view, infoLevel });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}

type Body =
  | {
      action: "change";
      change: ChangeAction;
      target: ChangeTarget;
    }
  | { action: "undo"; changeId: string }
  | { action: "reset"; className: string }
  | { action: "infoLevel"; className: string; level: "basic" | "full" | null };

function validTarget(target: unknown): target is ChangeTarget {
  if (!target || typeof target !== "object") return false;
  const value = target as Record<string, unknown>;

  if (value.type === "all_classes") return true;
  if (typeof value.className !== "string" || !value.className) return false;
  if (value.type === "class") return true;
  return value.type === "students" && Array.isArray(value.studentEmails);
}

function validChange(change: unknown): change is ChangeAction {
  if (!change || typeof change !== "object") return false;
  const value = change as Record<string, unknown>;

  if (value.kind === "price") {
    return (value.direction === "raise" || value.direction === "lower") && typeof value.ticker === "string";
  }

  return (
    value.kind === "hormuz" &&
    Array.isArray(value.tickers) &&
    typeof value.oilSpikePercent === "number" &&
    Number.isFinite(value.oilSpikePercent)
  );
}

// Make a change, undo one, or reset a class market to normal. Every action
// is audited; nothing is deleted.
export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) return response;

  const body = (await request.json().catch(() => ({}))) as Partial<Body>;

  try {
    if (body.action === "change") {
      const { change, target } = body as Extract<Body, { action: "change" }>;

      if (!validTarget(target) || !validChange(change)) {
        return Response.json({ message: "Choose who to change and what to change.", ok: false }, { status: 400 });
      }

      const result = await createChange(user, target, change);
      await recordAuditEvent({
        action: "market_change.created",
        actor: user,
        context: {
          applied: result.applied,
          classNames: result.classNames,
          change,
          skipped: result.skipped,
          target: target.type === "students" ? { ...target, studentEmails: target.studentEmails.map((e) => e.toLowerCase()) } : target,
        },
        reason: change.kind === "hormuz" ? "Strait of Hormuz scenario" : `${change.direction} ${change.ticker}`,
        targetId: result.eventId,
        targetType: "market_change",
      });

      return Response.json({ ok: true, ...result }, { status: 201 });
    }

    if (body.action === "undo" && typeof body.changeId === "string") {
      const result = await clearChange(user, body.changeId);
      await recordAuditEvent({
        action: "market_change.undone",
        actor: user,
        context: result,
        reason: "Undo market change",
        targetId: result.eventId,
        targetType: "market_change",
      });

      return Response.json({ ok: true, ...result });
    }

    if (body.action === "reset" && typeof body.className === "string") {
      const result = await resetClass(user, body.className);
      await recordAuditEvent({
        action: "market_change.reset",
        actor: user,
        context: result,
        reason: "Reset market to normal",
        targetId: body.className,
        targetType: "class",
      });

      return Response.json({ ok: true, ...result });
    }

    if (body.action === "infoLevel" && typeof body.className === "string") {
      const level = body.level === "basic" || body.level === "full" ? body.level : null;
      const infoLevel = await saveClassInfoLevel(user, body.className, level);

      await recordAuditEvent({
        action: "class_market.info_level_updated",
        actor: user,
        context: { level: infoLevel.level, setting: infoLevel.setting ?? "grade default" },
        reason: "Stock info level changed",
        targetId: body.className,
        targetType: "class_market",
      });

      return Response.json({ infoLevel, ok: true });
    }

    return Response.json({ message: "Unknown market action.", ok: false }, { status: 400 });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}
