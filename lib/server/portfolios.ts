import { tradingBlockedReason } from "@/lib/market-clock";
import { listStudentLifeEvents } from "@/lib/server/life-events";
import type { TransactionSql } from "postgres";

import {
  allowsFractionalShares,
  applyTrade,
  maxWholeShares,
  defaultAllocationTargets,
  gradeLevelFromClassName,
  portfolioValueCents,
  priceToCents,
  tradeErrorMessages,
  type AllocationTarget,
  type Holding,
  type PortfolioState,
  type TradeSide,
} from "@/lib/portfolio-rules";
import {
  DEFAULT_SCHOOL_YEAR,
  hasSchoolYearEnded,
  isValidMonthDay,
  schoolYearFor,
  type SchoolYearSettings,
} from "@/lib/school-year";
import type { AuthenticatedUser } from "@/lib/server/auth";
import { PortfolioError } from "@/lib/server/portfolios-errors";
import { adjustedClassMarket } from "@/lib/server/teacher-market";
import {
  defaultDistrictId,
  getClassMarketConfig,
  getSql,
  hasProductionDatabase,
  id,
} from "@/lib/server/repository";

/**
 * Student profiles and portfolios.
 *
 * Each student has one long-term profile. Inside it, every class they're
 * assigned to gets a portfolio per school year (kind "class"). Staff get a
 * "practice" portfolio. Portfolios are never deleted: past school years are
 * kept as read-only records the student can look back on.
 */

export { PortfolioError };

function requireDatabase() {
  if (!hasProductionDatabase()) {
    throw new PortfolioError("Portfolios need a database (DATABASE_URL).", 503);
  }
}

// ---------------------------------------------------------------- settings

export async function getSchoolYearSettings(): Promise<SchoolYearSettings> {
  if (!hasProductionDatabase()) return DEFAULT_SCHOOL_YEAR;

  const [row] = await getSql()<Array<{ school_year_end: string; school_year_start: string }>>`
    select school_year_start, school_year_end
    from district_settings
    where district_id = ${defaultDistrictId}
  `;

  return row ? { end: row.school_year_end, start: row.school_year_start } : DEFAULT_SCHOOL_YEAR;
}

export async function saveSchoolYearSettings(settings: SchoolYearSettings, actor: AuthenticatedUser) {
  requireDatabase();

  if (!isValidMonthDay(settings.start) || !isValidMonthDay(settings.end)) {
    throw new PortfolioError("Enter the first and last day as month and day.", 400);
  }

  if (settings.start === settings.end) {
    throw new PortfolioError("The first and last day can't be the same.", 400);
  }

  await getSql()`
    insert into district_settings (
      district_id, school_year_start, school_year_end, updated_by_user_id, updated_at
    )
    values (${defaultDistrictId}, ${settings.start}, ${settings.end}, ${actor.id}, ${new Date()})
    on conflict (district_id) do update set
      school_year_start = excluded.school_year_start,
      school_year_end = excluded.school_year_end,
      updated_by_user_id = excluded.updated_by_user_id,
      updated_at = excluded.updated_at
  `;
}

/** Grade level for a class: the admin's setting, else from its name. */
export async function getClassGradeLevel(className: string): Promise<number | null> {
  if (hasProductionDatabase()) {
    const [row] = await getSql()<Array<{ grade_level: number | null }>>`
      select grade_level from class_market_configs
      where district_id = ${defaultDistrictId} and class_name = ${className}
    `;

    if (row?.grade_level != null) return row.grade_level;
  }

  return gradeLevelFromClassName(className);
}

export async function saveClassGradeLevel(className: string, gradeLevel: number | null) {
  requireDatabase();

  if (gradeLevel !== null && (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 12)) {
    throw new PortfolioError("Grade level must be a whole number from 1 to 12.", 400);
  }

  await getSql()`
    update class_market_configs set grade_level = ${gradeLevel}
    where district_id = ${defaultDistrictId} and class_name = ${className}
  `;
}

// -------------------------------------------------------------- portfolios

type PortfolioRow = {
  cash_cents: string | number;
  class_name: string;
  created_at: Date;
  id: string;
  kind: "class" | "practice";
  reset_count: number;
  school_year: string;
  starting_cash_cents: string | number;
  user_id: string;
};

type Sql = ReturnType<typeof getSql> | TransactionSql;

/**
 * Prices this student trades at: the class simulator price with any active
 * teacher market changes applied (v0.2.8).
 */
