import { findTemplate, isDifficulty, templateMoves, type Difficulty } from "@/lib/market-templates";
import {
  applyAdjustments,
  hormuzMoves,
  PRICE_STEP_PERCENT,
  type MarketAdjustment,
  type PricedSymbol,
} from "@/lib/market-adjustments";
import type { AuthenticatedUser } from "@/lib/server/auth";
import { PortfolioError } from "@/lib/server/portfolios-errors";
import {
  defaultDistrictId,
  getClassMarketConfig,
  getClassMarketState,
  getSql,
  hasProductionDatabase,
  id,
} from "@/lib/server/repository";

/**
 * Teacher market changes, saved on the server. A teacher raises or lowers a
 * symbol, or triggers the Strait of Hormuz scenario, for one class, all their
 * classes, a group of students, or one student. Students see and trade at the
 * changed prices until the teacher undoes the change or resets to normal.
 */

export type ChangeTarget =
  | { className: string; type: "class" }
  | { type: "all_classes" }
  | { className: string; studentEmails: string[]; type: "students" };

export type ChangeAction =
  | { direction: "raise" | "lower"; kind: "price"; ticker: string }
  | { kind: "hormuz"; oilSpikePercent: number; tickers: string[] }
  // Market event templates (v0.2.19): recession, inflation spike, rate cut,
  // tech selloff, company scandal (needs a ticker); scaled by difficulty.
  | { difficulty?: Difficulty; kind: "template"; templateId: string; ticker?: string | null };

type AdjustmentRow = {
  class_name: string;
  created_at: Date;
  created_by_name: string;
  event_id: string;
  id: string;
  label: string;
  news: string;
  percent: string;
  student_user_ids_json: string | null;
  ticker: string;
};

function requireDatabase() {
  if (!hasProductionDatabase()) {
    throw new PortfolioError("Teacher market controls need a database (DATABASE_URL).", 503);
  }
}

/** Classes this user can change: admins any; teachers their own, if enabled. */
export async function controllableClasses(user: AuthenticatedUser) {
  const sql = getSql();
  const configured = await sql<Array<{ class_name: string; teacher_controls_enabled: boolean }>>`
    select class_name, teacher_controls_enabled from class_market_configs
    where district_id = ${defaultDistrictId}
    order by class_name
  `;

  if (user.role === "Admin") {
    const assigned = await sql<Array<{ scope: string }>>`
      select distinct scope from role_assignments
      where role in ('Student', 'Teacher') and scope <> '' and scope <> 'District'
    `;
    return [...new Set([...configured.map((row) => row.class_name), ...assigned.map((row) => row.scope)])].sort();
  }

  const results: string[] = [];

  for (const className of user.classNames) {
    const row = configured.find((item) => item.class_name === className);
    const enabled = row ? row.teacher_controls_enabled : (await getClassMarketConfig(className)).teacherControlsEnabled;

    if (enabled) results.push(className);
  }

  return results;
}

export async function requireControllable(user: AuthenticatedUser, className: string) {
  const allowed = await controllableClasses(user);

  if (!allowed.includes(className)) {
    throw new PortfolioError(
      user.classNames.includes(className)
        ? `Teacher market controls are turned off for ${className}. Ask an admin to turn them on.`
        : `You can only change the market for your own classes.`,
      403
    );
  }
}

function toAdjustment(row: AdjustmentRow): MarketAdjustment {
  return {
    createdAt: new Date(row.created_at).toISOString(),
    id: row.id,
    label: row.label,
    news: row.news,
    percent: Number(row.percent),
    studentUserIds: row.student_user_ids_json ? (JSON.parse(row.student_user_ids_json) as string[]) : null,
    ticker: row.ticker,
  };
}

async function activeRows(className: string) {
  return getSql()<AdjustmentRow[]>`
    select a.id, a.event_id, a.class_name, a.student_user_ids_json, a.ticker, a.percent,
      a.label, a.news, a.created_at,
      u.first_name || ' ' || u.last_name as created_by_name
    from market_adjustments a
    join app_users u on u.id = a.created_by_user_id
    where a.class_name = ${className} and a.cleared_at is null
    order by a.created_at asc
  `;
}

export async function listActiveAdjustments(className: string) {
  if (!hasProductionDatabase()) return [];
  return (await activeRows(className)).map(toAdjustment);
}

/**
 * The class market with active changes applied, as one viewer sees it.
 * studentUserId null = the class-wide view (teacher preview).
 */
