/**
 * Trading rules for simulated portfolios. Pure functions (no database), so
 * they're easy to test and the same rules apply everywhere.
 *
 * Units, to avoid rounding errors with fractional shares:
 * - money is in whole cents;
 * - quantities are in "units" of 1/10,000 of a share (1 share = 10,000).
 */

export const UNITS_PER_SHARE = 10_000;
export const FRACTIONAL_MIN_GRADE = 10;

export type Holding = {
  averageCostCents: number; // per share, may have fractions of a cent
  name: string;
  quantityUnits: number;
  ticker: string;
};

export type PortfolioState = {
  cashCents: number;
  holdings: Holding[];
};

export type TradeSide = "buy" | "sell";

export type TradeError =
  | "invalid_quantity"
  | "whole_shares_only"
  | "insufficient_cash"
  | "insufficient_shares"
  | "invalid_price";

export const tradeErrorMessages: Record<TradeError, string> = {
  insufficient_cash: "Not enough cash for that trade.",
  insufficient_shares: "You don't own that many shares.",
  invalid_price: "That symbol doesn't have a price right now.",
  invalid_quantity: "Enter a number of shares greater than 0 (up to 4 decimal places).",
  whole_shares_only: "This class trades whole shares only.",
};

/** Fractional shares are allowed for grade 10 and above. */
export function allowsFractionalShares(gradeLevel: number | null | undefined) {
  return typeof gradeLevel === "number" && gradeLevel >= FRACTIONAL_MIN_GRADE;
}

/**
 * Grade level from a class name like "7th Grade Finance A" or "Grade 11
 * Economics". Returns null when the name doesn't say (admins set it).
 */
export function gradeLevelFromClassName(className: string): number | null {
  const ordinal = /\b(\d{1,2})(?:st|nd|rd|th)\s*grade\b/i.exec(className);
  const prefixed = /\bgrade\s*(\d{1,2})\b/i.exec(className);
  const grade = Number((ordinal ?? prefixed)?.[1]);

  return grade >= 1 && grade <= 12 ? grade : null;
}

/** Shares (e.g. 2.5) → units (25,000). Null if not a valid quantity. */
export function sharesToUnits(shares: number): number | null {
  if (!Number.isFinite(shares) || shares <= 0) return null;

  const units = Math.round(shares * UNITS_PER_SHARE);

  // More than 4 decimal places, or rounds to zero.
  if (units <= 0 || Math.abs(units / UNITS_PER_SHARE - shares) > 1e-9) return null;

  return units;
}

export function unitsToShares(units: number) {
  return units / UNITS_PER_SHARE;
}

export function priceToCents(price: number) {
  return Math.round(price * 100);
}

/** Cost of a quantity at a price, rounded to the nearest cent. */
/** Buy max (v0.2.14): the most whole shares this much cash can buy. */
export function maxWholeShares(cashCents: number, priceCents: number) {
  if (!Number.isFinite(cashCents) || !Number.isFinite(priceCents) || priceCents <= 0 || cashCents <= 0) return 0;
  return Math.floor(cashCents / priceCents);
}

export function tradeValueCents(quantityUnits: number, priceCents: number) {
  return Math.round((quantityUnits * priceCents) / UNITS_PER_SHARE);
}

export type TradeInput = {
  allowFractional: boolean;
  name: string;
  priceCents: number;
  shares: number;
  side: TradeSide;
  ticker: string;
};

export type TradeResult =
  | { error: TradeError; ok: false }
  | {
      amountCents: number;
      ok: true;
      quantityUnits: number;
      state: PortfolioState;
    };

export function applyTrade(state: PortfolioState, input: TradeInput): TradeResult {
  const quantityUnits = sharesToUnits(input.shares);

  if (quantityUnits === null) return { error: "invalid_quantity", ok: false };

  if (!input.allowFractional && quantityUnits % UNITS_PER_SHARE !== 0) {
    return { error: "whole_shares_only", ok: false };
  }

  if (!Number.isInteger(input.priceCents) || input.priceCents <= 0) {
    return { error: "invalid_price", ok: false };
  }

  const amountCents = tradeValueCents(quantityUnits, input.priceCents);
  const existing = state.holdings.find((holding) => holding.ticker === input.ticker);

  if (input.side === "buy") {
    if (amountCents > state.cashCents) return { error: "insufficient_cash", ok: false };

    const holdings = existing
      ? state.holdings.map((holding) => {
          if (holding.ticker !== input.ticker) return holding;

          const totalUnits = holding.quantityUnits + quantityUnits;
          const averageCostCents =
            (holding.averageCostCents * holding.quantityUnits +
              input.priceCents * quantityUnits) /
            totalUnits;

          return {
            ...holding,
            averageCostCents: Math.round(averageCostCents * 10_000) / 10_000,
            quantityUnits: totalUnits,
          };
        })
      : [
          ...state.holdings,
          {
            averageCostCents: input.priceCents,
            name: input.name,
            quantityUnits,
            ticker: input.ticker,
          },
        ];

    return {
      amountCents,
      ok: true,
      quantityUnits,
      state: { cashCents: state.cashCents - amountCents, holdings },
    };
  }

  if (!existing || existing.quantityUnits < quantityUnits) {
    return { error: "insufficient_shares", ok: false };
  }

  const remaining = existing.quantityUnits - quantityUnits;
  const holdings =
    remaining === 0
      ? state.holdings.filter((holding) => holding.ticker !== input.ticker)
      : state.holdings.map((holding) =>
          holding.ticker === input.ticker
            ? { ...holding, quantityUnits: remaining }
            : holding
        );

  return {
    amountCents,
    ok: true,
    quantityUnits,
    state: { cashCents: state.cashCents + amountCents, holdings },
  };
}

/** Total value: cash plus holdings at the given prices (cents). */
export function portfolioValueCents(
  state: PortfolioState,
  pricesCents: Record<string, number>
) {
  return state.holdings.reduce(
    (total, holding) =>
      total +
      tradeValueCents(
        holding.quantityUnits,
        pricesCents[holding.ticker] ?? Math.round(holding.averageCostCents)
      ),
    state.cashCents
  );
}

// Allocation targets: the categories students plan their mix across.
export const allocationCategories = [
  "Index stocks",
  "Roth IRA",
  "Retirement",
  "IPO lab",
  "Cash buffer",
] as const;

export type AllocationTarget = { name: string; value: number };

export const defaultAllocationTargets: AllocationTarget[] = [
  { name: "Index stocks", value: 44 },
  { name: "Roth IRA", value: 24 },
  { name: "Retirement", value: 20 },
  { name: "IPO lab", value: 6 },
  { name: "Cash buffer", value: 6 },
];

/** Valid targets: the known categories, each a whole number 0–100. */
export function validateAllocationTargets(input: unknown): AllocationTarget[] | null {
  if (!Array.isArray(input)) return null;

  const known = new Set<string>(allocationCategories);
  const seen = new Set<string>();
  const targets: AllocationTarget[] = [];

  for (const item of input) {
    const name = (item as AllocationTarget)?.name;
    const value = (item as AllocationTarget)?.value;

    if (!known.has(name) || seen.has(name)) return null;
    if (!Number.isInteger(value) || value < 0 || value > 100) return null;

    seen.add(name);
    targets.push({ name, value });
  }

  return targets.length === allocationCategories.length ? targets : null;
}
