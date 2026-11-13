/**
 * Grading quest submissions with the quest's rubric (v0.2.15). Pure
 * functions, no database; used by lib/server/quest-grading.ts and covered by
 * tests/quest-grading.test.ts.
 *
 * A grade gives points for each scoring rule (0 up to the rule's maximum),
 * plus optional feedback. It is saved as a draft the student can't see until
 * a teacher releases it. Students never get the grading view: they get a
 * report built by studentGradeReport().
 */

import type { QuestCriterion, QuestInput } from "@/lib/quest-rules";

export const MAX_FEEDBACK = 2_000;

/** One rule's score, kept with the rule's wording and maximum at grading time. */
export type RuleScore = { id: string; label: string; max: number; points: number };

export type GradeStatus = "draft" | "released";

export type Grade = {
  feedback: string;
  gradedAt: string; // ISO
  maxPoints: number;
  scores: RuleScore[];
  status: GradeStatus;
  totalPoints: number;
};

/**
 * Checks the points a teacher entered against the quest's scoring rules.
 * Every rule needs whole points from 0 to its maximum.
 */
export function scoreSubmission(
  criteria: QuestCriterion[],
  rawScores: unknown
): { error: string } | { maxPoints: number; scores: RuleScore[]; totalPoints: number } {
  const entered = rawScores && typeof rawScores === "object" ? (rawScores as Record<string, unknown>) : {};
  const scores: RuleScore[] = [];

  for (const rule of criteria) {
    const value = entered[rule.id];

    if (value === undefined || value === null || value === "") {
      return { error: `Give points for "${rule.label}".` };
    }

    const points = Number(value);

    if (!Number.isInteger(points) || points < 0 || points > rule.points) {
      return { error: `"${rule.label}" needs whole points from 0 to ${rule.points}.` };
    }

    scores.push({ id: rule.id, label: rule.label, max: rule.points, points });
  }

  return {
    maxPoints: scores.reduce((total, score) => total + score.max, 0),
    scores,
    totalPoints: scores.reduce((total, score) => total + score.points, 0),
  };
}

export function cleanFeedback(value: unknown): { error: string } | { feedback: string } {
  const feedback = typeof value === "string" ? value.trim() : "";

  if (feedback.length > MAX_FEEDBACK) return { error: `Keep feedback under ${MAX_FEEDBACK} characters.` };
  return { feedback };
}

/** Before the due date a student can still change their answer. */
export function isBeforeDue(dueAt: string | null, now = new Date()) {
  return dueAt !== null && now.getTime() <= new Date(dueAt).getTime();
}

/** Did the student edit their answer after it was graded? */
export function answerChangedSinceGrading(submissionUpdatedAt: string | null, gradedAt: string) {
  return submissionUpdatedAt !== null && new Date(submissionUpdatedAt).getTime() > new Date(gradedAt).getTime();
}

export type StudentStatus = "not_submitted" | "submitted" | "graded" | "released";

/** Where a student stands on one assignment, for the teacher's list. */
export function studentStatus(hasSubmission: boolean, grade: Pick<Grade, "status"> | null): StudentStatus {
  if (grade) return grade.status === "released" ? "released" : "graded";
  return hasSubmission ? "submitted" : "not_submitted";
}

export const statusLabels: Record<StudentStatus, string> = {
  graded: "Graded (draft)",
  not_submitted: "Not submitted",
  released: "Released",
  submitted: "Submitted",
};

/** Average of graded work as a percent (drafts included), or null if none can be averaged. */
export function classAveragePercent(grades: Array<Pick<Grade, "maxPoints" | "totalPoints">>) {
  const scored = grades.filter((grade) => grade.maxPoints > 0);

  if (scored.length === 0) return null;

  const total = scored.reduce((sum, grade) => sum + grade.totalPoints / grade.maxPoints, 0);
  return Math.round((total / scored.length) * 1000) / 10;
}

export type StudentGradeReport = {
  feedback: string;
  // Null when the quest hides scores from students.
  maxPoints: number | null;
  releasedAt: string | null;
  // Only the rules students are allowed to see, and only for "full" quests.
  rules: Array<{ label: string; max: number; points: number }>;
  totalPoints: number | null;
};

/**
 * The student's report on their grade: nothing until it is released, then
 * what the quest's score visibility allows.
 *
 * - "hidden": feedback only.
 * - "summary": feedback and the total.
 * - "full": feedback, the total, and points for each rule marked visible.
 */
export function studentGradeReport(
  quest: Pick<QuestInput, "criteria" | "scoreVisibility">,
  grade: (Grade & { releasedAt?: string | null }) | null
): StudentGradeReport | null {
  if (!grade || grade.status !== "released") return null;

  const showTotal = quest.scoreVisibility !== "hidden";
  const visibleIds = new Set(quest.criteria.filter((rule) => rule.visibleToStudents).map((rule) => rule.id));

  return {
    feedback: grade.feedback,
    maxPoints: showTotal ? grade.maxPoints : null,
    releasedAt: grade.releasedAt ?? null,
    rules:
      quest.scoreVisibility === "full"
        ? grade.scores
            .filter((score) => visibleIds.has(score.id))
            .map((score) => ({ label: score.label, max: score.max, points: score.points }))
        : [],
    totalPoints: showTotal ? grade.totalPoints : null,
  };
}
