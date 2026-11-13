import { buildStockInfo, isInfoLevel, resolveInfoLevel, type InfoLevel } from "@/lib/stock-info";
import type { AuthenticatedUser } from "@/lib/server/auth";
import { fallbackMarketQuotes } from "@/lib/server/market-engine";
import { getClassGradeLevel } from "@/lib/server/portfolios";
import { PortfolioError } from "@/lib/server/portfolios-errors";
import {
  defaultDistrictId,
  getClassMarketConfig,
  getSql,
  hasProductionDatabase,
  upsertClassMarketConfig,
} from "@/lib/server/repository";
import { adjustedClassMarket } from "@/lib/server/teacher-market";

/**
 * Stock info (v0.2.11). The class's Stock info level decides what a student
 * sees: Basic or Full. Teachers set it for their classes, admins for any
 * class; with no setting it follows the class's grade level.
 */

export type ClassInfoLevel = {
  gradeLevel: number | null;
  level: InfoLevel; // what students in the class see
  setting: InfoLevel | null; // null = following the grade default
};

export async function getClassInfoLevel(className: string): Promise<ClassInfoLevel> {
  let setting: InfoLevel | null = null;

  if (hasProductionDatabase()) {
    const [row] = await getSql()<Array<{ stock_info_level: string | null }>>`
      select stock_info_level from class_market_configs
      where district_id = ${defaultDistrictId} and class_name = ${className}
    `;
    setting = isInfoLevel(row?.stock_info_level) ? row.stock_info_level : null;
  }

  const gradeLevel = await getClassGradeLevel(className);
  return { gradeLevel, level: resolveInfoLevel(setting, gradeLevel), setting };
}

/** Teachers change their own classes; admins change any class. */
export async function saveClassInfoLevel(user: AuthenticatedUser, className: string, level: InfoLevel | null) {
  if (!hasProductionDatabase()) throw new PortfolioError("This needs a database (DATABASE_URL).", 503);

  const allowed = user.role === "Admin" || (user.role === "Teacher" && user.classNames.includes(className));

  if (!allowed) throw new PortfolioError("You can only change the stock info level for your own classes.", 403);
  if (level !== null && !isInfoLevel(level)) throw new PortfolioError("Choose Basic or Full.", 400);

  const sql = getSql();
  const update = () => sql`
    update class_market_configs set stock_info_level = ${level}
    where district_id = ${defaultDistrictId} and class_name = ${className}
    returning class_name
  `;

  if ((await update()).length === 0) {
    // The class has no saved market settings yet: save its defaults first.
    await upsertClassMarketConfig({ actor: user, config: await getClassMarketConfig(className) });
    await update();
  }

  return getClassInfoLevel(className);
}

/**
 * What the popup shows for one symbol. Students get their class's level and
 * their own price (teacher changes included); teachers and admins get Full.
 */
export async function getStockInfo(
  user: AuthenticatedUser,
  input: { className?: string | null; range?: string | null; ticker: string }
) {
  const ticker = input.ticker.trim().toUpperCase();

  if (!ticker) throw new PortfolioError("Choose a symbol.", 400);

  const isStudent = user.role === "Student";
  const requested = input.className?.trim() || null;

  if (requested && user.role !== "Admin" && !user.classNames.includes(requested)) {
    throw new PortfolioError("This account cannot view that class market.", 403);
  }

  const className = requested ?? (user.role === "Admin" ? null : user.className ?? user.classNames[0] ?? null);
  let quote: { changePercent: number; name: string; price: number; ticker: string } | undefined;

  if (hasProductionDatabase() && className) {
    const { symbols } = await adjustedClassMarket(className, isStudent ? user.id : null);
    quote = symbols.find((symbol) => symbol.ticker === ticker);
  }

  // Staff practice portfolios (and no-database mode) use the sample quotes.
  quote ??= (!isStudent || !hasProductionDatabase() ? fallbackMarketQuotes : []).find((item) => item.ticker === ticker);

  if (!quote) throw new PortfolioError("That symbol isn't in this class market.", 404);

  const level: InfoLevel = isStudent && className ? (await getClassInfoLevel(className)).level : isStudent ? "basic" : "full";

  return buildStockInfo({ ...quote, level, range: input.range });
}
