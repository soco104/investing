import { cleanReport, debriefMessage, debriefPrompts, debriefRubric } from "@/lib/debriefs";
import {
  answerChangedSinceGrading,
  classAveragePercent,
  cleanFeedback,
  isBeforeDue,
  scoreSubmission,
  studentGradeReport,
  type RuleScore,
} from "@/lib/quest-grading";
import { canEditSubmission } from "@/lib/quest-rules";
import type { AuthenticatedUser } from "@/lib/server/auth";
import { sendMessage, startConversation } from "@/lib/server/messages";
import { moderateTextMessage } from "@/lib/server/moderation";
import { PortfolioError } from "@/lib/server/portfolios-errors";
import { defaultDistrictId, getSql, hasProductionDatabase, id } from "@/lib/server/repository";
import { requireControllable } from "@/lib/server/teacher-market";

/**
 * Life event debriefs (v0.2.18): event → Inbox message → student report →
 * teacher grade. The teacher chooses per event whether a debrief is needed,
 * and its due date. Grading works like quest grading: draft until released;
 * students only see a read-only report.
 */

const actorId = (user: AuthenticatedUser) => user.actingAdmin?.id ?? user.id;

function requireDatabase() {
  if (!hasProductionDatabase()) throw new PortfolioError("Debriefs need a database (DATABASE_URL).", 503);
}

type Hit = {
  amountCents: number;
  capped: boolean;
  cashAfterCents: number;
  cashBeforeCents: number;
  email: string;
  studentUserId: string;
};

/**
 * Called after a card is played with "Require a debrief": one debrief per
 * student hit, and an Inbox message to each. A message that can't be sent
 * (say, the filter refuses it) doesn't undo the event; the debrief still
 * shows on the student's Market page.
 */
export async function createDebriefs(
  user: AuthenticatedUser,
  input: {
    description: string;
    dueAt: Date | null;
    eventId: string;
    gradeLevel: number | null;
    hits: Hit[];
    kind: "expense" | "windfall";
    percentOfStartingCash: number;
    title: string;
  }
) {
  const sql = getSql();
  const prompts = debriefPrompts(input.gradeLevel, input.kind);
  let messagesSent = 0;

  await sql`
    update life_events set require_debrief = true, debrief_due_at = ${input.dueAt} where id = ${input.eventId}
  `;

  for (const hit of input.hits) {
    await sql`
      insert into life_event_debriefs (
        id, event_id, student_user_id, amount_cents, capped, cash_before_cents, cash_after_cents, prompts_json
      )
      values (
        ${id("debrief")}, ${input.eventId}, ${hit.studentUserId}, ${hit.amountCents}, ${hit.capped},
        ${hit.cashBeforeCents}, ${hit.cashAfterCents}, ${JSON.stringify(prompts)}
      )
      on conflict (event_id, student_user_id) do nothing
    `;

    try {
      const { conversationId } = await startConversation(user, hit.email);

      await sendMessage(
        user,
        conversationId,
        debriefMessage({
          amountCents: hit.amountCents,
          capped: hit.capped,
          cashAfterCents: hit.cashAfterCents,
          cashBeforeCents: hit.cashBeforeCents,
          description: input.description,
          dueAt: input.dueAt ? input.dueAt.toISOString() : null,
          percentOfStartingCash: input.percentOfStartingCash,
          prompts,
          title: input.title,
        })
      );
      messagesSent += 1;
    } catch (error) {
      console.error("Debrief message could not be sent.", error);
    }
  }

  return { debriefs: input.hits.length, messagesSent };
}

/** On undo: drop debriefs nobody has written yet; keep any already submitted. */
export async function removeUnwrittenDebriefs(eventId: string) {
  await getSql()`delete from life_event_debriefs where event_id = ${eventId} and submitted_at is null`;
}

type DebriefRow = {
  amount_cents: string;
  capped: boolean;
  cash_after_cents: string;
  cash_before_cents: string;
  debrief_due_at: Date | null;
  description: string;
  email: string;
  event_id: string;
  feedback: string;
  first_name: string;
  grade_status: string;
  graded_at: Date | null;
  graded_by: string | null;
  id: string;
  last_name: string;
  max_points: number | null;
  played_at: Date;
  prompts_json: string;
  released_at: Date | null;
  report: string | null;
  scores_json: string | null;
  student_user_id: string;
  submitted_at: Date | null;
  title: string;
  total_points: number | null;
  undone_at: Date | null;
  updated_at: Date | null;
};

