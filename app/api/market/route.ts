import { startOtelSpan } from "@/lib/observability";

const marketSnapshot = [
  {
    ticker: "SPY",
    name: "S&P 500 ETF",
    price: 689.42,
    changePercent: 0.7,
    lessonUse: "Broad market benchmark for diversification lessons",
  },
  {
    ticker: "QQQ",
    name: "Growth ETF",
    price: 621.15,
    changePercent: -0.4,
    lessonUse: "Volatility comparison for growth-heavy portfolios",
  },
  {
    ticker: "BND",
    name: "Bond ETF",
    price: 74.18,
    changePercent: 0.2,
    lessonUse: "Lower-risk asset behavior during market movement",
  },
  {
    ticker: "IPO-LAB",
    name: "Simulated IPO basket",
    price: 31.62,
    changePercent: 1.9,
    lessonUse: "Risk and hype discussion without real IPO access",
  },
];

export async function GET() {
  const span = startOtelSpan("market.snapshot", {
    route: "/api/market",
    source: "mock-provider",
  });
  const endedSpan = span.end({ symbolCount: marketSnapshot.length });

  return Response.json({
    mode: "simulated-delayed",
    source: "mock-provider",
    telemetry: {
      durationMs: endedSpan.durationMs,
      otelReady: true,
      traceId: endedSpan.traceId,
    },
    updatedAt: new Date().toISOString(),
    disclosure:
      "Educational market context only. This endpoint does not place trades or provide financial advice.",
    symbols: marketSnapshot,
  });
}
