/**
 * Learning quest rules, as pure functions (no database). Used by the server
 * (lib/server/quests.ts) and covered by tests/quest-rules.test.ts.
 */

export type QuestCriterion = {
  id: string;
  label: string;
  points: number;
  visibleToStudents: boolean;
};

export type QuestInput = {
  criteria: QuestCriterion[];
  marketMode: "none" | "watchlist" | "scenario";
  marketSymbols: string;
  marketWindow: string;
  objective: string;
  requireReflection: boolean;
  scoreVisibility: "hidden" | "summary" | "full";
  title: string;
};

export const MAX_TITLE = 120;
export const MAX_OBJECTIVE = 2_000;
export const MAX_REFLECTION = 5_000;
export const MAX_COMMENT = 1_000;
export const MAX_CRITERIA = 12;

const marketModes = ["none", "watchlist", "scenario"] as const;
const visibilities = ["hidden", "summary", "full"] as const;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Checks and cleans a quest from the Quest Studio or an import. Returns the
 * clean quest, or an error message a teacher can act on.
 */
export function normalizeQuest(raw: unknown): { error: string } | { quest: QuestInput } {
  if (!raw || typeof raw !== "object") return { error: "A quest must be an object." };

  const value = raw as Record<string, unknown>;
  const title = text(value.title);

  if (!title) return { error: "Give the quest a title." };
  if (title.length > MAX_TITLE) return { error: `Keep the title under ${MAX_TITLE} characters.` };

  const objective = text(value.objective);
  if (objective.length > MAX_OBJECTIVE) {
    return { error: `Keep the objective under ${MAX_OBJECTIVE} characters.` };
  }

  const rawCriteria = Array.isArray(value.criteria) ? value.criteria : [];
  if (rawCriteria.length > MAX_CRITERIA) {
    return { error: `A quest can have up to ${MAX_CRITERIA} scoring rules.` };
  }

  const criteria: QuestCriterion[] = [];
  for (const [index, item] of rawCriteria.entries()) {
    const rule = (item ?? {}) as Record<string, unknown>;
    const label = text(rule.label);
    const points = Number(rule.points);

    if (!label) return { error: `Scoring rule ${index + 1} needs a description.` };
    if (!Number.isInteger(points) || points < 0 || points > 1_000) {
      return { error: `Scoring rule ${index + 1} needs whole points from 0 to 1000.` };
    }

    criteria.push({
      id: text(rule.id) || `rule-${index + 1}`,
      label: label.slice(0, 200),
      points,
      visibleToStudents: rule.visibleToStudents === true,
    });
  }

  const marketMode = marketModes.find((mode) => mode === value.marketMode) ?? "none";
  const scoreVisibility = visibilities.find((mode) => mode === value.scoreVisibility) ?? "hidden";

  return {
    quest: {
      criteria,
      marketMode,
      marketSymbols: text(value.marketSymbols).slice(0, 200),
      marketWindow: text(value.marketWindow).slice(0, 100),
      objective,
      requireReflection: value.requireReflection !== false,
      scoreVisibility,
      title,
    },
  };
}

/** Before the due date (or with no due date) a submission can be edited. */
export function canEditSubmission(dueAt: string | null, now = new Date()) {
  return dueAt === null || now.getTime() <= new Date(dueAt).getTime();
}

/**
 * What a student sees of the scoring rules: only the rules marked visible,
 * and nothing at all when the quest's score visibility is "hidden".
 */
export function studentCriteria(quest: Pick<QuestInput, "criteria" | "scoreVisibility">) {
  if (quest.scoreVisibility === "hidden") return [];
  return quest.criteria.filter((rule) => rule.visibleToStudents);
}

/**
 * A due date typed as YYYY-MM-DD means the end of that day (local to the
 * server; 23:59:59). Returns null for "no due date", or an error.
 */
export function parseDueDate(value: unknown): { dueAt: Date | null } | { error: string } {
  if (value === null || value === undefined || value === "") return { dueAt: null };
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: "Use a due date like 2026-12-01." };
  }

  const dueAt = new Date(`${value}T23:59:59`);
  return Number.isNaN(dueAt.getTime()) ? { error: "That due date isn't a real date." } : { dueAt };
}