async function marketPrices(className: string, studentUserId: string | null) {
  const { state, symbols } = await adjustedClassMarket(className, studentUserId);
  const prices: Record<string, number> = {};

  for (const symbol of symbols) {
    prices[symbol.ticker] = priceToCents(symbol.price);
  }

  return { prices, state, symbols };
}

async function loadState(sql: Sql, portfolio: PortfolioRow): Promise<PortfolioState> {
  const holdings = await sql<
    Array<{ average_cost_cents: string; name: string; quantity_units: string; ticker: string }>
  >`
    select ticker, name, quantity_units, average_cost_cents
    from portfolio_holdings
    where portfolio_id = ${portfolio.id}
    order by ticker
  `;

  return {
    cashCents: Number(portfolio.cash_cents),
    holdings: holdings.map(
      (row): Holding => ({
        averageCostCents: Number(row.average_cost_cents),
        name: row.name,
        quantityUnits: Number(row.quantity_units),
        ticker: row.ticker,
      })
    ),
  };
}

async function writeState(
  sql: Sql,
  portfolioId: string,
  before: PortfolioState,
  after: PortfolioState
) {
  const now = new Date();

  await sql`
    update student_portfolios set cash_cents = ${after.cashCents}, updated_at = ${now}
    where id = ${portfolioId}
  `;

  for (const holding of after.holdings) {
    await sql`
      insert into portfolio_holdings (
        portfolio_id, ticker, name, quantity_units, average_cost_cents, updated_at
      )
      values (
        ${portfolioId}, ${holding.ticker}, ${holding.name}, ${holding.quantityUnits},
        ${holding.averageCostCents}, ${now}
      )
      on conflict (portfolio_id, ticker) do update set
        quantity_units = excluded.quantity_units,
        average_cost_cents = excluded.average_cost_cents,
        updated_at = excluded.updated_at
    `;
  }

  const kept = new Set(after.holdings.map((holding) => holding.ticker));

  for (const holding of before.holdings) {
    if (!kept.has(holding.ticker)) {
      await sql`
        delete from portfolio_holdings
        where portfolio_id = ${portfolioId} and ticker = ${holding.ticker}
      `;
    }
  }
}

async function recordActivity(
  sql: Sql,
  input: {
    actorUserId: string | null;
    amountCents?: number | null;
    cashAfterCents: number;
    kind: "opened" | "buy" | "sell" | "allocation" | "correction" | "reset" | "life_event" | "life_event_undo";
    note?: string;
    portfolioId: string;
    priceCents?: number | null;
    quantityUnits?: number | null;
    ticker?: string | null;
  }
) {
  await sql`
    insert into portfolio_activity (
      id, portfolio_id, kind, ticker, quantity_units, price_cents, amount_cents,
      cash_after_cents, note, actor_user_id, created_at
    )
    values (
      ${id("activity")}, ${input.portfolioId}, ${input.kind}, ${input.ticker ?? null},
      ${input.quantityUnits ?? null}, ${input.priceCents ?? null}, ${input.amountCents ?? null},
      ${input.cashAfterCents}, ${input.note ?? ""}, ${input.actorUserId}, ${new Date()}
    )
  `;
}

async function recordSnapshot(sql: Sql, portfolioId: string, valueCents: number, cashCents: number) {
  await sql`
    insert into portfolio_value_snapshots (id, portfolio_id, value_cents, cash_cents, recorded_at)
    values (${id("snapshot")}, ${portfolioId}, ${valueCents}, ${cashCents}, ${new Date()})
  `;
}

/**
 * Makes sure the user has their portfolios for the current school year:
 * one per assigned class for students, a practice portfolio for staff.
 */
