import {
  canEditSubmission,
  MAX_COMMENT,
  MAX_REFLECTION,
  normalizeQuest,
  parseDueDate,
  studentCriteria,
  type QuestCriterion,
  type QuestInput,
} from "@/lib/quest-rules";
import type { AuthenticatedUser } from "@/lib/server/auth";
import { moderateTextMessage } from "@/lib/server/moderation";
import { PortfolioError as QuestError } from "@/lib/server/portfolios-errors";
import { getSql, hasProductionDatabase, id } from "@/lib/server/repository";

/**
 * Learning quests (v0.2.9).
 *
 * Teachers own the quests they create, and every teacher can browse the
 * shared library and copy a quest into their own. A quest is assigned to one
 * or more of the teacher's classes with an optional due date. Students write
 * a reflection and submit it; they can edit it until the due date, then it's
 * locked and only comments can be added. Nothing is deleted.
 */

export { QuestError };

type QuestRow = {
  copied_from_quest_id: string | null;
  created_at: Date;
  criteria_json: string;
  id: string;
  market_mode: QuestInput["marketMode"];
  market_symbols: string;
  market_window: string;
  objective: string;
  owner_name: string;
  owner_user_id: string;
  require_reflection: boolean;
  score_visibility: QuestInput["scoreVisibility"];
  title: string;
  updated_at: Date;
};

type CommentRow = {
  author_name: string;
  author_role: string;
  body: string;
  created_at: Date;
  id: string;
  submission_id: string;
};

function requireDatabase() {
  if (!hasProductionDatabase()) {
    throw new QuestError("Quests need a database (DATABASE_URL).", 503);
  }
}

const isAdmin = (user: AuthenticatedUser) => user.role === "Admin";

/** The person actually acting (the admin, while viewing as a student). */
const actorId = (user: AuthenticatedUser) => user.actingAdmin?.id ?? user.id;

function checkText(value: string, max: number, what: string) {
  const clean = value.trim();

  if (!clean) throw new QuestError(`Write a ${what} first.`, 400);
  if (clean.length > max) throw new QuestError(`Keep the ${what} under ${max} characters.`, 400);
  if (moderateTextMessage(clean).profanityDetected) {
    throw new QuestError(`Your ${what} has language that isn't allowed. Edit it and try again.`, 400);
  }

  return clean;
}

const questColumns = (sql: ReturnType<typeof getSql>) => sql`
  q.id, q.owner_user_id, q.title, q.objective, q.market_mode, q.market_symbols,
  q.market_window, q.require_reflection, q.score_visibility, q.criteria_json,
  q.copied_from_quest_id, q.created_at, q.updated_at,
  u.first_name || ' ' || u.last_name as owner_name
`;

async function loadQuest(questId: string) {
  const sql = getSql();
  const [row] = await sql<QuestRow[]>`
    select ${questColumns(sql)}
    from learning_quests q join app_users u on u.id = q.owner_user_id
    where q.id = ${questId}
  `;

  if (!row) throw new QuestError("That quest wasn't found.", 404);
  return row;
}

function toQuestInput(row: QuestRow): QuestInput {
  return {
    criteria: JSON.parse(row.criteria_json) as QuestCriterion[],
    marketMode: row.market_mode,
    marketSymbols: row.market_symbols,
    marketWindow: row.market_window,
    objective: row.objective,
    requireReflection: row.require_reflection,
    scoreVisibility: row.score_visibility,
    title: row.title,
  };
}

