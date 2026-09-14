import { startOtelSpan } from "@/lib/observability";
import { userFromRequest } from "@/lib/server/auth";
import { buildClassMarketState, fallbackMarketQuotes } from "@/lib/server/market-engine";
import { getClassMarketState, hasProductionDatabase } from "@/lib/server/repository";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const user = await userFromRequest(request);
  const className = url.searchParams.get("className") ?? user?.className;
  const classMarketState =
    hasProductionDatabase() && className
      ? await getClassMarketState(className)
      : buildClassMarketState({
          className: className ?? "Demo Class",
          quotes: fallbackMarketQuotes,
        });
  const span = startOtelSpan("market.snapshot", {
    route: "/api/market",
    className: className ?? null,
    source: classMarketState.engineMode,
  });
  const endedSpan = span.end({ symbolCount: classMarketState.symbols.length });

  return Response.json({
    classMarket: classMarketState,
    mode: classMarketState.config.simulationMode,
    source: classMarketState.engineMode,
    telemetry: {
      durationMs: endedSpan.durationMs,
      otelReady: true,
      traceId: endedSpan.traceId,
    },
    updatedAt: classMarketState.generatedAt,
    disclosure: classMarketState.disclosure,
    symbols: classMarketState.symbols.map((quote) => ({
      changePercent: quote.simulatedChangePercent,
      lessonUse: quote.lessonUse ?? "Classroom simulation market input",
      name: quote.name,
      price: quote.simulatedPrice,
      ticker: quote.ticker,
    })),
  });
}