export async function ensureCurrentPortfolios(user: AuthenticatedUser, now = new Date()) {
  requireDatabase();

  const sql = getSql();
  const schoolYear = schoolYearFor(now, await getSchoolYearSettings()).label;
  const wanted =
    user.role === "Student"
      ? user.classNames.filter(Boolean).map((className) => ({ className, kind: "class" as const }))
      : [{ className: user.className || "District", kind: "practice" as const }];

  for (const { className, kind } of wanted) {
    const config = await getClassMarketConfig(className);
    const startingCashCents = config.startingCashCents;
    const portfolioId = id("portfolio");
    const inserted = await sql`
      insert into student_portfolios (
        id, user_id, class_name, school_year, kind, starting_cash_cents, cash_cents,
        created_at, updated_at
      )
      values (
        ${portfolioId}, ${user.id}, ${className}, ${schoolYear}, ${kind},
        ${startingCashCents}, ${startingCashCents}, ${now}, ${now}
      )
      on conflict (user_id, class_name, school_year, kind) do nothing
      returning id
    `;

    if (inserted.length > 0) {
      await recordActivity(sql, {
        actorUserId: user.id,
        cashAfterCents: startingCashCents,
        kind: "opened",
        note: `Portfolio opened with $${(startingCashCents / 100).toFixed(2)}`,
        portfolioId,
      });
      await recordSnapshot(sql, portfolioId, startingCashCents, startingCashCents);
    }
  }
}

async function loadPortfolioRow(sql: Sql, portfolioId: string, forUpdate = false) {
  const rows = forUpdate
    ? await sql<PortfolioRow[]>`select * from student_portfolios where id = ${portfolioId} for update`
    : await sql<PortfolioRow[]>`select * from student_portfolios where id = ${portfolioId}`;

  return rows[0] ?? null;
}

async function isReadOnly(portfolio: PortfolioRow) {
  return hasSchoolYearEnded(portfolio.school_year, new Date(), await getSchoolYearSettings());
}

export type PortfolioDetail = Awaited<ReturnType<typeof getPortfolioDetail>>;

export async function getPortfolioDetail(portfolioId: string) {
  requireDatabase();

  const sql = getSql();
  const portfolio = await loadPortfolioRow(sql, portfolioId);

  if (!portfolio) throw new PortfolioError("Portfolio not found.", 404);

  const [state, { prices, state: market, symbols: adjustedSymbols }, gradeLevel, readOnly, lifeEvents] = await Promise.all([
    loadState(sql, portfolio),
    marketPrices(portfolio.class_name, portfolio.user_id),
    getClassGradeLevel(portfolio.class_name),
    isReadOnly(portfolio),
    // Life events (v0.2.17) that hit this portfolio, for the student's screen.
    listStudentLifeEvents(portfolio.user_id, portfolio.id),
  ]);
  const [activity, history, allocationRows] = await Promise.all([
    sql<
      Array<{
        actor_user_id: string | null;
        amount_cents: string | null;
        cash_after_cents: string | null;
        created_at: Date;
        id: string;
        kind: string;
        note: string;
        price_cents: string | null;
        quantity_units: string | null;
        ticker: string | null;
      }>
    >`
      select id, kind, ticker, quantity_units, price_cents, amount_cents, cash_after_cents,
        note, actor_user_id, created_at
      from portfolio_activity
      where portfolio_id = ${portfolio.id}
      order by created_at desc
      limit 100
    `,
    sql<Array<{ recorded_at: Date; value_cents: string }>>`
      select value_cents, recorded_at from portfolio_value_snapshots
      where portfolio_id = ${portfolio.id}
      order by recorded_at asc
      limit 500
    `,
    sql<Array<{ targets_json: string }>>`
      select targets_json from portfolio_allocation_targets where portfolio_id = ${portfolio.id}
    `,
  ]);
  const toNumber = (value: string | null) => (value === null ? null : Number(value));
  const isPractice = portfolio.kind === "practice";

  return {
    lifeEvents,
    allocation: allocationRows[0]
      ? (JSON.parse(allocationRows[0].targets_json) as AllocationTarget[])
      : defaultAllocationTargets,
    allowFractional: isPractice || allowsFractionalShares(gradeLevel),
    activity: activity.map((row) => ({
      amountCents: toNumber(row.amount_cents),
      byOwner: row.actor_user_id === portfolio.user_id,
      cashAfterCents: toNumber(row.cash_after_cents),
      createdAt: new Date(row.created_at).toISOString(),
      id: row.id,
      kind: row.kind,
      note: row.note,
      priceCents: toNumber(row.price_cents),
      quantityUnits: toNumber(row.quantity_units),
      ticker: row.ticker,
    })),
    cashCents: state.cashCents,
    className: portfolio.class_name,
    createdAt: new Date(portfolio.created_at).toISOString(),
    gradeLevel,
    history: history.map((row) => ({
      recordedAt: new Date(row.recorded_at).toISOString(),
      valueCents: Number(row.value_cents),
    })),
    holdings: state.holdings.map((holding) => ({
      averageCostCents: holding.averageCostCents,
      name: holding.name,
      priceCents: prices[holding.ticker] ?? Math.round(holding.averageCostCents),
      quantityUnits: holding.quantityUnits,
      ticker: holding.ticker,
      valueCents: Math.round(
        (holding.quantityUnits * (prices[holding.ticker] ?? holding.averageCostCents)) / 10_000
      ),
    })),
    id: portfolio.id,
    kind: portfolio.kind,
    market: {
      clock: market.clock,
      scenarioLabel: market.scenarioLabel,
      simulationMode: market.config.simulationMode,
      symbols: adjustedSymbols.map((symbol) => ({
        changePercent: symbol.changePercent,
        name: symbol.name,
        news: symbol.news ?? null,
        priceCents: priceToCents(symbol.price),
        ticker: symbol.ticker,
      })),
    },
    readOnly,
    resetCount: portfolio.reset_count,
    schoolYear: portfolio.school_year,
    startingCashCents: Number(portfolio.starting_cash_cents),
    valueCents: portfolioValueCents(state, prices),
  };
}