/** Quests with their assignments and real assigned / submitted counts. */
async function withStats(user: AuthenticatedUser, rows: QuestRow[]) {
  if (rows.length === 0) return [];

  const sql = getSql();
  const ids = rows.map((row) => row.id);
  const assignments = await sql<
    Array<{ assigned: string; class_name: string; due_at: Date | null; id: string; quest_id: string; submitted: string }>
  >`
    select a.id, a.quest_id, a.class_name, a.due_at,
      (select count(distinct ra.user_id) from role_assignments ra
        join app_users su on su.id = ra.user_id
        where ra.role = 'Student' and ra.scope = a.class_name and su.status = 'active') as assigned,
      (select count(*) from quest_submissions s where s.assignment_id = a.id) as submitted
    from quest_assignments a
    where a.quest_id = any(${ids})
    order by a.class_name
  `;

  return rows.map((row) => {
    const mine = assignments.filter((a) => a.quest_id === row.id);
    // Teachers see their own classes' assignments; admins see all.
    const visible = isAdmin(user) ? mine : mine.filter((a) => user.classNames.includes(a.class_name));

    return {
      ...toQuestInput(row),
      assigned: visible.reduce((total, a) => total + Number(a.assigned), 0),
      assignments: visible.map((a) => ({
        className: a.class_name,
        dueAt: a.due_at ? new Date(a.due_at).toISOString() : null,
        id: a.id,
      })),
      copiedFromQuestId: row.copied_from_quest_id,
      id: row.id,
      isMine: row.owner_user_id === user.id,
      ownerName: row.owner_name.trim(),
      status: visible.length > 0 ? ("Assigned" as const) : ("Draft" as const),
      submitted: visible.reduce((total, a) => total + Number(a.submitted), 0),
      updatedAt: new Date(row.updated_at).toISOString(),
    };
  });
}

export type SavedQuest = Awaited<ReturnType<typeof withStats>>[number];

/** "mine": quests this teacher owns. "library": every teacher's quests. */
export async function listQuests(user: AuthenticatedUser, scope: "mine" | "library") {
  requireDatabase();

  const sql = getSql();
  const rows = await sql<QuestRow[]>`
    select ${questColumns(sql)}
    from learning_quests q join app_users u on u.id = q.owner_user_id
    where ${scope === "library"} or q.owner_user_id = ${user.id}
    order by q.updated_at desc
    limit 500
  `;

  return withStats(user, rows);
}

/** Create (no questId) or update a quest. Only its owner, or an admin, can edit it. */
export async function saveQuest(user: AuthenticatedUser, questId: string | null, raw: unknown) {
  requireDatabase();

  const result = normalizeQuest(raw);
  if ("error" in result) throw new QuestError(result.error, 400);

  const quest = result.quest;
  const sql = getSql();
  const now = new Date();

  if (questId) {
    const existing = await loadQuest(questId);

    if (existing.owner_user_id !== user.id && !isAdmin(user)) {
      throw new QuestError("You can only edit your own quests. Copy it from the library first.", 403);
    }

    await sql`
      update learning_quests set
        title = ${quest.title}, objective = ${quest.objective},
        market_mode = ${quest.marketMode}, market_symbols = ${quest.marketSymbols},
        market_window = ${quest.marketWindow}, require_reflection = ${quest.requireReflection},
        score_visibility = ${quest.scoreVisibility}, criteria_json = ${JSON.stringify(quest.criteria)},
        updated_at = ${now}
      where id = ${questId}
    `;
    return { created: false, id: questId };
  }

  const newId = id("quest");
  await insertQuest(user.id, newId, quest, null, now);
  return { created: true, id: newId };
}

async function insertQuest(
  ownerId: string,
  questId: string,
  quest: QuestInput,
  copiedFrom: string | null,
  now: Date
) {
  await getSql()`
    insert into learning_quests (
      id, owner_user_id, title, objective, market_mode, market_symbols, market_window,
      require_reflection, score_visibility, criteria_json, copied_from_quest_id,
      created_at, updated_at
    )
    values (
      ${questId}, ${ownerId}, ${quest.title}, ${quest.objective}, ${quest.marketMode},
      ${quest.marketSymbols}, ${quest.marketWindow}, ${quest.requireReflection},
      ${quest.scoreVisibility}, ${JSON.stringify(quest.criteria)}, ${copiedFrom},
      ${now}, ${now}
    )
  `;
}

