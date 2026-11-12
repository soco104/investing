import { describe, expect, it } from "vitest";

import {
  allowsFractionalShares,
  applyTrade,
  gradeLevelFromClassName,
  portfolioValueCents,
  sharesToUnits,
  validateAllocationTargets,
  defaultAllocationTargets,
  type PortfolioState,
} from "@/lib/portfolio-rules";

const empty: PortfolioState = { cashCents: 100_000, holdings: [] };
const spy = { name: "S&P 500 ETF", priceCents: 10_000, ticker: "SPY" };

describe("grade levels and fractional shares", () => {
  it("reads the grade from class names", () => {
    expect(gradeLevelFromClassName("7th Grade Finance A")).toBe(7);
    expect(gradeLevelFromClassName("8th Grade Investing Lab")).toBe(8);
    expect(gradeLevelFromClassName("Grade 11 Economics")).toBe(11);
    expect(gradeLevelFromClassName("High School Personal Finance")).toBeNull();
  });

  it("allows fractional shares from grade 10", () => {
    expect(allowsFractionalShares(9)).toBe(false);
    expect(allowsFractionalShares(10)).toBe(true);
    expect(allowsFractionalShares(12)).toBe(true);
    expect(allowsFractionalShares(null)).toBe(false);
  });

  it("accepts up to 4 decimal places", () => {
    expect(sharesToUnits(1)).toBe(10_000);
    expect(sharesToUnits(2.5)).toBe(25_000);
    expect(sharesToUnits(0.0001)).toBe(1);
    expect(sharesToUnits(0.00001)).toBeNull();
    expect(sharesToUnits(1.23456)).toBeNull();
    expect(sharesToUnits(0)).toBeNull();
    expect(sharesToUnits(-1)).toBeNull();
    expect(sharesToUnits(Number.NaN)).toBeNull();
  });
});

describe("buying and selling", () => {
  it("buys shares, spending cash", () => {
    const result = applyTrade(empty, { ...spy, allowFractional: false, shares: 3, side: "buy" });

    expect(result).toMatchObject({ amountCents: 30_000, ok: true });
    if (!result.ok) return;
    expect(result.state.cashCents).toBe(70_000);
    expect(result.state.holdings).toEqual([
      { averageCostCents: 10_000, name: "S&P 500 ETF", quantityUnits: 30_000, ticker: "SPY" },
    ]);
  });

  it("refuses to spend more cash than the portfolio has", () => {
    expect(
      applyTrade(empty, { ...spy, allowFractional: false, shares: 11, side: "buy" })
    ).toEqual({ error: "insufficient_cash", ok: false });
  });

  it("averages the cost across buys at different prices", () => {
    const first = applyTrade(empty, { ...spy, allowFractional: false, shares: 1, side: "buy" });
    if (!first.ok) throw new Error("first buy failed");
    const second = applyTrade(first.state, {
      ...spy,
      allowFractional: false,
      priceCents: 13_000,
      shares: 2,
      side: "buy",
    });
    if (!second.ok) throw new Error("second buy failed");

    expect(second.state.holdings[0].averageCostCents).toBe(12_000);
    expect(second.state.holdings[0].quantityUnits).toBe(30_000);
  });

  it("sells shares it owns and removes a fully sold holding", () => {
    const bought = applyTrade(empty, { ...spy, allowFractional: false, shares: 2, side: "buy" });
    if (!bought.ok) throw new Error("buy failed");

    const partial = applyTrade(bought.state, {
      ...spy,
      allowFractional: false,
      priceCents: 11_000,
      shares: 1,
      side: "sell",
    });
    if (!partial.ok) throw new Error("sell failed");
    expect(partial.state.cashCents).toBe(80_000 + 11_000);
    expect(partial.state.holdings[0].quantityUnits).toBe(10_000);

    const all = applyTrade(partial.state, { ...spy, allowFractional: false, shares: 1, side: "sell" });
    if (!all.ok) throw new Error("sell failed");
    expect(all.state.holdings).toEqual([]);
  });

  it("refuses to sell shares it doesn't own", () => {
    expect(
      applyTrade(empty, { ...spy, allowFractional: false, shares: 1, side: "sell" })
    ).toEqual({ error: "insufficient_shares", ok: false });
  });

  it("allows fractional shares only when the class allows them", () => {
    expect(
      applyTrade(empty, { ...spy, allowFractional: false, shares: 0.5, side: "buy" })
    ).toEqual({ error: "whole_shares_only", ok: false });

    const result = applyTrade(empty, {
      ...spy,
      allowFractional: true,
      priceCents: 68_942,
      shares: 0.125,
      side: "buy",
    });
    expect(result).toMatchObject({ amountCents: 8_618, ok: true, quantityUnits: 1_250 });
  });

  it("rejects bad quantities and prices", () => {
    expect(applyTrade(empty, { ...spy, allowFractional: true, shares: 0, side: "buy" })).toEqual({
      error: "invalid_quantity",
      ok: false,
    });
    expect(
      applyTrade(empty, { ...spy, allowFractional: true, priceCents: 0, shares: 1, side: "buy" })
    ).toEqual({ error: "invalid_price", ok: false });
  });

  it("values a portfolio at current prices", () => {
    const bought = applyTrade(empty, { ...spy, allowFractional: false, shares: 2, side: "buy" });
    if (!bought.ok) throw new Error("buy failed");

    expect(portfolioValueCents(bought.state, { SPY: 12_500 })).toBe(80_000 + 25_000);
  });
});

describe("allocation targets", () => {
  it("accepts the five categories as whole numbers 0–100", () => {
    expect(validateAllocationTargets(defaultAllocationTargets)).toEqual(defaultAllocationTargets);
  });

  it("rejects unknown, missing, duplicate, or out-of-range values", () => {
    expect(validateAllocationTargets([{ name: "Crypto", value: 10 }])).toBeNull();
    expect(validateAllocationTargets(defaultAllocationTargets.slice(1))).toBeNull();
    expect(
      validateAllocationTargets([...defaultAllocationTargets.slice(1), defaultAllocationTargets[1]])
    ).toBeNull();
    expect(
      validateAllocationTargets(
        defaultAllocationTargets.map((target, index) => (index === 0 ? { ...target, value: 101 } : target))
      )
    ).toBeNull();
    expect(validateAllocationTargets("nope")).toBeNull();
  });
});