/** The user's whole profile: every portfolio, newest school year first. */
/**
 * Just the live market for one of the user's portfolios: current prices and
 * the clock. The Market screen polls this every few seconds (v0.2.12).
 */
export async function getPortfolioLiveMarket(user: AuthenticatedUser, portfolioId: string) {
  requireDatabase();

  const portfolio = await loadPortfolioRow(getSql(), portfolioId);

  if (!portfolio || portfolio.user_id !== user.id) throw new PortfolioError("Portfolio not found.", 404);

  const [{ state: market, symbols }, lifeEvents] = await Promise.all([
    marketPrices(portfolio.class_name, portfolio.user_id),
    listStudentLifeEvents(portfolio.user_id, portfolio.id),
  ]);

  return {
    // Cash and life events too (v0.2.17), so a card a teacher just played
    // shows up on the student's screen without a reload.
    cashCents: Number(portfolio.cash_cents),
    clock: market.clock,
    lifeEvents,
    scenarioLabel: market.scenarioLabel,
    simulationMode: market.config.simulationMode,
    symbols: symbols.map((symbol) => ({
      changePercent: symbol.changePercent,
      name: symbol.name,
      news: symbol.news ?? null,
      priceCents: priceToCents(symbol.price),
      ticker: symbol.ticker,
    })),
  };
}

export async function getProfilePortfolios(user: AuthenticatedUser) {
  requireDatabase();
  await ensureCurrentPortfolios(user);

  const rows = await getSql()<Array<{ id: string }>>`
    select id from student_portfolios
    where user_id = ${user.id}
    order by school_year desc, kind asc, class_name asc
  `;

  return Promise.all(rows.map((row) => getPortfolioDetail(row.id)));
}

/** Who actually did it: the admin when viewing as the student. */
function actorId(user: AuthenticatedUser) {
  return user.actingAdmin?.id ?? user.id;
}

/** Marks actions an admin took while viewing as the student. */
function onBehalfNote(user: AuthenticatedUser) {
  if (!user.actingAdmin) return "";

  const name = `${user.actingAdmin.firstName} ${user.actingAdmin.lastName}`.trim();
  return `By admin ${name || user.actingAdmin.email} on the student's behalf`;
}

async function requireOwnedWritablePortfolio(sql: Sql, portfolioId: string, user: AuthenticatedUser) {
  const portfolio = await loadPortfolioRow(sql, portfolioId, true);

  if (!portfolio || portfolio.user_id !== user.id) {
    throw new PortfolioError("Portfolio not found.", 404);
  }

  if (await isReadOnly(portfolio)) {
    throw new PortfolioError(
      "This portfolio is from a school year that has ended. It's a read-only record.",
      409
    );
  }

  return portfolio;
}

