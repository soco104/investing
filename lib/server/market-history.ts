import { applyAdjustments, type MarketAdjustment } from "@/lib/market-adjustments";
import { isClockHours, isClockSpeed } from "@/lib/market-clock";
import {
  activeAt,
  clockAt,
  clockEventLabels,
  normalizeRange,
  sampleTimes,
  type ClockEvent,
} from "@/lib/market-history";
import type { AuthenticatedUser } from "@/lib/server/auth";
import { buildClassMarketState } from "@/lib/server/market-engine";
import { PortfolioError } from "@/lib/server/portfolios-errors";
import { defaultDistrictId, getClassMarketConfig, getSql, hasProductionDatabase } from "@/lib/server/repository";

/**
 * Market rewind (v0.2.13): a class's prices over a chosen timeframe, worked
 * out again from the clock log and the saved teacher changes. View-only.
 *
 * Known limit: the class's scenario and volatility are not recorded over
 * time, so the past is drawn with today's settings (see docs/roadmap.md).
 */

/** When the running market's history begins (nothing moved before then). */
export async function getHistoryStartMs() {
  const sql = getSql();
  const nowMs = Date.now();
  // Kept as milliseconds in "details": the earliest clock change on record,
  // or the first time anyone asked (a new site has no history before that).
  const [row] = await sql<Array<{ details: string | null }>>`
    insert into maintenance_runs (name, last_run_at, details)
    select 'running_market_started', ${new Date(nowMs)},
      coalesce((select min(real_ms) from class_market_clock_events)::text, ${String(nowMs)})
    on conflict (name) do update set name = excluded.name
    returning details
  `;
  const startMs = Number(row?.details);

  return Number.isFinite(startMs) && startMs > 0 ? startMs : nowMs;
}

// Times are read as milliseconds worked out by the database, so they don't
// depend on the server's time zone.
type QuoteRow = { change_percent: number; fetched_ms: string; name: string; price: number; ticker: string };

/** Each symbol's provider quote as it stood at a moment (or its earliest one). */
function quotesAt(rows: QuoteRow[], atMs: number) {
  const chosen = new Map<string, QuoteRow>();
  const timeOf = (row: QuoteRow) => Number(row.fetched_ms);

  for (const row of rows) {
    const current = chosen.get(row.ticker);

    if (!current) {
      chosen.set(row.ticker, row);
      continue;
    }

    const rowIsPast = timeOf(row) <= atMs;
    const currentIsPast = timeOf(current) <= atMs;

    // Best: the newest quote at or before the moment. Otherwise the earliest.
    if (rowIsPast && (!currentIsPast || timeOf(row) > timeOf(current))) chosen.set(row.ticker, row);
    else if (!rowIsPast && !currentIsPast && timeOf(row) < timeOf(current)) chosen.set(row.ticker, row);
  }

  return [...chosen.values()].map((row) => ({
    changePercent: Number(row.change_percent),
    name: row.name,
    price: Number(row.price),
    ticker: row.ticker,
  }));
}

export type HistoryEvent = { at: string; detail: string; kind: "clock" | "change" | "undo"; label: string };

