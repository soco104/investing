import {
  cleanFeedback,
  isBeforeDue,
  scoreSubmission,
  type Grade,
  type RuleScore,
} from "@/lib/quest-grading";
import type { QuestCriterion } from "@/lib/quest-rules";
import type { AuthenticatedUser } from "@/lib/server/auth";
import { PortfolioError as QuestError } from "@/lib/server/portfolios-errors";
import { getSql, hasProductionDatabase, id } from "@/lib/server/repository";

/**
 * Grading quest submissions (v0.2.15). The class's teachers grade; teachers
 * and admins can adjust a grade. Students never use this module's views:
 * they get a report built by studentGradeReport() in lib/quest-grading.ts.
 */

const isAdmin = (user: AuthenticatedUser) => user.role === "Admin";
const actorId = (user: AuthenticatedUser) => user.actingAdmin?.id ?? user.id;

export type GradeRow = {
  assignment_id: string;
  feedback: string;
  graded_at: Date;
  graded_by_name: string | null;
  max_points: number;
  released_at: Date | null;
  scores_json: string;
  status: string;
  student_user_id: string;
  total_points: number;
};

export function toGrade(row: GradeRow): Grade & { gradedBy: string; releasedAt: string | null } {
  return {
    feedback: row.feedback,
    gradedAt: new Date(row.graded_at).toISOString(),
    gradedBy: row.graded_by_name?.trim() ?? "",
    maxPoints: row.max_points,
    releasedAt: row.released_at ? new Date(row.released_at).toISOString() : null,
    scores: JSON.parse(row.scores_json) as RuleScore[],
    status: row.status === "released" ? "released" : "draft",
    totalPoints: row.total_points,
  };
}

/** Grades for some assignments, keyed by "assignmentId|studentUserId". */
export async function gradesFor(assignmentIds: string[], studentUserId?: string) {
  const grades = new Map<string, ReturnType<typeof toGrade>>();

  if (assignmentIds.length === 0) return grades;

  const sql = getSql();
  const rows = await sql<GradeRow[]>`
    select g.assignment_id, g.student_user_id, g.scores_json, g.total_points, g.max_points, g.feedback,
      g.status, g.graded_at, g.released_at,
      (select u.first_name || ' ' || u.last_name from app_users u where u.id = g.graded_by_user_id) as graded_by_name
    from quest_grades g
    where g.assignment_id = any(${assignmentIds})
      and (${studentUserId ?? null}::text is null or g.student_user_id = ${studentUserId ?? null})
  `;

  for (const row of rows) grades.set(`${row.assignment_id}|${row.student_user_id}`, toGrade(row));
  return grades;
}

/** The assignment, its quest's scoring rules, and whether this user may grade it. */
async function loadGradable(user: AuthenticatedUser, assignmentId: string) {
  if (!hasProductionDatabase()) throw new QuestError("Quests need a database (DATABASE_URL).", 503);

  const [row] = await getSql()<
    Array<{ class_name: string; criteria_json: string; due_at: Date | null; quest_id: string; title: string }>
  >`
    select a.class_name, a.due_at, q.id as quest_id, q.title, q.criteria_json
    from quest_assignments a join learning_quests q on q.id = a.quest_id
    where a.id = ${assignmentId}
  `;

  if (!row) throw new QuestError("That assignment wasn't found.", 404);

  const allowed = isAdmin(user) || (user.role === "Teacher" && user.classNames.includes(row.class_name));

  if (!allowed) throw new QuestError("Only the class's teachers and admins can grade this quest.", 403);

  return {
    className: row.class_name,
    criteria: JSON.parse(row.criteria_json) as QuestCriterion[],
    dueAt: row.due_at ? new Date(row.due_at).toISOString() : null,
    questId: row.quest_id,
    title: row.title,
  };
}

/**
 * Save a grade (new, or a change to an existing one). It stays a draft until
 * released; a grade that was already released stays released, so the student
 * sees the newest one. Grading before the due date needs confirmEarly.
 */