export async function executeTrade(
  user: AuthenticatedUser,
  // max: buy as many whole shares as the portfolio's cash covers (v0.2.14).
  input: { max?: boolean; portfolioId: string; shares: number; side: TradeSide; ticker: string }
) {
  requireDatabase();

  if (input.side !== "buy" && input.side !== "sell") {
    throw new PortfolioError("Choose buy or sell.", 400);
  }

  const ticker = String(input.ticker ?? "").trim().toUpperCase();

  await getSql().begin(async (tx) => {
    const portfolio = await requireOwnedWritablePortfolio(tx, input.portfolioId, user);
    const [{ prices, state: market }, gradeLevel, before] = await Promise.all([
      marketPrices(portfolio.class_name, portfolio.user_id),
      getClassGradeLevel(portfolio.class_name),
      loadState(tx, portfolio),
    ]);
    // No trading while the class market is paused or closed (v0.2.12).
    const blocked = tradingBlockedReason(market.clock);

    if (blocked) throw new PortfolioError(blocked, 409);

    const symbol = market.symbols.find((item) => item.ticker === ticker);

    if (!symbol) {
      throw new PortfolioError(`${ticker || "That symbol"} isn't available in this class's market.`, 400);
    }

    let shares = Number(input.shares);

    if (input.max) {
      if (input.side !== "buy") throw new PortfolioError("Buy max only works for buying.", 400);

      // Worked out here, at the price the trade will use, because prices move.
      shares = maxWholeShares(before.cashCents, prices[ticker]);

      if (shares < 1) {
        throw new PortfolioError(`You don't have enough cash to buy a whole share of ${ticker}.`, 400);
      }
    }

    const result = applyTrade(before, {
      allowFractional: portfolio.kind === "practice" || allowsFractionalShares(gradeLevel),
      name: symbol.name,
      priceCents: prices[ticker],
      shares,
      side: input.side,
      ticker,
    });

    if (!result.ok) {
      throw new PortfolioError(tradeErrorMessages[result.error], 400);
    }

    await writeState(tx, portfolio.id, before, result.state);
    await recordActivity(tx, {
      actorUserId: actorId(user),
      amountCents: result.amountCents,
      cashAfterCents: result.state.cashCents,
      kind: input.side,
      note: onBehalfNote(user),
      portfolioId: portfolio.id,
      priceCents: prices[ticker],
      quantityUnits: result.quantityUnits,
      ticker,
    });
    await recordSnapshot(
      tx,
      portfolio.id,
      portfolioValueCents(result.state, prices),
      result.state.cashCents
    );
  });

  return getPortfolioDetail(input.portfolioId);
}

export async function saveAllocationTargets(
  user: AuthenticatedUser,
  portfolioId: string,
  targets: AllocationTarget[]
) {
  requireDatabase();

  await getSql().begin(async (tx) => {
    const portfolio = await requireOwnedWritablePortfolio(tx, portfolioId, user);
    const total = targets.reduce((sum, target) => sum + target.value, 0);

    await tx`
      insert into portfolio_allocation_targets (portfolio_id, targets_json, updated_at)
      values (${portfolio.id}, ${JSON.stringify(targets)}, ${new Date()})
      on conflict (portfolio_id) do update set
        targets_json = excluded.targets_json, updated_at = excluded.updated_at
    `;
    await recordActivity(tx, {
      actorUserId: actorId(user),
      cashAfterCents: Number(portfolio.cash_cents),
      kind: "allocation",
      note:
        (total === 100
          ? "Saved a balanced target mix"
          : `Saved draft targets (${total}%) for teacher review`) +
        (user.actingAdmin ? `. ${onBehalfNote(user)}` : ""),
      portfolioId: portfolio.id,
    });
  });

  return getPortfolioDetail(portfolioId);
}

// ------------------------------------------- admin: lookups and corrections

/** A student's portfolio for a class in the current school year. */
export async function findCurrentClassPortfolio(studentEmail: string, className?: string) {
  requireDatabase();

  const sql = getSql();
  const [student] = await sql<Array<{ id: string }>>`
    select id from app_users where lower(email) = ${studentEmail.trim().toLowerCase()}
  `;

  if (!student) throw new PortfolioError(`No user was found with the email ${studentEmail}.`, 404);

  const schoolYear = schoolYearFor(new Date(), await getSchoolYearSettings()).label;
  const rows = await sql<PortfolioRow[]>`
    select * from student_portfolios
    where user_id = ${student.id} and school_year = ${schoolYear} and kind = 'class'
      and (${className ?? null}::text is null or class_name = ${className ?? null})
    order by class_name
  `;

  if (rows.length === 0) {
    throw new PortfolioError(
      `${studentEmail} doesn't have a class portfolio this school year yet (it's created the first time they sign in).`,
      404
    );
  }

  if (rows.length > 1 && !className) {
    throw new PortfolioError(
      `${studentEmail} has portfolios in more than one class. Choose the class.`,
      409
    );
  }

  return rows[0];
}

