import { startOtelSpan, statusFromDuration } from "@/lib/observability";
import { requirePermission } from "@/lib/server/auth";
import { testMarketProvider } from "@/lib/server/market-providers";
import { isSafeIntegrationEndpoint } from "@/lib/server/url-safety";

type IntegrationTestRequest = {
  allowedSymbols?: string;
  endpoint?: string;
  maxSymbols?: number;
  provider?: string;
  token?: string;
  tokenPlacement?: "bearer" | "query" | "x-api-key";
};

export async function POST(request: Request) {
  const { response } = await requirePermission(request, "adminPortal");

  if (response) {
    return response;
  }

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

  if (!isSafeIntegrationEndpoint(endpoint)) {
    const endedSpan = span.end({ failed: true, reason: "unsafe_endpoint" });

    return Response.json(
      {
        importedSymbols: 0,
        message: "Endpoint must be HTTPS and cannot target private infrastructure.",
        ok: false,
        telemetry: {
          durationMs: endedSpan.durationMs,
          status: statusFromDuration(endedSpan.durationMs, true),
          traceId: endedSpan.traceId,
        },
      },
      { status: 400 }
    );
  }

  try {
    const result = await testMarketProvider({
      allowedSymbols: body.allowedSymbols,
      endpoint,
      maxSymbols: body.maxSymbols,
      provider: body.provider ?? "Custom provider",
      token: body.token,
      tokenPlacement: body.tokenPlacement ?? "bearer",
    });
    const endedSpan = span.end({
      endpoint,
      statusCode: result.statusCode,
    });

    return Response.json(
      {
        telemetry: {
          durationMs: endedSpan.durationMs,
          status: statusFromDuration(endedSpan.durationMs, !result.ok),
          traceId: endedSpan.traceId,
        },
        ...result,
      },
      { status: result.ok ? 200 : 502 }
    );
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
