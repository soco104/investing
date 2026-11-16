/**
 * Life event debriefs (v0.2.18). When a teacher plays a life event card with
 * "Require a debrief", each student it hit gets an Inbox message explaining
 * what happened to them, writes a short report, and the teacher grades it
 * with a rubric. Pure rules only; see lib/server/debriefs.ts.
 *
 * The grade works like quest grades (v0.2.15): a draft until released, and
 * the student only ever gets a read-only report.
 */

import type { QuestCriterion } from "@/lib/quest-rules";

export const MAX_REPORT = 4_000;

/** The default debrief rubric (10 points). Every rule is shown to students. */
export const debriefRubric: QuestCriterion[] = [
  { id: "impact", label: "Explains what happened and how it affected their money", points: 4, visibleToStudents: true },
  { id: "evidence", label: "Uses evidence from their own portfolio", points: 3, visibleToStudents: true },
  { id: "plan", label: "Makes a realistic plan for the next surprise", points: 3, visibleToStudents: true },
];

/** The questions the student answers. Simpler wording for grades 6-8. */
export function debriefPrompts(gradeLevel: number | null, kind: "expense" | "windfall") {
  const older = typeof gradeLevel === "number" && gradeLevel >= 9;

  if (kind === "windfall") {
    return older
      ? [
          "What did you receive, and how did it change your portfolio?",
          "How did you decide between spending, saving and investing it? Use numbers from your portfolio.",
          "Does a one-time windfall change your long-term plan? Why or why not?",
        ]
      : [
          "What happened, and how much money did you get?",
          "What did you do with it, or what will you do? Why?",
          "What is one smart way to use surprise money next time?",
        ];
  }

  return older
    ? [
        "What happened, and how did it affect your cash and investments? Use numbers from your portfolio.",
        "Did you have enough cash to cover it? If not, what would you sell or borrow, and what would that cost you?",
        "What will you change so the next surprise hurts less (emergency fund, how much you keep in cash)?",
      ]
    : [
        "What happened, and how much did it cost you?",
        "Did you have enough cash to pay for it? How did it feel?",
        "What is one thing you will do to be ready for the next surprise?",
      ];
}

const money = (cents: number) =>
  `${cents < 0 ? "-" : ""}$${(Math.abs(cents) / 100).toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;

/** The Inbox message a student gets, about what happened to them. */
export function debriefMessage(input: {
  amountCents: number;
  capped: boolean;
  cashAfterCents: number;
  cashBeforeCents: number;
  description: string;
  dueAt: string | null;
  percentOfStartingCash: number;
  prompts: string[];
  title: string;
}) {
  const lines = [`Life event: ${input.title}. ${input.description}`];

  if (input.amountCents >= 0) {
    lines.push(`You received ${money(input.amountCents)} (${input.percentOfStartingCash}% of your starting cash).`);
  } else if (input.capped) {
    lines.push(
      `It would have cost ${input.percentOfStartingCash}% of your starting cash, but you only had ${money(input.cashBeforeCents)}, so it took ${money(-input.amountCents)}.`
    );
  } else {
    lines.push(`It cost you ${money(-input.amountCents)} (${input.percentOfStartingCash}% of your starting cash).`);
  }

  lines.push(`Your cash went from ${money(input.cashBeforeCents)} to ${money(input.cashAfterCents)}.`);

  if (input.cashAfterCents < 0) {
    lines.push("Your cash is now below $0. Think about which investments you would sell to get back above zero.");
  }

  const due = input.dueAt
    ? ` by ${new Date(input.dueAt).toLocaleDateString("en-US", { day: "numeric", month: "long", weekday: "long" })}`
    : "";

  lines.push(
    `Please write a short debrief on your Market page${due}. Answer these questions:`,
    ...input.prompts.map((prompt, index) => `${index + 1}. ${prompt}`)
  );

  return lines.join("\n");
}

export function cleanReport(value: unknown): { error: string } | { report: string } {
  const report = typeof value === "string" ? value.trim() : "";

  if (!report) return { error: "Write your debrief first." };
  if (report.length > MAX_REPORT) return { error: `Keep your debrief under ${MAX_REPORT} characters.` };
  return { report };
}
