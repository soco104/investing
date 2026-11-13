import { describe, expect, it } from "vitest";

import {
  applyClockAction,
  clockView,
  defaultClock,
  isMarketOpen,
  openMsBetween,
  simTimeAt,
  tradingBlockedReason,
} from "@/lib/market-clock";
import { MAX_MOTION_PERCENT, motionPercent } from "@/lib/market-motion";

const HOUR = 60 * 60 * 1000;
// Thursday 12 Nov 2026 (Eastern Standard Time, UTC-5).
const thu10am = Date.UTC(2026, 10, 12, 15, 0);
const thu8am = Date.UTC(2026, 10, 12, 13, 0);
const sat10am = Date.UTC(2026, 10, 14, 15, 0);
// Monday 13 Jul 2026 (Eastern Daylight Time, UTC-4).
const julyMon10am = Date.UTC(2026, 6, 13, 14, 0);

describe("market hours", () => {
  it("is always open in the 24-hour setting", () => {
    expect(isMarketOpen("always", sat10am)).toBe(true);
  });

  it("follows 9:30 AM to 4:00 PM Eastern on weekdays, in winter and summer", () => {
    expect(isMarketOpen("us_market", thu10am)).toBe(true);
    expect(isMarketOpen("us_market", thu8am)).toBe(false);
    expect(isMarketOpen("us_market", Date.UTC(2026, 10, 12, 14, 29))).toBe(false); // 9:29
    expect(isMarketOpen("us_market", Date.UTC(2026, 10, 12, 14, 30))).toBe(true); // 9:30
    expect(isMarketOpen("us_market", Date.UTC(2026, 10, 12, 21, 0))).toBe(false); // 4:00 PM
    expect(isMarketOpen("us_market", sat10am)).toBe(false);
    expect(isMarketOpen("us_market", julyMon10am)).toBe(true);
    expect(isMarketOpen("us_market", Date.UTC(2026, 6, 13, 13, 0))).toBe(false); // 9:00 AM EDT
  });

  it("counts only open time between two moments", () => {
    expect(openMsBetween("always", thu8am, thu10am)).toBe(2 * HOUR);
    expect(openMsBetween("us_market", thu8am, thu10am)).toBe(0.5 * HOUR);
    // Thursday 10 AM to Friday 10 AM: 6h Thursday + 0.5h Friday.
    expect(openMsBetween("us_market", thu10am, thu10am + 24 * HOUR)).toBe(6.5 * HOUR);
    // Friday 10 AM to Monday 10 AM: 6h Friday + 0.5h Monday (weekend closed).
    expect(openMsBetween("us_market", thu10am + 24 * HOUR, thu10am + 96 * HOUR)).toBe(6.5 * HOUR);
    // A whole week holds five 6.5-hour days.
    expect(openMsBetween("us_market", thu8am, thu8am + 7 * 24 * HOUR)).toBe(5 * 6.5 * HOUR);
    expect(openMsBetween("us_market", thu10am, thu8am)).toBe(0);
  });
});

describe("the class clock", () => {
  it("starts in step with real time", () => {
    const clock = defaultClock(thu10am);

    expect(simTimeAt(clock, thu10am + HOUR)).toBe(thu10am + HOUR);
    expect(clockView(clock, thu10am)).toMatchObject({ label: "1x", tradingAllowed: true });
  });

  it("pause freezes time and resume carries on from the same moment", () => {
    const paused = applyClockAction(defaultClock(thu10am), { type: "pause" }, thu10am + HOUR);

    expect(simTimeAt(paused, thu10am + 5 * HOUR)).toBe(thu10am + HOUR);
    expect(clockView(paused, thu10am + 5 * HOUR)).toMatchObject({ label: "Paused", tradingAllowed: false });
    expect(tradingBlockedReason(clockView(paused, thu10am))).toContain("paused by your teacher");

    const resumed = applyClockAction(paused, { type: "resume" }, thu10am + 5 * HOUR);

    expect(simTimeAt(resumed, thu10am + 6 * HOUR)).toBe(thu10am + 2 * HOUR);
  });

  it("fast forward speeds time up without a jump", () => {
    const fast = applyClockAction(defaultClock(thu10am), { speed: 10, type: "speed" }, thu10am + HOUR);

    expect(simTimeAt(fast, thu10am + HOUR)).toBe(thu10am + HOUR);
    expect(simTimeAt(fast, thu10am + 2 * HOUR)).toBe(thu10am + 11 * HOUR);
    expect(clockView(fast, thu10am + 2 * HOUR).label).toBe("10x");
  });

  it("stops while a U.S.-hours market is closed", () => {
    const clock = applyClockAction(defaultClock(thu8am), { hours: "us_market", type: "hours" }, thu8am);

    expect(simTimeAt(clock, thu10am)).toBe(thu8am + 0.5 * HOUR);
    expect(clockView(clock, thu8am)).toMatchObject({ label: "Closed", open: false, tradingAllowed: false });
    expect(tradingBlockedReason(clockView(clock, thu8am))).toContain("closed");
    expect(tradingBlockedReason(clockView(clock, thu10am))).toBeNull();
  });
});

describe("price movement", () => {
  it("is the same for the same seed, symbol and time", () => {
    expect(motionPercent("seed", "SPY", thu10am)).toBe(motionPercent("seed", "SPY", thu10am));
  });

  it("differs by symbol and changes over time, but smoothly", () => {
    expect(motionPercent("seed", "SPY", thu10am)).not.toBe(motionPercent("seed", "QQQ", thu10am));
    expect(motionPercent("seed", "SPY", thu10am)).not.toBe(motionPercent("seed", "SPY", thu10am + HOUR));
    // One second apart is a tiny step.
    expect(Math.abs(motionPercent("seed", "SPY", thu10am + 1000) - motionPercent("seed", "SPY", thu10am))).toBeLessThan(0.02);
  });

  it("stays within its limit and scales with volatility", () => {
    for (let step = 0; step < 500; step += 1) {
      const time = thu10am + step * 7 * 60 * 1000;

      expect(Math.abs(motionPercent("seed", "SPY", time))).toBeLessThanOrEqual(MAX_MOTION_PERCENT);
      expect(motionPercent("seed", "SPY", time, 2)).toBeCloseTo(motionPercent("seed", "SPY", time) * 2, 10);
    }

    expect(motionPercent("seed", "SPY", thu10am, 0)).toBe(0);
  });
});
