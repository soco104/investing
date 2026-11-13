import { describe, expect, it } from "vitest";

import { buildStockInfo, defaultInfoLevel, resolveInfoLevel, sampleSeries } from "@/lib/stock-info";

describe("stock info level", () => {
  it("defaults to Full for grades 9-12 and Basic otherwise", () => {
    expect(defaultInfoLevel(6)).toBe("basic");
    expect(defaultInfoLevel(8)).toBe("basic");
    expect(defaultInfoLevel(9)).toBe("full");
    expect(defaultInfoLevel(12)).toBe("full");
    expect(defaultInfoLevel(null)).toBe("basic");
    expect(defaultInfoLevel(undefined)).toBe("basic");
  });

  it("lets the class setting override the grade default", () => {
    expect(resolveInfoLevel("full", 7)).toBe("full");
    expect(resolveInfoLevel("basic", 11)).toBe("basic");
    expect(resolveInfoLevel(null, 11)).toBe("full");
    expect(resolveInfoLevel("something else", 7)).toBe("basic");
  });
});

describe("buildStockInfo", () => {
  const base = { changePercent: 0.7, name: "S&P 500 ETF", price: 689.42, ticker: "spy" };

  it("Basic shows the essentials and nothing advanced", () => {
    const info = buildStockInfo({ ...base, level: "basic", range: "1Y" });

    expect(info.ticker).toBe("SPY");
    expect(info.sampleData).toBe(true);
    expect(info.description).toContain("500");
    expect(info.ranges).toEqual(["1M"]);
    expect(info.range).toBe("1M"); // a Full-only range is refused
    expect(info.headlines).toBeUndefined();
    expect(info.keyFigures).toBeUndefined();
    expect(info.sector).toBeUndefined();
  });

  it("Full adds key figures, sector, headlines and more ranges", () => {
    const info = buildStockInfo({ ...base, level: "full", range: "1Y" });

    expect(info.range).toBe("1Y");
    expect(info.ranges).toEqual(["1D", "1W", "1M", "1Y"]);
    expect(info.headlines?.length).toBeGreaterThan(0);
    expect(info.sector).toBeTruthy();
    expect(info.keyFigures?.yearHigh).toBeGreaterThanOrEqual(info.keyFigures?.yearLow ?? 0);
    expect(info.keyFigures?.yearHigh).toBeGreaterThanOrEqual(base.price);
  });

  it("gives an unknown symbol a generic profile", () => {
    const info = buildStockInfo({ changePercent: 0, level: "full", name: "Mystery", price: 10, ticker: "ZZZ" });

    expect(info.description).toContain("class market");
    expect(info.keyFigures?.peRatio).toBe("18.5");
  });
});

describe("sampleSeries", () => {
  it("makes the 1-day chart agree with today's change", () => {
    const up = sampleSeries("QQQ", "1D", 100, 2);
    const down = sampleSeries("QQQ", "1D", 100, -2);

    expect(up[0].price).toBeCloseTo(98.04, 2);
    expect(up.at(-1)?.price).toBe(100);
    expect(down[0].price).toBeGreaterThan(100);
  });

  it("ends at the current price and is the same every time", () => {
    const first = sampleSeries("QQQ", "1M", 621.15);
    const second = sampleSeries("QQQ", "1M", 621.15);

    expect(first.at(-1)?.price).toBe(621.15);
    expect(first).toEqual(second);
    expect(first).toHaveLength(22);
    expect(first.every((point) => point.price > 0)).toBe(true);
  });
});