export async function applyPortfolioCorrection(input: {
  actor: AuthenticatedUser;
  adjustmentCents: number;
  className?: string;
  reason: string;
  studentEmail: string;
}) {
  requireDatabase();

  if (!Number.isInteger(input.adjustmentCents) || input.adjustmentCents === 0) {
    throw new PortfolioError("Enter a non-zero adjustment amount.", 400);
  }

  if (!input.reason.trim()) throw new PortfolioError("An audit reason is required.", 400);

  const target = await findCurrentClassPortfolio(input.studentEmail, input.className);
  let before = 0;
  let after = 0;

  await getSql().begin(async (tx) => {
    const portfolio = await loadPortfolioRow(tx, target.id, true);

    if (!portfolio) throw new PortfolioError("Portfolio not found.", 404);

    before = Number(portfolio.cash_cents);
    after = before + input.adjustmentCents;

    if (after < 0) {
      throw new PortfolioError("That correction would make the cash balance negative.", 400);
    }

    const { prices } = await marketPrices(portfolio.class_name, portfolio.user_id);
    const state = await loadState(tx, portfolio);
    const newState = { ...state, cashCents: after };

    await tx`
      update student_portfolios set cash_cents = ${after}, updated_at = ${new Date()}
      where id = ${portfolio.id}
    `;
    await tx`
      insert into portfolio_corrections (
        id, portfolio_id, corrected_by_user_id, correction_type,
        before_snapshot_json, after_snapshot_json, audit_reason, corrected_at
      )
      values (
        ${id("correction")}, ${portfolio.id}, ${input.actor.id}, 'cash_adjustment',
        ${JSON.stringify({ cashCents: before })}, ${JSON.stringify({ cashCents: after })},
        ${input.reason.trim()}, ${new Date()}
      )
    `;
    await recordActivity(tx, {
      actorUserId: input.actor.id,
      amountCents: input.adjustmentCents,
      cashAfterCents: after,
      kind: "correction",
      note: `Admin correction: ${input.reason.trim()}`,
      portfolioId: portfolio.id,
    });
    await recordSnapshot(tx, portfolio.id, portfolioValueCents(newState, prices), after);
  });

  return { afterCents: after, beforeCents: before, portfolioId: target.id };
}

/**
 * Moves a class portfolio's cash by an amount, inside a transaction, and
 * records the activity and a value snapshot. Used by life events (v0.2.17).
 * Returns the cash before and after. Negative balances are allowed here; the
 * caller decides whether they should be.
 */
export async function adjustCashInTransaction(
  tx: Sql,
  input: {
    actorUserId: string | null;
    amountCents: number;
    kind: "life_event" | "life_event_undo";
    note: string;
    portfolioId: string;
  }
) {
  const portfolio = await loadPortfolioRow(tx, input.portfolioId, true);

  if (!portfolio) throw new PortfolioError("Portfolio not found.", 404);

  const before = Number(portfolio.cash_cents);
  const after = before + input.amountCents;
  const { prices } = await marketPrices(portfolio.class_name, portfolio.user_id);
  const state = await loadState(tx, portfolio);

  await tx`
    update student_portfolios set cash_cents = ${after}, updated_at = ${new Date()}
    where id = ${portfolio.id}
  `;
  await recordActivity(tx, {
    actorUserId: input.actorUserId,
    amountCents: input.amountCents,
    cashAfterCents: after,
    kind: input.kind,
    note: input.note,
    portfolioId: portfolio.id,
  });
  await recordSnapshot(tx, portfolio.id, portfolioValueCents({ ...state, cashCents: after }, prices), after);

  return { afterCents: after, beforeCents: before };
}

/** Every student's current class portfolio for a class, with starting cash. */
export type ClassPortfolioRow = {
  cash_cents: string; email: string; first_name: string; id: string; last_name: string; starting_cash_cents: string; user_id: string;
};