export async function adjustedClassMarket(className: string, studentUserId: string | null) {
  const state = await getClassMarketState(className);
  const adjustments = await listActiveAdjustments(className);
  const symbols = applyAdjustments(
    state.symbols.map((symbol): PricedSymbol => ({
      changePercent: symbol.simulatedChangePercent,
      name: symbol.name,
      price: symbol.simulatedPrice,
      ticker: symbol.ticker,
    })),
    adjustments,
    studentUserId
  );

  return { adjustments, state, symbols };
}

/** Everything the teacher's Market page needs for one class. */
export async function teacherMarketView(user: AuthenticatedUser, className: string | null) {
  requireDatabase();

  const classes = await controllableClasses(user);
  const selected = className && classes.includes(className) ? className : classes[0] ?? null;

  if (!selected) {
    return { classes, className: null, clock: null, market: [], changes: [], students: [] };
  }

  const sql = getSql();
  const [{ state, symbols }, rows, students] = await Promise.all([
    adjustedClassMarket(selected, null),
    activeRows(selected),
    sql<Array<{ email: string; first_name: string; id: string; last_name: string }>>`
      select distinct app_users.id, app_users.email, app_users.first_name, app_users.last_name
      from app_users
      join role_assignments on role_assignments.user_id = app_users.id
      where role_assignments.role = 'Student' and role_assignments.scope = ${selected}
        and app_users.status = 'active'
      order by app_users.last_name, app_users.first_name
    `,
  ]);
  const nameById = new Map(students.map((s) => [s.id, `${s.first_name} ${s.last_name}`.trim()]));

  return {
    changes: rows.map((row) => {
      const adjustment = toAdjustment(row);
      const who = adjustment.studentUserIds
        ? adjustment.studentUserIds.map((studentId) => nameById.get(studentId) ?? "a student").join(", ")
        : "Whole class";

      return {
        appliesTo: who,
        createdAt: adjustment.createdAt,
        createdBy: row.created_by_name,
        eventId: row.event_id,
        id: adjustment.id,
        label: adjustment.label,
        percent: adjustment.percent,
        ticker: adjustment.ticker,
      };
    }),
    classes,
    className: selected,
    clock: state.clock,
    market: symbols,
    students: students.map((s) => ({
      email: s.email,
      name: `${s.first_name} ${s.last_name}`.trim(),
    })),
  };
}