const debriefColumns = (sql: ReturnType<typeof getSql>) => sql`
  d.id, d.event_id, d.student_user_id, d.amount_cents, d.capped, d.cash_before_cents, d.cash_after_cents,
  d.prompts_json, d.report, d.submitted_at, d.updated_at, d.scores_json, d.total_points, d.max_points,
  d.feedback, d.grade_status, d.graded_at, d.released_at,
  e.title, e.description, e.played_at, e.undone_at, e.debrief_due_at,
  u.email, u.first_name, u.last_name,
  (select g.first_name || ' ' || g.last_name from app_users g where g.id = d.graded_by_user_id) as graded_by
`;

const iso = (value: Date | null) => (value ? new Date(value).toISOString() : null);

function gradeOf(row: DebriefRow) {
  if (row.grade_status === "none" || row.total_points === null || row.max_points === null) return null;

  return {
    feedback: row.feedback,
    gradedAt: iso(row.graded_at) as string,
    gradedBy: row.graded_by?.trim() ?? "",
    maxPoints: row.max_points,
    releasedAt: iso(row.released_at),
    scores: JSON.parse(row.scores_json ?? "[]") as RuleScore[],
    status: row.grade_status === "released" ? ("released" as const) : ("draft" as const),
    totalPoints: row.total_points,
  };
}

/** A student's debriefs (for their Market page), keyed by event id. */
export async function studentDebriefs(userId: string) {
  const sql = getSql();
  const rows = await sql<DebriefRow[]>`
    select ${debriefColumns(sql)}
    from life_event_debriefs d
    join life_events e on e.id = d.event_id
    join app_users u on u.id = d.student_user_id
    where d.student_user_id = ${userId}
    order by e.played_at desc
    limit 20
  `;
  const now = new Date();

  return new Map(
    rows.map((row) => {
      const dueAt = iso(row.debrief_due_at);

      return [
        row.event_id,
        {
          canEdit: canEditSubmission(dueAt, now),
          dueAt,
          grade: studentGradeReport({ criteria: debriefRubric, scoreVisibility: "full" }, gradeOf(row)),
          id: row.id,
          prompts: JSON.parse(row.prompts_json) as string[],
          report: row.report ?? "",
          submittedAt: iso(row.submitted_at),
        },
      ];
    })
  );
}

/** The student writes or edits their report, until the due date. */
export async function submitDebrief(user: AuthenticatedUser, debriefId: string, rawReport: unknown) {
  requireDatabase();

  const cleaned = cleanReport(rawReport);
  if ("error" in cleaned) throw new PortfolioError(cleaned.error, 400);

  const sql = getSql();
  const [row] = await sql<Array<{ debrief_due_at: Date | null; submitted_at: Date | null; title: string; undone_at: Date | null }>>`
    select d.submitted_at, e.debrief_due_at, e.title, e.undone_at
    from life_event_debriefs d join life_events e on e.id = d.event_id
    where d.id = ${debriefId} and d.student_user_id = ${user.id}
  `;

  if (!row) throw new PortfolioError("That debrief wasn't found.", 404);
  if (!canEditSubmission(iso(row.debrief_due_at))) {
    throw new PortfolioError("The due date has passed, so this debrief can't be changed.", 409);
  }

  if (moderateTextMessage(cleaned.report).profanityDetected) {
    throw new PortfolioError("Your debrief has language that isn't allowed. Rewrite it using respectful classroom language.", 400);
  }

  const now = new Date();

  await sql`
    update life_event_debriefs set report = ${cleaned.report}, updated_at = ${now},
      submitted_at = coalesce(submitted_at, ${now})
    where id = ${debriefId}
  `;

  return { firstTime: row.submitted_at === null, title: row.title };
}

