import type { PerformanceEvent } from "@/lib/observability";
import { createTraceId, nowIso, statusFromDuration } from "@/lib/observability";
import {
  hasProductionDatabase,
  listPerformanceEvents,
  recordPerformanceEvent,
} from "@/lib/server/repository";

const performanceEvents: PerformanceEvent[] = [
  {
    id: "perf-1042",
    route: "/api/market",
    operation: "marketSnapshot",
    durationMs: 42,
    status: "ok",
    createdAt: nowIso(),
    traceId: createTraceId(),
  },
  {
    id: "perf-1041",
    route: "/api/integration-test",
    operation: "providerGet",
    durationMs: 812,
    status: "slow",
    createdAt: nowIso(),
    traceId: createTraceId(),
  },
];

export async function GET() {
  if (hasProductionDatabase()) {
    return Response.json({ events: await listPerformanceEvents() });
  }

  return Response.json({ events: performanceEvents.slice(0, 25) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<PerformanceEvent>;
  const durationMs = Math.round(body.durationMs ?? 0);
  const event: PerformanceEvent = {
    id: `perf-${Date.now()}`,
    route: body.route ?? "unknown",
    operation: body.operation ?? "unknown",
    durationMs,
    status: body.status ?? statusFromDuration(durationMs),
    createdAt: nowIso(),
    traceId: body.traceId ?? createTraceId(),
  };

  await recordPerformanceEvent(event);

  if (!hasProductionDatabase()) {
    performanceEvents.unshift(event);
  }

  return Response.json({ event, ok: true }, { status: 201 });
}
