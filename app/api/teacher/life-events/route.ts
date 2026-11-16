import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import {
  deck,
  listLifeEvents,
  playLifeEvent,
  previewLifeEvent,
  undoLifeEvent,
  type LifeEventChoice,
  type LifeEventTarget,
} from "@/lib/server/life-events";
import { portfolioErrorResponse } from "@/lib/server/portfolios";
import { controllableClasses } from "@/lib/server/teacher-market";

// Life event cards (v0.2.17). Teachers of the class (with teacher controls
// on) and admins.
export async function GET(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) return response;

  const className = new URL(request.url).searchParams.get("className");

  try {
    return Response.json({
      classes: await controllableClasses(user),
      deck,
      events: await listLifeEvents(user, className),
      ok: true,
    });
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}

type Body = {
  action?: "preview" | "play" | "undo";
  choice?: LifeEventChoice;
  className?: string;
  eventId?: string;
  seed?: string;
  target?: LifeEventTarget;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "teacherPortal");

  if (response || !user) return response;

  const body = (await request.json().catch(() => ({}))) as Body;
  const bad = (message: string) => Response.json({ message, ok: false }, { status: 400 });

  try {
    if (body.action === "undo") {
      if (!body.eventId) return bad("Choose an event to undo.");

      const result = await undoLifeEvent(user, body.eventId);

      await recordAuditEvent({
        action: "life_event.undone",
        actor: user.actingAdmin ?? user,
        context: { className: result.className, reversed: result.reversed, title: result.title },
        reason: "Life event undone",
        targetId: body.eventId,
        targetType: "life_event",
      });

      return Response.json({ ok: true, ...result });
    }

    if (!body.className || !body.choice || !body.target) return bad("Choose a class, a card and who it applies to.");

    const input = { choice: body.choice, className: body.className, seed: body.seed, target: body.target };

    if (body.action === "preview") {
      return Response.json({ ok: true, ...(await previewLifeEvent(user, input)) });
    }

    if (body.action === "play") {
      const result = await playLifeEvent(user, input);

      await recordAuditEvent({
        action: "life_event.played",
        actor: user.actingAdmin ?? user,
        context: {
          className: body.className,
          kind: result.card.kind,
          percent: result.card.percentOfStartingCash,
          students: result.hits.length,
          target: body.target.type,
          title: result.card.title,
        },
        reason: "Life event played",
        targetId: result.eventId,
        targetType: "life_event",
      });

      return Response.json({ ok: true, ...result }, { status: 201 });
    }

    return bad("Unknown life event action.");
  } catch (error) {
    return portfolioErrorResponse(error);
  }
}
