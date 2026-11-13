/**
 * The class market clock (v0.2.12). Each class's market has its own
 * simulated time. Prices are a pure calculation from that time (see
 * lib/market-motion.ts), so nothing is written to the database as the market
 * moves: only teacher actions (pause, resume, speed, hours) are stored.
 *
 * Simulated time = simAnchor + (open real time since realAnchor) x speed
 * while running, and stays at simAnchor while paused.
 */

export type ClockStatus = "running" | "paused";
export type ClockHours = "always" | "us_market";
export type ClockSpeed = 1 | 2 | 5 | 10;

export const CLOCK_SPEEDS: ClockSpeed[] = [1, 2, 5, 10];

export type MarketClock = {
  hours: ClockHours;
  realAnchorMs: number;
  simAnchorMs: number;
  speed: ClockSpeed;
  status: ClockStatus;
};

/** A class with no saved clock: always open, 1x, simulated time = real time. */
export function defaultClock(nowMs: number): MarketClock {
  return { hours: "always", realAnchorMs: nowMs, simAnchorMs: nowMs, speed: 1, status: "running" };
}

export function isClockSpeed(value: unknown): value is ClockSpeed {
  return value === 1 || value === 2 || value === 5 || value === 10;
}

export function isClockHours(value: unknown): value is ClockHours {
  return value === "always" || value === "us_market";
}

// ------------------------------------------------------- U.S. market hours

const OPEN_MINUTES = 9 * 60 + 30; // 9:30 AM Eastern
const CLOSE_MINUTES = 16 * 60; // 4:00 PM Eastern
const DAY_MS = 24 * 60 * 60 * 1000;

const easternFormat = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  hourCycle: "h23",
  minute: "numeric",
  month: "numeric",
  timeZone: "America/New_York",
  weekday: "short",
  year: "numeric",
});

function easternParts(ms: number) {
  const parts = Object.fromEntries(easternFormat.formatToParts(new Date(ms)).map((part) => [part.type, part.value]));

  return {
    day: Number(parts.day),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    month: Number(parts.month),
    weekday: parts.weekday, // "Mon" ... "Sun"
    year: Number(parts.year),
  };
}

/** The instant of a wall-clock time in New York on a given date (handles daylight saving). */
function easternInstant(year: number, month: number, day: number, minutes: number) {
  for (const offsetHours of [4, 5]) {
    const guess = Date.UTC(year, month - 1, day, 0, minutes) + offsetHours * 60 * 60 * 1000;
    const parts = easternParts(guess);

    if (parts.day === day && parts.minutes === minutes) return guess;
  }

  return Date.UTC(year, month - 1, day, 0, minutes) + 5 * 60 * 60 * 1000;
}

/** Is the market open at this real moment? (Weekends are closed; holidays are not modelled.) */
export function isMarketOpen(hours: ClockHours, realMs: number) {
  if (hours === "always") return true;

  const parts = easternParts(realMs);
  const weekday = parts.weekday !== "Sat" && parts.weekday !== "Sun";

  return weekday && parts.minutes >= OPEN_MINUTES && parts.minutes < CLOSE_MINUTES;
}

/** How much real time between two moments the market was open for. */
export function openMsBetween(hours: ClockHours, fromMs: number, toMs: number) {
  if (toMs <= fromMs) return 0;
  if (hours === "always") return toMs - fromMs;

  let total = 0;
  // Walk the New York calendar days the span touches, one noon at a time
  // (noon keeps clear of daylight-saving changes).
  const first = easternParts(fromMs);
  let noon = easternInstant(first.year, first.month, first.day, 12 * 60);

  for (let guard = 0; guard < 4000 && noon - DAY_MS / 2 <= toMs; guard += 1) {
    const day = easternParts(noon);

    if (day.weekday !== "Sat" && day.weekday !== "Sun") {
      const open = easternInstant(day.year, day.month, day.day, OPEN_MINUTES);
      const close = easternInstant(day.year, day.month, day.day, CLOSE_MINUTES);
      total += Math.max(0, Math.min(close, toMs) - Math.max(open, fromMs));
    }

    const next = easternParts(noon + DAY_MS);
    noon = easternInstant(next.year, next.month, next.day, 12 * 60);
  }

  return total;
}

// ------------------------------------------------------------------ the clock

/** The class's simulated time at a real moment. */
export function simTimeAt(clock: MarketClock, realMs: number) {
  if (clock.status === "paused") return clock.simAnchorMs;

  return clock.simAnchorMs + openMsBetween(clock.hours, clock.realAnchorMs, realMs) * clock.speed;
}

export type ClockAction =
  | { type: "pause" }
  | { type: "resume" }
  | { speed: ClockSpeed; type: "speed" }
  | { hours: ClockHours; type: "hours" };

/** Applies a teacher action. Simulated time never jumps: it is re-anchored at "now". */
export function applyClockAction(clock: MarketClock, action: ClockAction, nowMs: number): MarketClock {
  const anchored: MarketClock = { ...clock, realAnchorMs: nowMs, simAnchorMs: simTimeAt(clock, nowMs) };

  switch (action.type) {
    case "pause":
      return { ...anchored, status: "paused" };
    case "resume":
      return { ...anchored, status: "running" };
    case "speed":
      return { ...anchored, speed: action.speed };
    case "hours":
      return { ...anchored, hours: action.hours };
  }
}

export type ClockView = {
  hours: ClockHours;
  label: string; // "1x", "5x", "Paused" or "Closed"
  open: boolean;
  simTime: string; // ISO
  speed: ClockSpeed;
  status: ClockStatus;
  tradingAllowed: boolean;
};

/** What the app shows and enforces for a clock at a real moment. */
export function clockView(clock: MarketClock, realMs: number): ClockView {
  const open = isMarketOpen(clock.hours, realMs);
  const paused = clock.status === "paused";

  return {
    hours: clock.hours,
    label: paused ? "Paused" : open ? `${clock.speed}x` : "Closed",
    open,
    simTime: new Date(simTimeAt(clock, realMs)).toISOString(),
    speed: clock.speed,
    status: clock.status,
    tradingAllowed: !paused && open,
  };
}

/** Why a trade can't happen right now, or null when trading is allowed. */
export function tradingBlockedReason(view: Pick<ClockView, "open" | "status">) {
  if (view.status === "paused") return "The market is paused by your teacher. Trading is off until it resumes.";
  if (!view.open) return "The market is closed. It opens at 9:30 AM Eastern on weekdays.";
  return null;
}
