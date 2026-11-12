import { describe, expect, it } from "vitest";

import {
  applyAdjustments,
  hormuzMoves,
  isTravelSymbol,
  type MarketAdjustment,
} from "@/lib/market-adjustments";

const symbols = [
  { changePercent: 0.5, name: "S&P 500 ETF", news: "Steady", price: 100, ticker: "SPY" },
  { changePercent: -0.2, name: "Total Bond Market ETF", price: 50, ticker: "BND" },
];

function change(partial: Partial<MarketAdjustment>): MarketAdjustment {
  return {
    createdAt: "2026-11-12T10:00:00.000Z",
    id: Math.random().toString(),
    label: "Raised",
    news: "",
    percent: 3,
    studentUserIds: null,
    ticker: "SPY",
    ...partial,
  };
}

describe("applying teacher market changes", () => {
  it("leaves prices alone with no changes", () => {
    expect(applyAdjustments(symbols, [], "student-1")).toEqual(symbols);
  });

  it("applies a class-wide change to everyone, including the class preview", () => {
    const [spy] = applyAdjustments(symbols, [change({ percent: 3 })], null);
    expect(spy.price).toBe(103);
    expect(spy.changePercent).toBe(3.5);

    expect(applyAdjustments(symbols, [change({ percent: 3 })], "student-9")[0].price).toBe(103);
  });

  it("stacks multiple changes", () => {
    const [spy] = applyAdjustments(
      symbols,
      [change({ percent: 3 }), change({ createdAt: "2026-11-12T11:00:00.000Z", percent: 3 })],
      null
    );
    expect(spy.price).toBe(106.09);
  });

  it("applies a group or one-student change only to those students", () => {
    const targeted = change({ percent: -10, studentUserIds: ["student-1", "student-2"] });

    expect(applyAdjustments(symbols, [targeted], "student-1")[0].price).toBe(90);
    expect(applyAdjustments(symbols, [targeted], "student-3")[0].price).toBe(100);
    expect(applyAdjustments(symbols, [targeted], null)[0].price).toBe(100);
  });

  it("shows the most recent change's news, and keeps the original otherwise", () => {
    const result = applyAdjustments(
      symbols,
      [
        change({ news: "First", percent: 1 }),
        change({ createdAt: "2026-11-12T12:00:00.000Z", news: "Latest", percent: 1 }),
      ],
      null
    );
    expect(result[0].news).toBe("Latest");
    expect(result[1].news).toBeUndefined();
  });

  it("never prices a symbol below one cent", () => {
    expect(applyAdjustments(symbols, [change({ percent: -100 })], null)[0].price).toBe(0.01);
  });
});

describe("Strait of Hormuz scenario", () => {
  it("raises oil symbols and lowers travel symbols", () => {
    expect(
      hormuzMoves(
        [
          { name: "Energy Select Sector", ticker: "XLE" },
          { name: "Oil Services ETF", ticker: "OIH" },
          { name: "Global Airlines ETF", ticker: "JETS" },
        ],
        18
      )
    ).toEqual([
      { percent: 18, ticker: "XLE" },
      { percent: 18, ticker: "OIH" },
      { percent: -8, ticker: "JETS" },
    ]);
  });

  it("keeps the spike between 1% and 60%", () => {
    expect(hormuzMoves([{ name: "Oil", ticker: "XLE" }], 500)[0].percent).toBe(60);
    expect(hormuzMoves([{ name: "Oil", ticker: "XLE" }], 0)[0].percent).toBe(1);
  });

  it("recognizes travel symbols", () => {
    expect(isTravelSymbol("JETS", "anything")).toBe(true);
    expect(isTravelSymbol("CCL", "Carnival Cruise Lines")).toBe(true);
    expect(isTravelSymbol("XLE", "Energy Select Sector")).toBe(false);
  });
});
