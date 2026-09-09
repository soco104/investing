export type Severity = "info" | "warn" | "error" | "critical";

export type AppErrorEvent = {
  id: string;
  severity: Severity;
  source: "frontend" | "api" | "integration" | "worker";
  message: string;
  route: string;
  userRole?: string;
  createdAt: string;
  traceId: string;
};

export type PerformanceEvent = {
  id: string;
  route: string;
  operation: string;
  durationMs: number;
  status: "ok" | "slow" | "failed";
  createdAt: string;
  traceId: string;
};

export function createTraceId() {
  return `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function statusFromDuration(durationMs: number, failed = false) {
  if (failed) {
    return "failed" as const;
  }

  return durationMs > 750 ? ("slow" as const) : ("ok" as const);
}

export function startOtelSpan(name: string, attributes: Record<string, unknown> = {}) {
  const traceId = createTraceId();
  const startedAt = performance.now();

  return {
    end(extraAttributes: Record<string, unknown> = {}) {
      return {
        attributes: { ...attributes, ...extraAttributes },
        durationMs: Math.round(performance.now() - startedAt),
        name,
        traceId,
      };
    },
    traceId,
  };
}

export async function reportClientError(event: Omit<AppErrorEvent, "id" | "createdAt">) {
  await fetch("/api/observability/errors", {
    body: JSON.stringify(event),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  }).catch(() => undefined);
}

export async function reportClientPerformance(
  event: Omit<PerformanceEvent, "id" | "createdAt">
) {
  await fetch("/api/observability/performance", {
    body: JSON.stringify(event),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  }).catch(() => undefined);
}

