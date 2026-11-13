/**
 * Market rewind (v0.2.13): looking back at what a class's market did.
 *
 * View-only. Nothing here changes prices, trades or portfolios. Because
 * prices are calculated from the class's simulated time (v0.2.12), the past
 * can be worked out again from two saved records: the log of clock changes
 * (pause, resume, speed, hours) and the teacher's market changes.
 */

import { defaultClock, type ClockHours, type ClockSpeed, type ClockStatus, type MarketClock } from "@/lib/market-clock";

export type ClockEvent = {
  action: string; // "pause" | "resume" | "speed" | "hours"
  hours: ClockHours;
  realMs: number;
  simMs: number;
  speed: ClockSpeed;
  status: ClockStatus;
};

export const MAX_HISTORY_DAYS = 31;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The class's clock as it was at a real moment. Before its first saved change
 * a class ran at 1x, always open, in step with real time.
 */
export function clockAt(events: ClockEvent[], realMs: number): MarketClock {
  let latest: ClockEvent | null = null;

  for (const event of events) {
    if (event.realMs <= realMs && (!latest || event.realMs >= latest.realMs)) latest = event;
  }

  if (!latest) return defaultClock(realMs);

  return {
    hours: latest.hours,
    realAnchorMs: latest.realMs,
    simAnchorMs: latest.simMs,
    speed: latest.speed,
    status: latest.status,
  };
}

export type HistoryRange = { fromMs: number; toMs: number };

/**
 * Checks and tidies a requested timeframe: it can't start before history
 * began, can't run into the future, and can't cover more than 31 days.
 */
export function normalizeRange(input: { fromMs: number; nowMs: number; startMs: number; toMs: number }):
  | { ok: true; range: HistoryRange }
  | { message: string; ok: false } {
  if (!Number.isFinite(input.fromMs) || !Number.isFinite(input.toMs)) {
    return { message: "Choose a start and an end time.", ok: false };
  }

  const toMs = Math.min(input.toMs, input.nowMs);
  const fromMs = Math.max(input.fromMs, input.startMs);

  if (toMs <= input.startMs) {
    return { message: "That is before the running market's history begins.", ok: false };
  }

  if (fromMs >= toMs) return { message: "The start must be before the end.", ok: false };

  if (toMs - fromMs > MAX_HISTORY_DAYS * DAY_MS) {
    return { message: `Choose a timeframe of ${MAX_HISTORY_DAYS} days or less.`, ok: false };
  }

  return { ok: true, range: { fromMs, toMs } };
}

/**
 * The moments to draw: evenly spaced across the timeframe, plus the instant
 * just before and at each event, so a sudden change shows as a step.
 */
export function sampleTimes(range: HistoryRange, eventTimes: number[], count = 120) {
  const times = new Set<number>();
  const steps = Math.max(2, count);

  for (let index = 0; index < steps; index += 1) {
    times.add(Math.round(range.fromMs + ((range.toMs - range.fromMs) * index) / (steps - 1)));
  }

  for (const time of eventTimes) {
    if (time > range.fromMs && time <= range.toMs) {
      times.add(time - 1);
      times.add(time);
    }
  }

  return [...times].sort((a, b) => a - b);
}

/** Was something that started and (maybe) ended in effect at this moment? */
export function activeAt(startMs: number, endMs: number | null, atMs: number) {
  return startMs <= atMs && (endMs === null || atMs < endMs);
}

export const clockEventLabels: Record<string, (event: Pick<ClockEvent, "hours" | "speed">) => string> = {
  hours: (event) => (event.hours === "us_market" ? "Hours set to U.S. market hours" : "Hours set to always open"),
  pause: () => "Market paused",
  resume: () => "Market resumed",
  speed: (event) => `Speed set to ${event.speed}x`,
};
