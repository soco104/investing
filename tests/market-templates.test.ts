import { describe, expect, it } from "vitest";

import { findCard } from "@/lib/life-events";
import {
  comboPresets,
  findTemplate,
  isDifficulty,
  marketTemplates,
  scalePercent,
  symbolGroup,
  templateMoves,
} from "@/lib/market-templates";

const classSymbols = [
  { name: "S&P 500 ETF", ticker: "SPY" },
  { name: "NASDAQ 100 ETF", ticker: "QQQ" },
  { name: "Total Bond Market ETF", ticker: "BND" },
  { name: "Total International Stock ETF", ticker: "VXUS" },
  { name: "Classroom IPO Lab", ticker: "IPO-LAB" },
];

describe("difficulty presets", () => {
  it("scales percents and keeps them whole, from 1 up to the limit", () => {
    expect(scalePercent(8, "gentle")).toBe(4);
    expect(scalePercent(8, "realistic")).toBe(8);
    expect(scalePercent(8, "tough")).toBe(12);
    expect(scalePercent(1, "gentle")).toBe(1);
    expect(scalePercent(90, "tough")).toBe(100);
    expect(scalePercent(8, undefined)).toBe(8);
    expect(isDifficulty("tough")).toBe(true);
    expect(isDifficulty("brutal")).toBe(false);
  });
});

describe("market templates", () => {
  it("groups the class symbols sensibly", () => {
    expect(classSymbols.map((symbol) => symbolGroup(symbol.ticker, symbol.name))).toEqual([
      "broad",
      "tech",
      "bonds",
      "international",
      "speculative",
    ]);
    expect(symbolGroup("ZZZ", "Mystery Corp")).toBe("other");
  });

  it("a recession drops stocks, the riskiest most, and lifts bonds", () => {
    const moves = Object.fromEntries(templateMoves(findTemplate("recession")!, classSymbols).map((move) => [move.ticker, move.percent]));

    expect(moves).toEqual({ BND: 3, "IPO-LAB": -18, QQQ: -12, SPY: -8, VXUS: -9 });
  });

  it("scales with difficulty", () => {
    const tough = templateMoves(findTemplate("rate-cut")!, classSymbols, "tough");
    expect(tough.find((move) => move.ticker === "QQQ")?.percent).toBe(8);
  });

  it("a company scandal moves only the chosen symbol", () => {
    const scandal = findTemplate("company-scandal")!;

    expect(templateMoves(scandal, classSymbols, "realistic", "qqq")).toEqual([{ percent: -20, ticker: "QQQ" }]);
    expect(templateMoves(scandal, classSymbols, "gentle", "QQQ")).toEqual([{ percent: -10, ticker: "QQQ" }]);
    expect(templateMoves(scandal, classSymbols, "realistic", "NOPE")).toEqual([]);
    expect(templateMoves(scandal, classSymbols, "realistic", null)).toEqual([]);
  });

  it("every template has an id, title and news", () => {
    expect(new Set(marketTemplates.map((template) => template.id)).size).toBe(marketTemplates.length);
    expect(marketTemplates.every((template) => template.title && template.news)).toBe(true);
  });
});

describe("combo presets", () => {
  it("pair a real template with a real card", () => {
    for (const combo of comboPresets) {
      expect(findTemplate(combo.templateId), combo.id).not.toBeNull();
      expect(findCard(combo.cardId), combo.id).not.toBeNull();
    }
  });
});
