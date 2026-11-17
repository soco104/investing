import { describe, expect, it } from "vitest";

import {
  allowsDebt,
  eventAmountCents,
  findCard,
  isValidPercent,
  lifeEventDeck,
  pickRandom,
} from "@/lib/life-events";

describe("the life event deck", () => {
  it("has unique ids and sensible percents", () => {
    const ids = new Set(lifeEventDeck.map((card) => card.id));

    expect(ids.size).toBe(lifeEventDeck.length);
    expect(lifeEventDeck.every((card) => isValidPercent(card.percentOfStartingCash))).toBe(true);
    expect(lifeEventDeck.some((card) => card.kind === "windfall")).toBe(true);
    expect(lifeEventDeck.some((card) => card.kind === "expense")).toBe(true);
    expect(findCard("car-repair")?.title).toBe("Car repair");
    expect(findCard("nope")).toBeNull();
  });

  it("only accepts whole percents from 1 to 100", () => {
    expect(isValidPercent(1)).toBe(true);
    expect(isValidPercent(100)).toBe(true);
    expect(isValidPercent(0)).toBe(false);
    expect(isValidPercent(101)).toBe(false);
    expect(isValidPercent(2.5)).toBe(false);
    expect(isValidPercent("5")).toBe(false);
  });
});

describe("what a card does to a student", () => {
  it("takes a percent of starting cash, not current cash", () => {
    const result = eventAmountCents({ cashCents: 50_000, debtAllowed: true, kind: "expense", percentOfStartingCash: 8, startingCashCents: 100_000 });
    expect(result).toEqual({ amountCents: -8_000, capped: false });
  });

  it("lets grades 9-12 go into debt, and stops younger grades at $0", () => {
    const base = { kind: "expense" as const, percentOfStartingCash: 10, startingCashCents: 100_000 };

    expect(eventAmountCents({ ...base, cashCents: 4_000, debtAllowed: true })).toEqual({ amountCents: -10_000, capped: false });
    expect(eventAmountCents({ ...base, cashCents: 4_000, debtAllowed: false })).toEqual({ amountCents: -4_000, capped: true });
    expect(eventAmountCents({ ...base, cashCents: 0, debtAllowed: false })).toEqual({ amountCents: 0, capped: true });
    expect(eventAmountCents({ ...base, cashCents: -500, debtAllowed: false })).toEqual({ amountCents: 0, capped: true });
    expect(allowsDebt(9)).toBe(true);
    expect(allowsDebt(12)).toBe(true);
    expect(allowsDebt(8)).toBe(false);
    expect(allowsDebt(null)).toBe(false);
  });

  it("windfalls always pay in full", () => {
    expect(eventAmountCents({ cashCents: 0, debtAllowed: false, kind: "windfall", percentOfStartingCash: 8, startingCashCents: 100_000 })).toEqual({
      amountCents: 8_000,
      capped: false,
    });
  });
});

describe("picking a random handful", () => {
  it("picks the asked number, no repeats, the same for the same seed", () => {
    const students = ["a", "b", "c", "d", "e", "f"];
    const first = pickRandom(students, 3, "seed-1");

    expect(first).toHaveLength(3);
    expect(new Set(first).size).toBe(3);
    expect(pickRandom(students, 3, "seed-1")).toEqual(first);
    expect(pickRandom(students, 10, "seed-1")).toHaveLength(6);
    expect(pickRandom(students, 0, "seed-1")).toEqual([]);
  });
});