/** Teachers: an event's debriefs, with each student's outcome and grade. */
export async function eventDebriefs(user: AuthenticatedUser, eventId: string) {
  requireDatabase();

  const sql = getSql();
  const [event] = await sql<Array<{ class_name: string; debrief_due_at: Date | null; title: string }>>`
    select class_name, title, debrief_due_at from life_events where id = ${eventId} and district_id = ${defaultDistrictId}
  `;

  if (!event) throw new PortfolioError("That life event wasn't found.", 404);
  await requireControllable(user, event.class_name);

  const rows = await sql<DebriefRow[]>`
    select ${debriefColumns(sql)}
    from life_event_debriefs d
    join life_events e on e.id = d.event_id
    join app_users u on u.id = d.student_user_id
    where d.event_id = ${eventId}
    order by u.last_name, u.first_name
  `;
  const dueAt = iso(event.debrief_due_at);
  const grades = rows.flatMap((row) => {
    const grade = gradeOf(row);
    return grade ? [grade] : [];
  });

  return {
    averagePercent: classAveragePercent(grades),
    beforeDue: isBeforeDue(dueAt),
    className: event.class_name,
    criteria: debriefRubric.map(({ id: ruleId, label, points }) => ({ id: ruleId, label, points })),
    draftCount: grades.filter((grade) => grade.status === "draft").length,
    dueAt,
    students: rows.map((row) => {
      const grade = gradeOf(row);

      return {
        amountCents: Number(row.amount_cents),
        capped: row.capped,
        cashAfterCents: Number(row.cash_after_cents),
        debriefId: row.id,
        email: row.email,
        grade: grade
          ? { ...grade, answerChanged: answerChangedSinceGrading(iso(row.updated_at), grade.gradedAt) }
          : null,
        name: `${row.first_name} ${row.last_name}`.trim(),
        report: row.report ?? "",
        status: grade ? (grade.status === "released" ? "released" : "graded") : row.submitted_at ? "submitted" : "not_submitted",
        submittedAt: iso(row.submitted_at),
      };
    }),
    summary: {
      capped: rows.filter((row) => row.capped).length,
      inDebt: rows.filter((row) => Number(row.cash_after_cents) < 0).length,
      submitted: rows.filter((row) => row.submitted_at).length,
      total: rows.length,
    },
    title: event.title,
  };
}

async function loadGradableDebrief(user: AuthenticatedUser, debriefId: string) {
  requireDatabase();

  const [row] = await getSql()<
    Array<{ class_name: string; debrief_due_at: Date | null; event_id: string; grade_status: string; student_name: string; title: string; total_points: number | null }>
  >`
    select e.class_name, e.debrief_due_at, e.title, d.event_id, d.grade_status, d.total_points,
      u.first_name || ' ' || u.last_name as student_name
    from life_event_debriefs d join life_events e on e.id = d.event_id join app_users u on u.id = d.student_user_id
    where d.id = ${debriefId}
  `;

  if (!row) throw new PortfolioError("That debrief wasn't found.", 404);
  await requireControllable(user, row.class_name);
  return row;
}

/** Save a grade. A released grade stays released; otherwise it is a draft. */
export async function gradeDebrief(
  user: AuthenticatedUser,
  input: { confirmEarly?: boolean; debriefId: string; feedback?: unknown; scores?: unknown }
) {
  const row = await loadGradableDebrief(user, input.debriefId);

  if (isBeforeDue(iso(row.debrief_due_at)) && !input.confirmEarly) {
    throw new PortfolioError(
      "The due date hasn't passed, so the student can still change their debrief. Tick \"Grade before the due date\" to grade it anyway.",
      409
    );
  }

  const scored = scoreSubmission(debriefRubric, input.scores);
  if ("error" in scored) throw new PortfolioError(scored.error, 400);

  const cleaned = cleanFeedback(input.feedback);
  if ("error" in cleaned) throw new PortfolioError(cleaned.error, 400);

  const status = row.grade_status === "released" ? "released" : "draft";

  await getSql()`
    update life_event_debriefs set scores_json = ${JSON.stringify(scored.scores)}, total_points = ${scored.totalPoints},
      max_points = ${scored.maxPoints}, feedback = ${cleaned.feedback}, grade_status = ${status},
      graded_by_user_id = ${actorId(user)}, graded_at = ${new Date()}
    where id = ${input.debriefId}
  `;

  return {
    changed: row.grade_status !== "none",
    className: row.class_name,
    previousTotal: row.total_points,
    status,
    studentName: row.student_name.trim(),
    title: row.title,
    totalPoints: scored.totalPoints,
  };
}

/** Release one draft grade, or every draft for the event. */
export async function releaseDebriefGrades(user: AuthenticatedUser, input: { debriefId?: string | null; eventId?: string | null }) {
  requireDatabase();

  const sql = getSql();
  let eventId = input.eventId ?? null;

  if (input.debriefId) eventId = (await loadGradableDebrief(user, input.debriefId)).event_id;
  if (!eventId) throw new PortfolioError("Choose an event.", 400);

  const [event] = await sql<Array<{ class_name: string; title: string }>>`select class_name, title from life_events where id = ${eventId}`;

  if (!event) throw new PortfolioError("That life event wasn't found.", 404);
  await requireControllable(user, event.class_name);

  const released = await sql`
    update life_event_debriefs set grade_status = 'released', released_at = ${new Date()}
    where event_id = ${eventId} and grade_status = 'draft'
      and (${input.debriefId ?? null}::text is null or id = ${input.debriefId ?? null})
    returning id
  `;

  if (released.length === 0) throw new PortfolioError("There are no draft grades to release.", 409);

  return { className: event.class_name, released: released.length, title: event.title };
}
