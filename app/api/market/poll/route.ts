import { createTraceId, statusFromDuration } from "@/lib/observability";
import { testMarketProvider } from "@/lib/server/market-providers";
import {
  listPollableIntegrations,
  updateIntegrationPollResult,
} from "@/lib/server/repository";
import { readSecretValue } from "@/lib/server/secrets";

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const suppliedSecret = request.headers.get("x-futurefund-cron");

  if (expectedSecret && suppliedSecret !== expectedSecret) {
    return Response.json(
      { message: "Market polling is not authorized.", ok: false },
      { status: 401 }
    );
  }

  const startedAt = performance.now();
  const integrations = await listPollableIntegrations();
  const results = [];

  for (const integration of integrations) {
    try {
      const token = await readSecretValue(integration.token_secret_ref);
      const result = await testMarketProvider({
        allowedSymbols: integration.allowed_symbols_csv,
        endpoint: integration.endpoint_url,
        maxSymbols: integration.max_symbols,
        provider: integration.provider_name,
        token,
      });

      await updateIntegrationPollResult({
        errorMessage: result.ok ? undefined : result.message,
        integrationId: integration.id,
        ok: result.ok,
      });

      results.push({
        importedSymbols: result.importedSymbols,
        integrationId: integration.id,
        ok: result.ok,
        provider: integration.provider_name,
      });
    } catch (error) {
      await updateIntegrationPollResult({
        errorMessage: (error as Error).message,
        integrationId: integration.id,
        ok: false,
      });
      results.push({
        error: (error as Error).message,
        integrationId: integration.id,
        ok: false,
        provider: integration.provider_name,
      });
    }
  }

  const durationMs = Math.round(performance.now() - startedAt);

  return Response.json({
    integrationCount: integrations.length,
    ok: results.every((result) => result.ok),
    results,
    telemetry: {
      durationMs,
      status: statusFromDuration(durationMs, results.some((result) => !result.ok)),
      traceId: createTraceId(),
    },
  });
}
