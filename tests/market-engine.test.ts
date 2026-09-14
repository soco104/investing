import { describe, expect, it } from "vitest";

import {
  buildClassMarketState,
  normalizeClassMarketConfig,
} from "@/lib/server/market-engine";

describe("central market simulation engine", () => {
  it("applies class scenarios on top of provider quotes", () => {
    const config = normalizeClassMarketConfig({
      allowedSymbols: "SPY",
      className: "7th Grade Finance A",
      eventScenario: "market_drop",
      simulationMode: "teacher_scenario",
      volatilityMultiplier: 1.5,
    });
    const state = buildClassMarketState({
      className: "7th Grade Finance A",
      config,
      quotes: [
        {
          changePercent: 1,
          name: "S&P 500 ETF",
          price: 100,
          ticker: "SPY",
        },
        {
          changePercent: 3,
          name: "Growth ETF",
          price: 200,
          ticker: "QQQ",
        },
      ],
    });

    expect(state.engineMode).toBe("central-simulator");
    expect(state.symbols).toHaveLength(1);
    expect(state.symbols[0]).toMatchObject({
      ticker: "SPY",
      simulatedPrice: expect.any(Number),
    });
    expect(state.symbols[0].simulatedChangePercent).not.toBe(1);
  });

  it("freezes simulated movement while keeping quote identity", () => {
    const config = normalizeClassMarketConfig({
      allowedSymbols: "SPY",
      className: "7th Grade Finance B",
      simulationMode: "frozen",
    });
    const state = buildClassMarketState({
      className: "7th Grade Finance B",
      config,
      quotes: [
        {
          changePercent: 2.5,
          name: "S&P 500 ETF",
          price: 100,
          ticker: "SPY",
        },
      ],
    });

    expect(state.symbols[0]).toMatchObject({
      simulatedChangePercent: 0,
      simulatedPrice: 100,
      ticker: "SPY",
    });
  });
});
