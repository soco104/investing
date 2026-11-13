import { describe, expect, it } from "vitest";

import { simTimeAt } from "@/lib/market-clock";
import { activeAt, clockAt, normalizeRange, sampleTimes, type ClockEvent } from "@/lib/market-history";

const HOUR = 60 * 60 * 1000;
const t0 = Date.UTC(2026, 10, 13, 15, 0);

const event = (offsetHours: number, simOffsetHours: number, patch: Partial<ClockEvent>): ClockEvent => ({
  action: "pause",
  hours: "always",
  realMs: t0 + offsetHours * HOUR,
  simMs: t0 + simOffsetHours * HOUR,
  speed: 1,
  status: "running",
  ...patch,
});

describe("replaying the clock log", () => {
  // Paused from hour 1 to hour 3, then 10x from hour 4.
  const events = [
    event(1, 1, { action: "pause", status: "paused" }),
    event(3, 1, { action: "resume" }),
    event(4, 2, { action: "speed", speed: 10 }),
  ];
  const simAt = (hours: number) => simTimeAt(clockAt(events, t0 + hours * HOUR), t0 + hours * HOUR) - t0;

  it("runs in step with real time before the first change", () => {
    expect(simAt(0.5)).toBe(0.5 * HOUR);
    expect(simTimeAt(clockAt([], t0), t0)).toBe(t0);
  });

  it("holds still during a pause and carries on after it", () => {
    expect(simAt(1)).toBe(1 * HOUR);
    expect(simAt(2)).toBe(1 * HOUR);
    expect(simAt(2.9)).toBe(1 * HOUR);
    expect(simAt(3.5)).toBe(1.5 * HOUR);
  });

  it("moves faster after a speed change", () => {
    expect(simAt(4)).toBe(2 * HOUR);
    expect(simAt(5)).toBe(12 * HOUR);
  });

  it("doesn't depend on the order events are listed in", () => {
    const shuffled = [events[2], events[0], events[1]];
    expect(simTimeAt(clockAt(shuffled, t0 + 2 * HOUR), t0 + 2 * HOUR)).toBe(t0 + HOUR);
  });
});

describe("timeframes", () => {
  const base = { nowMs: t0 + 10 * HOUR, startMs: t0 };

  it("clamps to when history began and to now", () => {
    expect(normalizeRange({ ...base, fromMs: t0 - 5 * HOUR, toMs: t0 + 20 * HOUR })).toEqual({
      ok: true,
      range: { fromMs: t0, toMs: t0 + 10 * HOUR },
    });
  });

  it("refuses timeframes that are backwards, too early or too long", () => {
    expect(normalizeRange({ ...base, fromMs: t0 + 5 * HOUR, toMs: t0 + 2 * HOUR }).ok).toBe(false);
    expect(normalizeRange({ ...base, fromMs: t0 - 9 * HOUR, toMs: t0 - 2 * HOUR }).ok).toBe(false);
    expect(normalizeRange({ ...base, fromMs: Number.NaN, toMs: t0 }).ok).toBe(false);
    expect(
      normalizeRange({ fromMs: t0, nowMs: t0 + 60 * 24 * HOUR, startMs: t0, toMs: t0 + 40 * 24 * HOUR }).ok
    ).toBe(false);
  });
});

describe("what to draw", () => {
  it("spaces points evenly and adds a step at each event", () => {
    const times = sampleTimes({ fromMs: t0, toMs: t0 + HOUR }, [t0 + 1000, t0 + 5 * HOUR], 5);

    expect(times[0]).toBe(t0);
    expect(times.at(-1)).toBe(t0 + HOUR);
    expect(times).toContain(t0 + 999);
    expect(times).toContain(t0 + 1000);
    expect(times).not.toContain(t0 + 5 * HOUR); // outside the timeframe
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it("knows whether a change was in effect at a moment", () => {
    expect(activeAt(t0, null, t0 + HOUR)).toBe(true);
    expect(activeAt(t0, t0 + HOUR, t0 + HOUR)).toBe(false); // undone at that instant
    expect(activeAt(t0, t0 + HOUR, t0 - 1)).toBe(false);
  });
});