/** Creates a change for the chosen target. Returns what was applied. */
export async function createChange(
  user: AuthenticatedUser,
  target: ChangeTarget,
  action: ChangeAction
) {
  requireDatabase();

  const sql = getSql();
  const classNames =
    target.type === "all_classes" ? await controllableClasses(user) : [target.className];

  if (classNames.length === 0) {
    throw new PortfolioError("You don't have any classes with teacher market controls.", 403);
  }

  for (const className of classNames) {
    await requireControllable(user, className);
  }

  let studentUserIds: string[] | null = null;

  if (target.type === "students") {
    const emails = [...new Set(target.studentEmails.map((email) => email.trim().toLowerCase()))].filter(Boolean);

    if (emails.length === 0) throw new PortfolioError("Choose at least one student.", 400);

    const found = await sql<Array<{ email: string; id: string }>>`
      select distinct app_users.id, lower(app_users.email) as email
      from app_users
      join role_assignments on role_assignments.user_id = app_users.id
      where role_assignments.role = 'Student'
        and role_assignments.scope = ${target.className}
        and lower(app_users.email) = any(${emails})
    `;

    if (found.length !== emails.length) {
      throw new PortfolioError(`Every chosen student must be in ${target.className}.`, 400);
    }

    studentUserIds = found.map((row) => row.id);
  }

  const eventId = id("market-event");
  const now = new Date();
  const actorName = `${user.firstName} ${user.lastName}`.trim() || user.email;
  const applied: Array<{ className: string; percent: number; ticker: string }> = [];
  const skipped: string[] = [];

  for (const className of classNames) {
    const state = await getClassMarketState(className);
    const available = new Map(state.symbols.map((symbol) => [symbol.ticker, symbol]));
    let moves: Array<{ percent: number; ticker: string }>;
    let label: string;
    let news: string;

    if (action.kind === "price") {
      const ticker = action.ticker.trim().toUpperCase();

      if (!available.has(ticker)) {
        if (target.type === "all_classes") {
          skipped.push(`${ticker} (not in ${className})`);
          continue;
        }
        throw new PortfolioError(`${ticker} isn't in ${className}'s market.`, 400);
      }

      const percent = action.direction === "raise" ? PRICE_STEP_PERCENT : -PRICE_STEP_PERCENT;
      moves = [{ percent, ticker }];
      label = `${action.direction === "raise" ? "Raised" : "Lowered"} ${ticker} ${PRICE_STEP_PERCENT}%`;
      news = `Teacher update: ${ticker} moved ${action.direction === "raise" ? "up" : "down"} ${PRICE_STEP_PERCENT}%.`;
    } else if (action.kind === "template") {
      const template = findTemplate(action.templateId);

      if (!template) throw new PortfolioError("That market event isn't available.", 404);

      moves = templateMoves(
        template,
        [...available.values()].map((symbol) => ({ name: symbol.name, ticker: symbol.ticker })),
        isDifficulty(action.difficulty) ? action.difficulty : "realistic",
        action.ticker
      );

      if (moves.length === 0) {
        if (template.needsTicker) {
          if (target.type === "all_classes") {
            skipped.push(`${action.ticker ?? "?"} (not in ${className})`);
            continue;
          }
          throw new PortfolioError(`Choose a symbol in ${className}'s market for the ${template.title.toLowerCase()}.`, 400);
        }
        continue;
      }

      label = template.title + (template.needsTicker ? ` (${moves[0].ticker})` : "");
      news = template.news;
    } else {
      const tickers = [...new Set(action.tickers.map((t) => t.trim().toUpperCase()))].filter(Boolean);
      const usable = tickers.filter((ticker) => available.has(ticker));

      skipped.push(...tickers.filter((ticker) => !available.has(ticker)).map((t) => `${t} (not in ${className})`));

      if (usable.length === 0) continue;

      moves = hormuzMoves(
        usable.map((ticker) => ({ name: available.get(ticker)?.name ?? ticker, ticker })),
        action.oilSpikePercent
      );
      label = "Strait of Hormuz blockade";
      news = "Teacher scenario: Strait of Hormuz blockade. Oil supply risk moved this symbol.";
    }

    for (const move of moves) {
      await sql`
        insert into market_adjustments (
          id, event_id, class_name, student_user_ids_json, ticker, percent, label, news,
          created_by_user_id, created_at
        )
        values (
          ${id("market-adjustment")}, ${eventId}, ${className},
          ${studentUserIds ? JSON.stringify(studentUserIds) : null}, ${move.ticker},
          ${move.percent}, ${action.kind === "price" ? label : `${label}: ${move.ticker} ${move.percent > 0 ? "+" : ""}${move.percent}%`},
          ${news}, ${user.id}, ${now}
        )
      `;
      applied.push({ className, percent: move.percent, ticker: move.ticker });
    }
  }

  if (applied.length === 0) {
    throw new PortfolioError(
      `None of those symbols are in the chosen class market${skipped.length ? `: ${skipped.join(", ")}` : ""}.`,
      400
    );
  }

  return { actorName, applied, classNames, eventId, skipped, studentCount: studentUserIds?.length ?? null };
}

/** Undo one change (or the whole event it belongs to, e.g. a scenario). */
export async function clearChange(user: AuthenticatedUser, changeId: string) {
  requireDatabase();

  const sql = getSql();
  const [row] = await sql<Array<{ class_name: string; event_id: string }>>`
    select class_name, event_id from market_adjustments
    where id = ${changeId} and cleared_at is null
  `;

  if (!row) throw new PortfolioError("That change was already undone.", 404);

  await requireControllable(user, row.class_name);

  const cleared = await sql`
    update market_adjustments set cleared_at = ${new Date()}, cleared_by_user_id = ${user.id}
    where event_id = ${row.event_id} and class_name = ${row.class_name} and cleared_at is null
    returning id
  `;

  return { className: row.class_name, count: cleared.length, eventId: row.event_id };
}

/** Reset a class market to normal: undo every active change. */
export async function resetClass(user: AuthenticatedUser, className: string) {
  requireDatabase();
  await requireControllable(user, className);

  const cleared = await getSql()`
    update market_adjustments set cleared_at = ${new Date()}, cleared_by_user_id = ${user.id}
    where class_name = ${className} and cleared_at is null
    returning id
  `;

  return { className, count: cleared.length };
}
