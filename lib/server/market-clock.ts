import {
  applyClockAction,
  clockView,
  defaultClock,
  isClockHours,
  isClockSpeed,
  type ClockAction,
} from "@/lib/market-clock";
import type { AuthenticatedUser } from "@/lib/server/auth";
import { PortfolioError } from "@/lib/server/portfolios-errors";
import { defaultDistrictId, getClassMarketClock, getSql, hasProductionDatabase, id } from "@/lib/server/repository";
import { requireControllable } from "@/lib/server/teacher-market";

/**
 * Teacher clock controls for a class market (v0.2.12): pause, resume, speed
 * and market hours. Only these actions are stored; prices are calculated from
 * the clock. Each action is also logged so history can be replayed later.
 */

export function parseClockAction(input: { hours?: unknown; op?: unknown; speed?: unknown }): ClockAction | null {
  if (input.op === "pause") return { type: "pause" };
  if (input.op === "resume") return { type: "resume" };
  if (input.op === "speed" && isClockSpeed(input.speed)) return { speed: input.speed, type: "speed" };
  if (input.op === "hours" && isClockHours(input.hours)) return { hours: input.hours, type: "hours" };
  return null;
}

export async function changeClassClock(user: AuthenticatedUser, className: string, action: ClockAction) {
  if (!hasProductionDatabase()) throw new PortfolioError("This needs a database (DATABASE_URL).", 503);

  await requireControllable(user, className);

  const nowMs = Date.now();
  const before = (await getClassMarketClock(className)) ?? defaultClock(nowMs);
  const after = applyClockAction(before, action, nowMs);
  const actorId = user.actingAdmin?.id ?? user.id;
  const now = new Date(nowMs);
  const sql = getSql();

  await sql.begin(async (tx) => {
    await tx`
      insert into class_market_clocks (
        district_id, class_name, status, speed, hours, sim_anchor_ms, real_anchor_ms, updated_by_user_id, updated_at
      )
      values (${defaultDistrictId}, ${className}, ${after.status}, ${after.speed}, ${after.hours},
        ${Math.round(after.simAnchorMs)}, ${after.realAnchorMs}, ${actorId}, ${now})
      on conflict (district_id, class_name) do update set
        status = excluded.status, speed = excluded.speed, hours = excluded.hours,
        sim_anchor_ms = excluded.sim_anchor_ms, real_anchor_ms = excluded.real_anchor_ms,
        updated_by_user_id = excluded.updated_by_user_id, updated_at = excluded.updated_at
    `;
    await tx`
      insert into class_market_clock_events (
        id, district_id, class_name, action, status, speed, hours, sim_ms, real_ms, actor_user_id, created_at
      )
      values (${id("clock-event")}, ${defaultDistrictId}, ${className}, ${action.type}, ${after.status},
        ${after.speed}, ${after.hours}, ${Math.round(after.simAnchorMs)}, ${after.realAnchorMs}, ${actorId}, ${now})
    `;
  });

  return clockView(after, nowMs);
}
