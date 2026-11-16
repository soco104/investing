import { describe, expect, it } from "vitest";

import { cleanReport, debriefMessage, debriefPrompts, debriefRubric, MAX_REPORT } from "@/lib/debriefs";

describe("debrief rubric and prompts", () => {
  it("is worth 10 points and visible to students", () => {
    expect(debriefRubric.reduce((sum, rule) => sum + rule.points, 0)).toBe(10);
    expect(debriefRubric.every((rule) => rule.visibleToStudents)).toBe(true);
  });

  it("asks simpler questions for grades 6-8", () => {
    const younger = debriefPrompts(7, "expense");
    const older = debriefPrompts(10, "expense");

    expect(younger).toHaveLength(3);
    expect(older).toHaveLength(3);
    expect(older.join(" ")).toContain("borrow");
    expect(younger.join(" ")).not.toContain("borrow");
    expect(debriefPrompts(null, "expense")).toEqual(younger);
    expect(debriefPrompts(11, "windfall")[0]).toContain("receive");
  });
});

describe("the student's Inbox message", () => {
  const base = {
    description: "Your car failed inspection.",
    dueAt: "2026-11-20T23:59:59.000Z",
    percentOfStartingCash: 8,
    prompts: ["One?", "Two?"],
    title: "Car repair",
  };

  it("says what it cost and where their cash ended up", () => {
    const text = debriefMessage({ ...base, amountCents: -8_000, capped: false, cashAfterCents: 92_000, cashBeforeCents: 100_000 });

    expect(text).toContain("Life event: Car repair.");
    expect(text).toContain("It cost you $80.00 (8% of your starting cash).");
    expect(text).toContain("from $1,000.00 to $920.00");
    expect(text).toContain("1. One?");
    expect(text).toContain("2. Two?");
    expect(text).toMatch(/by \w+day, November 20/);
  });

  it("explains a capped bill and a negative balance", () => {
    expect(debriefMessage({ ...base, amountCents: -3_000, capped: true, cashAfterCents: 0, cashBeforeCents: 3_000 })).toContain(
      "you only had $30.00, so it took $30.00"
    );
    expect(debriefMessage({ ...base, amountCents: -8_000, capped: false, cashAfterCents: -2_000, cashBeforeCents: 6_000 })).toContain(
      "below $0"
    );
  });

  it("describes a windfall", () => {
    expect(debriefMessage({ ...base, amountCents: 8_000, capped: false, cashAfterCents: 108_000, cashBeforeCents: 100_000, dueAt: null })).toContain(
      "You received $80.00"
    );
  });
});

describe("reports", () => {
  it("must have text and fit the limit", () => {
    expect(cleanReport("  ")).toEqual({ error: "Write your debrief first." });
    expect(cleanReport(" My answer ")).toEqual({ report: "My answer" });
    expect("error" in cleanReport("x".repeat(MAX_REPORT + 1))).toBe(true);
  });
});