export async function saveGrade(
  user: AuthenticatedUser,
  input: { assignmentId: string; confirmEarly?: boolean; feedback?: unknown; scores?: unknown; studentEmail: string }
) {
  const assignment = await loadGradable(user, input.assignmentId);

  if (isBeforeDue(assignment.dueAt) && !input.confirmEarly) {
    throw new QuestError(
      "The due date hasn't passed, so the student can still change their answer. Tick \"Grade before the due date\" to grade it anyway.",
      409
    );
  }

  const scored = scoreSubmission(assignment.criteria, input.scores);
  if ("error" in scored) throw new QuestError(scored.error, 400);

  const cleaned = cleanFeedback(input.feedback);
  if ("error" in cleaned) throw new QuestError(cleaned.error, 400);

  const sql = getSql();
  const [student] = await sql<Array<{ id: string; name: string; submission_id: string | null }>>`
    select u.id, u.first_name || ' ' || u.last_name as name,
      (select s.id from quest_submissions s where s.assignment_id = ${input.assignmentId} and s.student_user_id = u.id) as submission_id
    from app_users u
    where lower(u.email) = ${input.studentEmail.trim().toLowerCase()}
      and exists (
        select 1 from role_assignments ra
        where ra.user_id = u.id and ra.role = 'Student' and ra.scope = ${assignment.className}
      )
  `;

  if (!student) throw new QuestError("That student isn't in this class.", 404);

  const now = new Date();
  const [before] = await sql<Array<{ status: string; total_points: number }>>`
    select status, total_points from quest_grades
    where assignment_id = ${input.assignmentId} and student_user_id = ${student.id}
  `;

  await sql`
    insert into quest_grades (
      id, assignment_id, student_user_id, submission_id, scores_json, total_points, max_points,
      feedback, status, graded_by_user_id, graded_at
    )
    values (
      ${id("quest-grade")}, ${input.assignmentId}, ${student.id}, ${student.submission_id},
      ${JSON.stringify(scored.scores)}, ${scored.totalPoints}, ${scored.maxPoints},
      ${cleaned.feedback}, 'draft', ${actorId(user)}, ${now}
    )
    on conflict (assignment_id, student_user_id) do update set
      submission_id = excluded.submission_id, scores_json = excluded.scores_json,
      total_points = excluded.total_points, max_points = excluded.max_points,
      feedback = excluded.feedback, graded_by_user_id = excluded.graded_by_user_id,
      graded_at = excluded.graded_at
  `;

  return {
    changed: Boolean(before),
    className: assignment.className,
    maxPoints: scored.maxPoints,
    previousTotal: before?.total_points ?? null,
    questTitle: assignment.title,
    status: before?.status === "released" ? ("released" as const) : ("draft" as const),
    studentName: student.name.trim(),
    totalPoints: scored.totalPoints,
  };
}

/** Release one student's grade, or every draft grade for the assignment. */
export async function releaseGrades(
  user: AuthenticatedUser,
  input: { assignmentId: string; studentEmail?: string | null }
) {
  const assignment = await loadGradable(user, input.assignmentId);
  const email = input.studentEmail?.trim().toLowerCase() || null;
  const now = new Date();
  const released = await getSql()<Array<{ student_user_id: string }>>`
    update quest_grades g set status = 'released', released_at = ${now}, released_by_user_id = ${actorId(user)}
    where g.assignment_id = ${input.assignmentId} and g.status = 'draft'
      and (${email}::text is null or g.student_user_id = (select u.id from app_users u where lower(u.email) = ${email}))
    returning g.student_user_id
  `;

  if (released.length === 0) {
    throw new QuestError(email ? "There is no draft grade to release for that student." : "There are no draft grades to release.", 409);
  }

  return { className: assignment.className, questTitle: assignment.title, released: released.length };
}
