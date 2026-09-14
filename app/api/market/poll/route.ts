import { createTraceId, statusFromDuration } from "@/lib/observability";
import { testMarketProvider } from "@/lib/server/market-providers";
import {
  getClassMarketState,
  listPollableIntegrations,
  markCredentialUsed,
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
  const concurrency = Math.min(
    Math.max(Number(process.env.MARKET_POLL_CONCURRENCY ?? 4), 1),
    8
  );
  const results = await mapWithConcurrency(integrations, concurrency, async (integration) => {
    try {
      const token = await readSecretValue(integration.token_secret_ref);
      if (integration.credential_id) {
        await markCredentialUsed(integration.credential_id);
      }
      const result = await testMarketProvider({
        allowedSymbols: integration.allowed_symbols_csv,
        endpoint: integration.endpoint_url,
        maxSymbols: integration.max_symbols,
        provider: integration.provider_name,
        token,
        tokenPlacement: integration.token_placement ?? "bearer",
      });

      await updateIntegrationPollResult({
        errorMessage: result.ok ? undefined : result.message,
        integrationId: integration.id,
        ok: result.ok,
        quotes: result.quotes,
      });

      if (result.ok && integration.target_class) {
        await getClassMarketState(integration.target_class, {
          recordSnapshot: true,
        });
      }

      return {
        importedSymbols: result.importedSymbols,
        integrationId: integration.id,
        ok: result.ok,
        provider: integration.provider_name,
      };
    } catch (error) {
      await updateIntegrationPollResult({
        errorMessage: (error as Error).message,
        integrationId: integration.id,
        ok: false,
      });
      return {
        error: (error as Error).message,
        integrationId: integration.id,
        ok: false,
        provider: integration.provider_name,
      };
    }
  });

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

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
) {
  const results: R[] = [];
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker())
  );

  return results;
}