/** Copy a library quest into this teacher's own quests (as a draft). */
export async function copyQuest(user: AuthenticatedUser, questId: string) {
  requireDatabase();

  const source = await loadQuest(questId);
  const newId = id("quest");
  await insertQuest(user.id, newId, toQuestInput(source), source.id, new Date());
  return { id: newId, title: source.title };
}

/** Assign a quest to some of the teacher's classes, with an optional due date. */
export async function assignQuest(
  user: AuthenticatedUser,
  questId: string,
  classNames: string[],
  dueDate: unknown
) {
  requireDatabase();

  const quest = await loadQuest(questId);

  if (quest.owner_user_id !== user.id && !isAdmin(user)) {
    throw new QuestError("You can only assign your own quests. Copy it from the library first.", 403);
  }

  const classes = [...new Set(classNames.map((name) => name.trim()).filter(Boolean))];
  if (classes.length === 0) throw new QuestError("Choose at least one class.", 400);

  if (!isAdmin(user)) {
    const notMine = classes.filter((name) => !user.classNames.includes(name));
    if (notMine.length) {
      throw new QuestError(`You can only assign quests to your own classes (not ${notMine.join(", ")}).`, 403);
    }
  }

  const due = parseDueDate(dueDate);
  if ("error" in due) throw new QuestError(due.error, 400);

  const sql = getSql();
  const now = new Date();

  for (const className of classes) {
    await sql`
      insert into quest_assignments (id, quest_id, class_name, due_at, assigned_by_user_id, assigned_at)
      values (${id("quest-assignment")}, ${questId}, ${className}, ${due.dueAt}, ${user.id}, ${now})
      on conflict (quest_id, class_name) do update set due_at = excluded.due_at
    `;
  }

  return { classNames: classes, dueAt: due.dueAt ? due.dueAt.toISOString() : null, title: quest.title };
}

async function commentsFor(submissionIds: string[]) {
  if (submissionIds.length === 0) return new Map<string, ReturnType<typeof toComment>[]>();

  const rows = await getSql()<CommentRow[]>`
    select c.id, c.submission_id, c.body, c.created_at,
      u.first_name || ' ' || u.last_name as author_name,
      coalesce((select ra.role from role_assignments ra where ra.user_id = u.id
        order by case ra.role when 'Admin' then 0 when 'Teacher' then 1 else 2 end limit 1), '') as author_role
    from quest_submission_comments c
    join app_users u on u.id = c.author_user_id
    where c.submission_id = any(${submissionIds})
    order by c.created_at asc
  `;
  const bySubmission = new Map<string, ReturnType<typeof toComment>[]>();

  for (const row of rows) {
    const list = bySubmission.get(row.submission_id) ?? [];
    list.push(toComment(row));
    bySubmission.set(row.submission_id, list);
  }

  return bySubmission;
}

function toComment(row: CommentRow) {
  return {
    authorName: row.author_name.trim(),
    authorRole: row.author_role,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
    id: row.id,
  };
}

