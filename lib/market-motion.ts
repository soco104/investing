/**
 * How prices move as the class market runs (v0.2.12).
 *
 * motionPercent() is a pure function of (seed, symbol, simulated time): the
 * same inputs always give the same answer. That is what lets the market
 * "run" without storing prices, lets every class on the shared seed see the
 * same run, and will let rewind (v0.2.13) show any earlier moment.
 *
 * The movement is several smooth waves of random heights added together:
 * tiny fast ones (seconds to minutes) and larger slow ones (hours to days).
 */

/** One shared run for the whole district, like one real market. */
export const SHARED_MARKET_SEED = "futurefund-shared-market";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

// period = how long each wave lasts; percent = how far it can push the price.
const waves = [
  { percent: 0.02, period: 10 * SECOND },
  { percent: 0.05, period: MINUTE },
  { percent: 0.15, period: 10 * MINUTE },
  { percent: 0.4, period: HOUR },
  { percent: 0.8, period: 6 * HOUR },
  { percent: 1.5, period: 48 * HOUR },
];

/** The most the price can be moved, in percent, at volatility 1. */
export const MAX_MOTION_PERCENT = waves.reduce((total, wave) => total + wave.percent, 0);

// Deterministic "random" number from -1 to 1 for a piece of text.
function hashUnit(text: string) {
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  hash ^= hash >>> 15;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;

  return ((hash >>> 0) / 4294967295) * 2 - 1;
}

/** Percent to move a symbol's price at a simulated time. 0 when volatility is 0. */
export function motionPercent(seed: string, ticker: string, simMs: number, volatility = 1) {
  if (!Number.isFinite(simMs) || volatility <= 0) return 0;

  let total = 0;

  for (const wave of waves) {
    const position = simMs / wave.period;
    const step = Math.floor(position);
    const within = position - step;
    const ease = within * within * (3 - 2 * within); // smooth start and end
    const from = hashUnit(`${seed}|${ticker}|${wave.period}|${step}`);
    const to = hashUnit(`${seed}|${ticker}|${wave.period}|${step + 1}`);

    total += (from + (to - from) * ease) * wave.percent;
  }

  return total * volatility;
}