export async function getClassMarketHistory(
  user: AuthenticatedUser,
  input: { className: string; fromMs: number; ticker?: string | null; toMs: number }
) {
  if (!hasProductionDatabase()) throw new PortfolioError("Market history needs a database (DATABASE_URL).", 503);

  const className = input.className.trim();
  const allowed = user.role === "Admin" || (user.role === "Teacher" && user.classNames.includes(className));

  if (!className || !allowed) {
    throw new PortfolioError("You can only look at market history for your own classes.", 403);
  }

  const nowMs = Date.now();
  const startMs = await getHistoryStartMs();
  const checked = normalizeRange({ fromMs: input.fromMs, nowMs, startMs, toMs: input.toMs });

  if (!checked.ok) throw new PortfolioError(checked.message, 400);

  const { fromMs, toMs } = checked.range;
  const sql = getSql();
  const [config, clockRows, adjustmentRows, quoteRows] = await Promise.all([
    getClassMarketConfig(className),
    sql<Array<{ action: string; hours: string; real_ms: string; sim_ms: string; speed: number; status: string }>>`
      select action, status, speed, hours, sim_ms, real_ms from class_market_clock_events
      where district_id = ${defaultDistrictId} and class_name = ${className} and real_ms <= ${toMs}
      order by real_ms asc
      limit 5000
    `,
    sql<
      Array<{
        cleared_ms: string | null; created_ms: string; event_id: string; id: string; label: string;
        news: string; percent: string; student_user_ids_json: string | null; ticker: string;
      }>
    >`
      select id, event_id, ticker, percent, label, news, student_user_ids_json,
        extract(epoch from created_at) * 1000 as created_ms,
        extract(epoch from cleared_at) * 1000 as cleared_ms
      from market_adjustments
      where class_name = ${className} and created_at <= ${new Date(toMs)}
        and (cleared_at is null or cleared_at >= ${new Date(fromMs)})
      order by created_at asc
      limit 2000
    `,
    // Provider quotes: the newest before the timeframe, and those inside it.
    sql<QuoteRow[]>`
      (select distinct on (ticker) ticker, name, price, change_percent, extract(epoch from fetched_at) * 1000 as fetched_ms from market_quotes
        where target_class = ${className} and fetched_at <= ${new Date(fromMs)}
        order by ticker, fetched_at desc)
      union all
      (select ticker, name, price, change_percent, extract(epoch from fetched_at) * 1000 as fetched_ms from market_quotes
        where target_class = ${className} and fetched_at > ${new Date(fromMs)} and fetched_at <= ${new Date(toMs)}
        order by fetched_at desc limit 5000)
      union all
      (select distinct on (ticker) ticker, name, price, change_percent, extract(epoch from fetched_at) * 1000 as fetched_ms from market_quotes
        where target_class = ${className}
        order by ticker, fetched_at asc)
    `,
  ]);

  const clockEvents: ClockEvent[] = clockRows.map((row) => ({
    action: row.action,
    hours: isClockHours(row.hours) ? row.hours : "always",
    realMs: Number(row.real_ms),
    simMs: Number(row.sim_ms),
    speed: isClockSpeed(row.speed) ? row.speed : 1,
    status: row.status === "paused" ? "paused" : "running",
  }));
  const adjustments = adjustmentRows.map((row) => ({
    adjustment: {
      createdAt: new Date(Number(row.created_ms)).toISOString(),
      id: row.id,
      label: row.label,
      news: row.news,
      percent: Number(row.percent),
      studentUserIds: row.student_user_ids_json ? (JSON.parse(row.student_user_ids_json) as string[]) : null,
      ticker: row.ticker,
    } satisfies MarketAdjustment,
    clearedMs: row.cleared_ms === null ? null : Math.round(Number(row.cleared_ms)),
    createdMs: Math.round(Number(row.created_ms)),
    eventId: row.event_id,
  }));
  // The chart shows the whole-class price, so only class-wide changes move it.
  const classWide = adjustments.filter((item) => item.adjustment.studentUserIds === null);
  const stepTimes = [
    ...clockEvents.map((event) => event.realMs),
    ...classWide.flatMap((item) => (item.clearedMs === null ? [item.createdMs] : [item.createdMs, item.clearedMs])),
  ];
  const wanted = input.ticker?.trim().toUpperCase() || null;
  const series = new Map<string, { name: string; points: Array<{ at: string; price: number }>; ticker: string }>();

  for (const atMs of sampleTimes({ fromMs, toMs }, stepTimes)) {
    const state = buildClassMarketState({
      className,
      clock: clockAt(clockEvents, atMs),
      config,
      nowMs: atMs,
      quotes: quotesAt(quoteRows, atMs),
    });
    const symbols = applyAdjustments(
      state.symbols.map((symbol) => ({
        changePercent: symbol.simulatedChangePercent,
        name: symbol.name,
        price: symbol.simulatedPrice,
        ticker: symbol.ticker,
      })),
      classWide.filter((item) => activeAt(item.createdMs, item.clearedMs, atMs)).map((item) => item.adjustment),
      null
    );

    for (const symbol of symbols) {
      if (wanted && symbol.ticker !== wanted) continue;

      const entry = series.get(symbol.ticker) ?? { name: symbol.name, points: [], ticker: symbol.ticker };
      entry.points.push({ at: new Date(atMs).toISOString(), price: symbol.price });
      series.set(symbol.ticker, entry);
    }
  }

  if (wanted && series.size === 0) throw new PortfolioError("That symbol isn't in this class market.", 404);

  // What happened in the timeframe, oldest first.
  const events: HistoryEvent[] = [];
  const inRange = (ms: number) => ms >= fromMs && ms <= toMs;

  for (const event of clockEvents) {
    if (!inRange(event.realMs)) continue;
    events.push({
      at: new Date(event.realMs).toISOString(),
      detail: "Whole class",
      kind: "clock",
      label: (clockEventLabels[event.action] ?? (() => "Clock changed"))(event),
    });
  }

  const seen = new Set<string>();

  for (const item of adjustments) {
    if (seen.has(item.eventId)) continue;
    seen.add(item.eventId);

    const detail = item.adjustment.studentUserIds === null ? "Whole class" : "Some students only (not shown on the chart)";

    if (inRange(item.createdMs)) {
      events.push({ at: new Date(item.createdMs).toISOString(), detail, kind: "change", label: item.adjustment.label });
    }

    if (item.clearedMs !== null && inRange(item.clearedMs)) {
      events.push({ at: new Date(item.clearedMs).toISOString(), detail, kind: "undo", label: `Undid: ${item.adjustment.label}` });
    }
  }

  events.sort((a, b) => a.at.localeCompare(b.at));

  return {
    className,
    events,
    from: new Date(fromMs).toISOString(),
    historyStart: new Date(startMs).toISOString(),
    series: [...series.values()].sort((a, b) => a.ticker.localeCompare(b.ticker)),
    to: new Date(toMs).toISOString(),
  };
}