/** A student's assigned quests, with their submission and its comments. */
export async function listStudentQuests(user: AuthenticatedUser) {
  requireDatabase();

  const sql = getSql();
  const rows = await sql<
    Array<QuestRow & {
      assignment_id: string;
      class_name: string;
      due_at: Date | null;
      reflection: string | null;
      submission_id: string | null;
      submitted_at: Date | null;
      submission_updated_at: Date | null;
    }>
  >`
    select ${questColumns(sql)}, a.id as assignment_id, a.class_name, a.due_at,
      s.id as submission_id, s.reflection, s.submitted_at, s.updated_at as submission_updated_at
    from quest_assignments a
    join learning_quests q on q.id = a.quest_id
    join app_users u on u.id = q.owner_user_id
    left join quest_submissions s on s.assignment_id = a.id and s.student_user_id = ${user.id}
    where a.class_name = any(${user.classNames})
    order by a.due_at asc nulls last, a.assigned_at desc
  `;
  const comments = await commentsFor(rows.flatMap((row) => (row.submission_id ? [row.submission_id] : [])));
  const now = new Date();

  return rows.map((row) => {
    const quest = toQuestInput(row);
    const dueAt = row.due_at ? new Date(row.due_at).toISOString() : null;

    return {
      assignmentId: row.assignment_id,
      canEdit: canEditSubmission(dueAt, now),
      className: row.class_name,
      criteria: studentCriteria(quest),
      dueAt,
      marketMode: quest.marketMode,
      marketSymbols: quest.marketSymbols,
      marketWindow: quest.marketWindow,
      objective: quest.objective,
      questId: row.id,
      requireReflection: quest.requireReflection,
      submission: row.submission_id
        ? {
            comments: comments.get(row.submission_id) ?? [],
            id: row.submission_id,
            reflection: row.reflection ?? "",
            submittedAt: new Date(row.submitted_at as Date).toISOString(),
            updatedAt: new Date(row.submission_updated_at as Date).toISOString(),
          }
        : null,
      teacherName: row.owner_name.trim(),
      title: quest.title,
    };
  });
}

/** Submit or edit a reflection. Only before the due date. */
export async function submitReflection(user: AuthenticatedUser, assignmentId: string, reflection: string) {
  requireDatabase();

  const sql = getSql();
  const [assignment] = await sql<Array<{ class_name: string; due_at: Date | null; title: string }>>`
    select a.class_name, a.due_at, q.title
    from quest_assignments a join learning_quests q on q.id = a.quest_id
    where a.id = ${assignmentId}
  `;

  if (!assignment || !user.classNames.includes(assignment.class_name)) {
    throw new QuestError("That quest isn't assigned to your class.", 404);
  }

  const dueAt = assignment.due_at ? new Date(assignment.due_at).toISOString() : null;
  if (!canEditSubmission(dueAt)) {
    throw new QuestError("The due date has passed, so this submission is locked. You can still add a comment.", 409);
  }

  const text = checkText(reflection, MAX_REFLECTION, "reflection");
  const now = new Date();
  const [row] = await sql<Array<{ id: string; inserted: boolean }>>`
    insert into quest_submissions (id, assignment_id, student_user_id, reflection, submitted_at, updated_at)
    values (${id("quest-submission")}, ${assignmentId}, ${user.id}, ${text}, ${now}, ${now})
    on conflict (assignment_id, student_user_id)
      do update set reflection = excluded.reflection, updated_at = excluded.updated_at
    returning id, (xmax = 0) as inserted
  `;

  return { edited: !row.inserted, submissionId: row.id, title: assignment.title };
}

/**
 * Who may read and comment on a submission: the student who wrote it, a
 * teacher of that class, or an admin.
 */
async function loadSubmissionForAccess(user: AuthenticatedUser, submissionId: string) {
  const [row] = await getSql()<Array<{ class_name: string; student_user_id: string }>>`
    select a.class_name, s.student_user_id
    from quest_submissions s join quest_assignments a on a.id = s.assignment_id
    where s.id = ${submissionId}
  `;

  if (!row) throw new QuestError("That submission wasn't found.", 404);

  const allowed =
    isAdmin(user) ||
    row.student_user_id === user.id ||
    (user.role === "Teacher" && user.classNames.includes(row.class_name));

  if (!allowed) throw new QuestError("You can't comment on that submission.", 403);
  return row;
}

/** Comments are allowed any time, before or after the due date. */
export async function addComment(user: AuthenticatedUser, submissionId: string, body: string) {
  requireDatabase();

  const submission = await loadSubmissionForAccess(user, submissionId);
  const text = checkText(body, MAX_COMMENT, "comment");
  const commentId = id("quest-comment");

  await getSql()`
    insert into quest_submission_comments (id, submission_id, author_user_id, body, created_at)
    values (${commentId}, ${submissionId}, ${actorId(user)}, ${text}, ${new Date()})
  `;

  return { className: submission.class_name, commentId };
}