export async function listClassPortfolios(className: string): Promise<ClassPortfolioRow[]> {
  requireDatabase();

  const now = new Date();
  const schoolYear = schoolYearFor(now, await getSchoolYearSettings()).label;
  const sql = getSql();

  // Students who haven't signed in yet have no portfolio. Open one for them
  // now, so a class-wide event reaches everyone in the class.
  const missing = await sql<Array<{ id: string }>>`
    select distinct u.id from app_users u
    join role_assignments ra on ra.user_id = u.id and ra.role = 'Student' and ra.scope = ${className}
    where u.status = 'active'
      and not exists (
        select 1 from student_portfolios p
        where p.user_id = u.id and p.class_name = ${className} and p.school_year = ${schoolYear} and p.kind = 'class'
      )
  `;

  if (missing.length > 0) {
    const startingCashCents = (await getClassMarketConfig(className)).startingCashCents;

    for (const student of missing) {
      const portfolioId = id("portfolio");
      const inserted = await sql`
        insert into student_portfolios (
          id, user_id, class_name, school_year, kind, starting_cash_cents, cash_cents, created_at, updated_at
        )
        values (${portfolioId}, ${student.id}, ${className}, ${schoolYear}, 'class', ${startingCashCents}, ${startingCashCents}, ${now}, ${now})
        on conflict (user_id, class_name, school_year, kind) do nothing
        returning id
      `;

      if (inserted.length > 0) {
        await recordActivity(sql, {
          actorUserId: student.id,
          cashAfterCents: startingCashCents,
          kind: "opened",
          note: `Portfolio opened with $${(startingCashCents / 100).toFixed(2)}`,
          portfolioId,
        });
        await recordSnapshot(sql, portfolioId, startingCashCents, startingCashCents);
      }
    }
  }
  const rows = await getSql()<
    Array<{ cash_cents: string; email: string; first_name: string; id: string; last_name: string; starting_cash_cents: string; user_id: string }>
  >`
    select p.id, p.user_id, p.cash_cents, p.starting_cash_cents, u.email, u.first_name, u.last_name
    from student_portfolios p join app_users u on u.id = p.user_id
    where p.class_name = ${className} and p.school_year = ${schoolYear} and p.kind = 'class'
      and u.status = 'active'
    order by u.last_name, u.first_name
  `;

  return [...rows];
}

// ---------------------------------------------------- reset requests (queue)

/** Students in the teacher's classes, with their current class portfolios. */
export async function listTeacherStudents(teacher: AuthenticatedUser) {
  requireDatabase();

  const classes = teacher.role === "Admin" ? null : teacher.classNames;

  return getSql()<Array<{ class_name: string; email: string; first_name: string; id: string; last_name: string }>>`
    select distinct app_users.id, app_users.email, app_users.first_name, app_users.last_name,
      role_assignments.scope as class_name
    from app_users
    join role_assignments on role_assignments.user_id = app_users.id
    where role_assignments.role = 'Student'
      and app_users.status = 'active'
      and (${classes === null} or role_assignments.scope = any(${classes ?? []}))
    order by class_name, app_users.last_name, app_users.first_name
  `;
}

export async function createResetRequest(input: {
  className: string;
  reason: string;
  requester: AuthenticatedUser;
  studentEmail: string;
}) {
  requireDatabase();

  if (!input.reason.trim()) throw new PortfolioError("Give a reason for the reset.", 400);

  if (input.requester.role !== "Admin" && !input.requester.classNames.includes(input.className)) {
    throw new PortfolioError("You can only request resets for students in your classes.", 403);
  }

  const portfolio = await findCurrentClassPortfolio(input.studentEmail, input.className);
  const sql = getSql();
  const [pending] = await sql<Array<{ id: string }>>`
    select id from portfolio_reset_requests
    where portfolio_id = ${portfolio.id} and status = 'pending'
  `;

  if (pending) {
    throw new PortfolioError("There's already a pending reset request for this portfolio.", 409);
  }

  const requestId = id("reset-request");

  await sql`
    insert into portfolio_reset_requests (
      id, portfolio_id, student_user_id, requested_by_user_id, reason, status, created_at
    )
    values (
      ${requestId}, ${portfolio.id}, ${portfolio.user_id}, ${input.requester.id},
      ${input.reason.trim()}, 'pending', ${new Date()}
    )
  `;

  return { portfolioId: portfolio.id, requestId };
}

