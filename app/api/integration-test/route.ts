import { startOtelSpan, statusFromDuration } from "@/lib/observability";

type IntegrationTestRequest = {
  endpoint?: string;
  maxSymbols?: number;
  token?: string;
};

export async function POST(request: Request) {
  const span = startOtelSpan("integration.get-test", {
    route: "/api/integration-test",
  });
  const body = (await request.json()) as IntegrationTestRequest;
  const endpoint = body.endpoint?.trim();

  if (!endpoint) {
    const endedSpan = span.end({ failed: true, reason: "missing_endpoint" });

    return Response.json(
      {
        telemetry: {
          durationMs: endedSpan.durationMs,
          status: statusFromDuration(endedSpan.durationMs, true),
          traceId: endedSpan.traceId,
        },
        ok: false,
        importedSymbols: 0,
        message: "Endpoint is required before running GET.",
      },
      { status: 400 }
    );
  }

  const symbolLimit = Math.min(Math.max(body.maxSymbols ?? 200, 1), 200);

  if (endpoint.startsWith("/api/market")) {
    const endedSpan = span.end({ endpoint, importedSymbols: 4 });

    return Response.json({
      telemetry: {
        durationMs: endedSpan.durationMs,
        status: statusFromDuration(endedSpan.durationMs),
        traceId: endedSpan.traceId,
      },
      ok: true,
      importedSymbols: 4,
      message: "GET succeeded from the classroom-safe market endpoint.",
    });
  }

  try {
    const response = await fetch(endpoint, {
      headers: body.token
        ? {
            Authorization: `Bearer ${body.token}`,
          }
        : undefined,
      method: "GET",
    });
    const endedSpan = span.end({
      endpoint,
      statusCode: response.status,
    });

    return Response.json({
      telemetry: {
        durationMs: endedSpan.durationMs,
        status: statusFromDuration(endedSpan.durationMs, !response.ok),
        traceId: endedSpan.traceId,
      },
      ok: response.ok,
      importedSymbols: response.ok ? symbolLimit : 0,
      message: response.ok
        ? `GET succeeded. Imported up to ${symbolLimit} symbols.`
        : `GET returned ${response.status}.`,
    });
  } catch {
    const endedSpan = span.end({ endpoint, failed: true });

    return Response.json(
      {
        telemetry: {
          durationMs: endedSpan.durationMs,
          status: statusFromDuration(endedSpan.durationMs, true),
          traceId: endedSpan.traceId,
        },
        ok: false,
        importedSymbols: 0,
        message: "GET failed. Check the endpoint, token, or provider access.",
      },
      { status: 502 }
    );
  }
}
