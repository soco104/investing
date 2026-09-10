import type { AppErrorEvent } from "@/lib/observability";
import { createTraceId, nowIso } from "@/lib/observability";
import {
  hasProductionDatabase,
  listErrorEvents,
  recordErrorEvent,
} from "@/lib/server/repository";

const errorEvents: AppErrorEvent[] = [
  {
    id: "err-1041",
    severity: "warn",
    source: "integration",
    message: "District Market Provider is missing an API token.",
    route: "/api/integration-test",
    userRole: "Admin",
    createdAt: nowIso(),
    traceId: createTraceId(),
  },
  {
    id: "err-1038",
    severity: "info",
    source: "frontend",
    message: "Blocked a message with disallowed classroom language.",
    route: "/inbox",
    userRole: "Student",
    createdAt: nowIso(),
    traceId: createTraceId(),
  },
];

export async function GET() {
  if (hasProductionDatabase()) {
    return Response.json({ events: await listErrorEvents() });
  }

  return Response.json({ events: errorEvents.slice(0, 25) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<AppErrorEvent>;
  const event: AppErrorEvent = {
    id: `err-${Date.now()}`,
    severity: body.severity ?? "error",
    source: body.source ?? "frontend",
    message: body.message ?? "Unhandled application error",
    route: body.route ?? "unknown",
    userRole: body.userRole,
    createdAt: nowIso(),
    traceId: body.traceId ?? createTraceId(),
  };

  await recordErrorEvent(event);

  if (!hasProductionDatabase()) {
    errorEvents.unshift(event);
  }

  return Response.json({ event, ok: true }, { status: 201 });
}
