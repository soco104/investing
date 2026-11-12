import { describe, expect, it } from "vitest";

import {
  canEditSubmission,
  normalizeQuest,
  parseDueDate,
  studentCriteria,
  type QuestCriterion,
} from "@/lib/quest-rules";

const rules: QuestCriterion[] = [
  { id: "a", label: "Explains risk", points: 40, visibleToStudents: true },
  { id: "b", label: "Teacher-only check", points: 30, visibleToStudents: false },
];

describe("normalizeQuest", () => {
  it("cleans a valid quest and fills defaults", () => {
    const result = normalizeQuest({ criteria: rules, title: "  Ride out a drop  " });
    expect(result).toEqual({
      quest: {
        criteria: rules,
        marketMode: "none",
        marketSymbols: "",
        marketWindow: "",
        objective: "",
        requireReflection: true,
        scoreVisibility: "hidden",
        title: "Ride out a drop",
      },
    });
  });

  it("rejects a missing title, bad points, and too many rules", () => {
    expect(normalizeQuest({ title: " " })).toEqual({ error: "Give the quest a title." });
    expect(
      normalizeQuest({ criteria: [{ label: "x", points: 1.5 }], title: "T" })
    ).toEqual({ error: "Scoring rule 1 needs whole points from 0 to 1000." });
    expect(normalizeQuest({ criteria: [{ label: "", points: 5 }], title: "T" })).toEqual({
      error: "Scoring rule 1 needs a description.",
    });
    expect(
      normalizeQuest({ criteria: Array.from({ length: 13 }, () => ({ label: "x", points: 1 })), title: "T" })
    ).toEqual({ error: "A quest can have up to 12 scoring rules." });
    expect(normalizeQuest("nope")).toEqual({ error: "A quest must be an object." });
  });

  it("ignores unknown modes instead of trusting them", () => {
    const result = normalizeQuest({ marketMode: "hack", scoreVisibility: "all", title: "T" });
    expect(result).toMatchObject({ quest: { marketMode: "none", scoreVisibility: "hidden" } });
  });
});

describe("canEditSubmission", () => {
  const now = new Date("2026-12-01T12:00:00Z");

  it("allows edits with no due date or before it, and not after", () => {
    expect(canEditSubmission(null, now)).toBe(true);
    expect(canEditSubmission("2026-12-01T12:00:00Z", now)).toBe(true);
    expect(canEditSubmission("2026-12-02T00:00:00Z", now)).toBe(true);
    expect(canEditSubmission("2026-11-30T23:59:59Z", now)).toBe(false);
  });
});

describe("studentCriteria", () => {
  it("shows only visible rules, and none when scores are hidden", () => {
    expect(studentCriteria({ criteria: rules, scoreVisibility: "summary" })).toEqual([rules[0]]);
    expect(studentCriteria({ criteria: rules, scoreVisibility: "full" })).toEqual([rules[0]]);
    expect(studentCriteria({ criteria: rules, scoreVisibility: "hidden" })).toEqual([]);
  });
});

describe("parseDueDate", () => {
  it("treats a date as the end of that day; empty means no due date", () => {
    const result = parseDueDate("2026-12-01");
    expect("dueAt" in result && result.dueAt?.getHours()).toBe(23);
    expect(parseDueDate("")).toEqual({ dueAt: null });
    expect(parseDueDate(undefined)).toEqual({ dueAt: null });
    expect(parseDueDate("12/01/2026")).toEqual({ error: "Use a due date like 2026-12-01." });
    expect(parseDueDate("2026-13-45")).toEqual({ error: "That due date isn't a real date." });
  });
});
