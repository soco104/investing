import { describe, expect, it } from "vitest";

import {
  answerChangedSinceGrading,
  classAveragePercent,
  cleanFeedback,
  isBeforeDue,
  scoreSubmission,
  studentGradeReport,
  studentStatus,
  type Grade,
} from "@/lib/quest-grading";
import type { QuestCriterion } from "@/lib/quest-rules";

const criteria: QuestCriterion[] = [
  { id: "rule-1", label: "Explains the budget", points: 10, visibleToStudents: true },
  { id: "rule-2", label: "Uses evidence", points: 5, visibleToStudents: true },
  { id: "rule-3", label: "Teacher's judgement", points: 5, visibleToStudents: false },
];

describe("scoring a submission", () => {
  it("adds up the points for every rule", () => {
    const result = scoreSubmission(criteria, { "rule-1": 8, "rule-2": "5", "rule-3": 0 });

    expect(result).toMatchObject({ maxPoints: 20, totalPoints: 13 });
    expect("scores" in result && result.scores[0]).toEqual({ id: "rule-1", label: "Explains the budget", max: 10, points: 8 });
  });

  it("needs points for every rule", () => {
    expect(scoreSubmission(criteria, { "rule-1": 8 })).toEqual({ error: 'Give points for "Uses evidence".' });
    expect(scoreSubmission(criteria, null)).toHaveProperty("error");
  });

  it("refuses points above the maximum, below zero, or not whole", () => {
    expect(scoreSubmission(criteria, { "rule-1": 11, "rule-2": 1, "rule-3": 1 })).toHaveProperty("error");
    expect(scoreSubmission(criteria, { "rule-1": -1, "rule-2": 1, "rule-3": 1 })).toHaveProperty("error");
    expect(scoreSubmission(criteria, { "rule-1": 2.5, "rule-2": 1, "rule-3": 1 })).toHaveProperty("error");
    expect(scoreSubmission(criteria, { "rule-1": "lots", "rule-2": 1, "rule-3": 1 })).toHaveProperty("error");
  });

  it("allows a quest with no scoring rules (feedback only)", () => {
    expect(scoreSubmission([], {})).toEqual({ maxPoints: 0, scores: [], totalPoints: 0 });
  });

  it("limits feedback length", () => {
    expect(cleanFeedback("  Nice work.  ")).toEqual({ feedback: "Nice work." });
    expect(cleanFeedback(undefined)).toEqual({ feedback: "" });
    expect(cleanFeedback("x".repeat(2_001))).toHaveProperty("error");
  });
});

describe("timing", () => {
  const due = "2026-11-20T23:59:59.000Z";

  it("knows whether the due date has passed", () => {
    expect(isBeforeDue(due, new Date("2026-11-19T12:00:00Z"))).toBe(true);
    expect(isBeforeDue(due, new Date("2026-11-21T00:00:00Z"))).toBe(false);
    expect(isBeforeDue(null, new Date())).toBe(false); // no due date: never "early"
  });

  it("spots an answer edited after it was graded", () => {
    expect(answerChangedSinceGrading("2026-11-19T10:00:00Z", "2026-11-19T09:00:00Z")).toBe(true);
    expect(answerChangedSinceGrading("2026-11-19T08:00:00Z", "2026-11-19T09:00:00Z")).toBe(false);
    expect(answerChangedSinceGrading(null, "2026-11-19T09:00:00Z")).toBe(false);
  });
});

describe("status and averages", () => {
  it("shows where each student stands", () => {
    expect(studentStatus(false, null)).toBe("not_submitted");
    expect(studentStatus(true, null)).toBe("submitted");
    expect(studentStatus(true, { status: "draft" })).toBe("graded");
    expect(studentStatus(true, { status: "released" })).toBe("released");
    expect(studentStatus(false, { status: "draft" })).toBe("graded"); // a zero entered by hand
  });

  it("averages graded work as a percent", () => {
    expect(classAveragePercent([{ maxPoints: 20, totalPoints: 15 }, { maxPoints: 20, totalPoints: 10 }])).toBe(62.5);
    expect(classAveragePercent([])).toBeNull();
    expect(classAveragePercent([{ maxPoints: 0, totalPoints: 0 }])).toBeNull();
  });
});

describe("the student's grade report", () => {
  const scored = scoreSubmission(criteria, { "rule-1": 8, "rule-2": 4, "rule-3": 3 });
  if ("error" in scored) throw new Error(scored.error);
  const grade: Grade = { ...scored, feedback: "Clear budget.", gradedAt: "2026-11-21T10:00:00Z", status: "released" };

  it("shows nothing until the grade is released", () => {
    expect(studentGradeReport({ criteria, scoreVisibility: "full" }, { ...grade, status: "draft" })).toBeNull();
    expect(studentGradeReport({ criteria, scoreVisibility: "full" }, null)).toBeNull();
  });

  it("full: total, feedback, and only the rules students may see", () => {
    const report = studentGradeReport({ criteria, scoreVisibility: "full" }, grade);

    expect(report).toMatchObject({ feedback: "Clear budget.", maxPoints: 20, totalPoints: 15 });
    expect(report?.rules.map((rule) => rule.label)).toEqual(["Explains the budget", "Uses evidence"]);
    expect(JSON.stringify(report)).not.toContain("Teacher's judgement");
  });

  it("summary: total and feedback, no rule breakdown", () => {
    const report = studentGradeReport({ criteria, scoreVisibility: "summary" }, grade);

    expect(report).toMatchObject({ maxPoints: 20, rules: [], totalPoints: 15 });
  });

  it("hidden: feedback only", () => {
    const report = studentGradeReport({ criteria, scoreVisibility: "hidden" }, grade);

    expect(report).toMatchObject({ feedback: "Clear budget.", maxPoints: null, rules: [], totalPoints: null });
  });
});
