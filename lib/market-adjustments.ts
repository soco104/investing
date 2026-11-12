/**
 * Teacher market changes, as pure functions (no database).
 *
 * A change moves one symbol's price by a percentage, for a whole class or
 * only some students in it. Active changes stack: two +3% raises make the
 * price 1.03 × 1.03 of the simulator's price.
 */

export type MarketAdjustment = {
  createdAt: string;
  id: string;
  label: string;
  news: string;
  percent: number;
  /** null = the whole class; otherwise only these students. */
  studentUserIds: string[] | null;
  ticker: string;
};

export type PricedSymbol = {
  changePercent: number;
  name: string;
  news?: string;
  price: number;
  ticker: string;
};

export const PRICE_STEP_PERCENT = 3;
export const MAX_OIL_SPIKE_PERCENT = 60;

/** Does this change apply to this viewer? (null viewer = class-wide view.) */
export function adjustmentAppliesTo(adjustment: MarketAdjustment, studentUserId: string | null) {
  if (adjustment.studentUserIds === null) return true;
  return studentUserId !== null && adjustment.studentUserIds.includes(studentUserId);
}

/**
 * Applies active changes to the simulator's prices for one viewer. The news
 * shown is the most recent applicable change's news for that symbol.
 */
export function applyAdjustments<T extends PricedSymbol>(
  symbols: T[],
  adjustments: MarketAdjustment[],
  studentUserId: string | null
): T[] {
  const ordered = [...adjustments].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return symbols.map((symbol) => {
    const applicable = ordered.filter(
      (adjustment) =>
        adjustment.ticker === symbol.ticker && adjustmentAppliesTo(adjustment, studentUserId)
    );

    if (applicable.length === 0) return symbol;

    const factor = applicable.reduce(
      (total, adjustment) => total * (1 + adjustment.percent / 100),
      1
    );
    const latestNews = [...applicable].reverse().find((adjustment) => adjustment.news)?.news;

    return {
      ...symbol,
      changePercent: Math.round((symbol.changePercent + (factor - 1) * 100) * 100) / 100,
      news: latestNews ?? symbol.news,
      price: Math.max(0.01, Math.round(symbol.price * factor * 100) / 100),
    };
  });
}

/** Travel symbols fall when oil spikes; everything else selected rises. */
export function isTravelSymbol(ticker: string, name: string) {
  return ticker === "JETS" || /airline|travel|cruise/i.test(name);
}

/** The Strait of Hormuz blockade: per-symbol moves for the chosen symbols. */
export function hormuzMoves(
  symbols: Array<{ name: string; ticker: string }>,
  oilSpikePercent: number
) {
  const spike = Math.max(1, Math.min(MAX_OIL_SPIKE_PERCENT, Math.round(oilSpikePercent)));

  return symbols.map((symbol) => ({
    percent: isTravelSymbol(symbol.ticker, symbol.name) ? -Math.round(spike * 0.45) : spike,
    ticker: symbol.ticker,
  }));
}