export async function listResetRequests(options: { requestedBy?: string } = {}) {
  requireDatabase();

  const rows = await getSql()<
    Array<{
      class_name: string;
      created_at: Date;
      decided_at: Date | null;
      decision_note: string | null;
      id: string;
      reason: string;
      requester_email: string;
      requester_name: string;
      school_year: string;
      status: string;
      student_email: string;
      student_name: string;
    }>
  >`
    select r.id, r.reason, r.status, r.decision_note, r.created_at, r.decided_at,
      p.class_name, p.school_year,
      s.email as student_email, s.first_name || ' ' || s.last_name as student_name,
      t.email as requester_email, t.first_name || ' ' || t.last_name as requester_name
    from portfolio_reset_requests r
    join student_portfolios p on p.id = r.portfolio_id
    join app_users s on s.id = r.student_user_id
    join app_users t on t.id = r.requested_by_user_id
    where (${options.requestedBy ?? null}::text is null or r.requested_by_user_id = ${options.requestedBy ?? null})
    order by (r.status = 'pending') desc, r.created_at desc
    limit 100
  `;

  return rows.map((row) => ({
    className: row.class_name,
    createdAt: new Date(row.created_at).toISOString(),
    decidedAt: row.decided_at ? new Date(row.decided_at).toISOString() : null,
    decisionNote: row.decision_note,
    id: row.id,
    reason: row.reason,
    requesterEmail: row.requester_email,
    requesterName: row.requester_name,
    schoolYear: row.school_year,
    status: row.status,
    studentEmail: row.student_email,
    studentName: row.student_name,
  }));
}

/**
 * Approve (reset the portfolio to its starting cash) or deny a request. The
 * portfolio's activity keeps the full history, including what it held before.
 */
export async function decideResetRequest(input: {
  actor: AuthenticatedUser;
  approve: boolean;
  note: string;
  requestId: string;
}) {
  requireDatabase();

  let outcome: {
    className: string;
    requesterEmail: string;
    studentEmail: string;
  } | null = null;

  await getSql().begin(async (tx) => {
    const [request] = await tx<
      Array<{ id: string; portfolio_id: string; requested_by_user_id: string; status: string; student_user_id: string }>
    >`
      select id, portfolio_id, status, requested_by_user_id, student_user_id
      from portfolio_reset_requests where id = ${input.requestId} for update
    `;

    if (!request) throw new PortfolioError("Reset request not found.", 404);
    if (request.status !== "pending") {
      throw new PortfolioError("This request has already been decided.", 409);
    }

    const portfolio = await loadPortfolioRow(tx, request.portfolio_id, true);

    if (!portfolio) throw new PortfolioError("Portfolio not found.", 404);

    if (input.approve) {
      const state = await loadState(tx, portfolio);
      const starting = Number(portfolio.starting_cash_cents);
      const previous = state.holdings
        .map((holding) => `${holding.quantityUnits / 10_000} ${holding.ticker}`)
        .join(", ");

      await writeState(tx, portfolio.id, state, { cashCents: starting, holdings: [] });
      await tx`
        update student_portfolios set reset_count = reset_count + 1 where id = ${portfolio.id}
      `;
      await recordActivity(tx, {
        actorUserId: input.actor.id,
        cashAfterCents: starting,
        kind: "reset",
        note:
          `Reset to $${(starting / 100).toFixed(2)} by admin at the teacher's request. ` +
          `Before: $${(state.cashCents / 100).toFixed(2)} cash${previous ? `, ${previous}` : ""}.` +
          (input.note.trim() ? ` Note: ${input.note.trim()}` : ""),
        portfolioId: portfolio.id,
      });
      await recordSnapshot(tx, portfolio.id, starting, starting);
    }

    await tx`
      update portfolio_reset_requests set
        status = ${input.approve ? "approved" : "denied"},
        decided_by_user_id = ${input.actor.id},
        decision_note = ${input.note.trim() || null},
        decided_at = ${new Date()}
      where id = ${request.id}
    `;

    const [people] = await tx<Array<{ requester_email: string; student_email: string }>>`
      select t.email as requester_email, s.email as student_email
      from app_users t, app_users s
      where t.id = ${request.requested_by_user_id} and s.id = ${request.student_user_id}
    `;

    outcome = {
      className: portfolio.class_name,
      requesterEmail: people.requester_email,
      studentEmail: people.student_email,
    };
  });

  return outcome as unknown as { className: string; requesterEmail: string; studentEmail: string };
}

/** Turns errors from this module into JSON responses for the API routes. */
export function portfolioErrorResponse(error: unknown) {
  if (error instanceof PortfolioError) {
    return Response.json({ message: error.message, ok: false }, { status: error.status });
  }

  console.error("Portfolio request failed.", error);
  return Response.json(
    { message: "The portfolio request could not be completed.", ok: false },
    { status: 500 }
  );
}