/** The teacher's view of one quest: each assigned class's students and submissions. */
export async function listSubmissions(user: AuthenticatedUser, questId: string) {
  requireDatabase();

  const quest = await loadQuest(questId);
  const sql = getSql();
  const assignments = await sql<Array<{ class_name: string; due_at: Date | null; id: string }>>`
    select id, class_name, due_at from quest_assignments
    where quest_id = ${questId} and (${isAdmin(user)} or class_name = any(${user.classNames}))
    order by class_name
  `;
  const ids = assignments.map((a) => a.id);
  const rows = ids.length
    ? await sql<
        Array<{
          assignment_id: string;
          email: string;
          first_name: string;
          last_name: string;
          reflection: string | null;
          submission_id: string | null;
          submitted_at: Date | null;
          updated_at: Date | null;
        }>
      >`
        select distinct on (a.id, u.id) a.id as assignment_id, u.email, u.first_name, u.last_name,
          s.id as submission_id, s.reflection, s.submitted_at, s.updated_at
        from quest_assignments a
        join role_assignments ra on ra.scope = a.class_name and ra.role = 'Student'
        join app_users u on u.id = ra.user_id and u.status = 'active'
        left join quest_submissions s on s.assignment_id = a.id and s.student_user_id = u.id
        where a.id = any(${ids})
        order by a.id, u.id
      `
    : [];
  const comments = await commentsFor(rows.flatMap((row) => (row.submission_id ? [row.submission_id] : [])));

  return {
    classes: assignments.map((a) => ({
      className: a.class_name,
      dueAt: a.due_at ? new Date(a.due_at).toISOString() : null,
      students: rows
        .filter((row) => row.assignment_id === a.id)
        .sort((x, y) => `${x.last_name} ${x.first_name}`.localeCompare(`${y.last_name} ${y.first_name}`))
        .map((row) => ({
          email: row.email,
          name: `${row.first_name} ${row.last_name}`.trim(),
          submission: row.submission_id
            ? {
                comments: comments.get(row.submission_id) ?? [],
                id: row.submission_id,
                reflection: row.reflection ?? "",
                submittedAt: new Date(row.submitted_at as Date).toISOString(),
                updatedAt: new Date(row.updated_at as Date).toISOString(),
              }
            : null,
        })),
    })),
    title: quest.title,
  };
}

/** Import quests (one or a list) into this teacher's own quests, as drafts. */
export async function importQuests(user: AuthenticatedUser, payload: unknown) {
  requireDatabase();

  const items = Array.isArray(payload) ? payload : [payload];
  if (items.length === 0) throw new QuestError("There are no quests to import.", 400);
  if (items.length > 50) throw new QuestError("Import up to 50 quests at a time.", 400);

  const quests: QuestInput[] = [];
  for (const [index, item] of items.entries()) {
    const result = normalizeQuest(item);
    if ("error" in result) {
      throw new QuestError(`Quest ${index + 1}: ${result.error}`, 400);
    }
    quests.push(result.quest);
  }

  const now = new Date();
  const ids: string[] = [];
  for (const quest of quests) {
    const newId = id("quest");
    await insertQuest(user.id, newId, quest, null, now);
    ids.push(newId);
  }

  return { count: ids.length, ids };
}

/** Export this teacher's own quests (just the quest content, no student data). */
export async function exportQuests(user: AuthenticatedUser) {
  requireDatabase();

  const sql = getSql();
  const rows = await sql<QuestRow[]>`
    select ${questColumns(sql)}
    from learning_quests q join app_users u on u.id = q.owner_user_id
    where q.owner_user_id = ${user.id}
    order by q.updated_at desc
  `;

  return rows.map(toQuestInput);
}

export function questErrorResponse(error: unknown) {
  if (error instanceof QuestError) {
    return Response.json({ message: error.message, ok: false }, { status: error.status });
  }

  console.error("Quest request failed.", error);
  return Response.json({ message: "The quest request could not be completed.", ok: false }, { status: 500 });
}
