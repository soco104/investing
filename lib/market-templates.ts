/**
 * Market event templates and difficulty presets (v0.2.19). Pure functions.
 *
 * A template moves every symbol in a class market by a percent that depends
 * on what kind of investment it is (bonds, tech, international, ...), like
 * the Strait of Hormuz scenario does for oil. Difficulty presets scale both
 * market templates and life event cards.
 */

export type Difficulty = "gentle" | "realistic" | "tough";

export const difficultyScale: Record<Difficulty, number> = { gentle: 0.5, realistic: 1, tough: 1.5 };

export const difficultyLabels: Record<Difficulty, string> = {
  gentle: "Gentle (half as big)",
  realistic: "Realistic",
  tough: "Tough (half again as big)",
};

export function isDifficulty(value: unknown): value is Difficulty {
  return value === "gentle" || value === "realistic" || value === "tough";
}

/** Scale a percent by a difficulty, keeping it a whole number from 1 to max. */
export function scalePercent(percent: number, difficulty: Difficulty | undefined, max = 100) {
  const scaled = Math.round(percent * difficultyScale[difficulty ?? "realistic"]);
  return Math.max(1, Math.min(max, scaled));
}

export type SymbolGroup = "bonds" | "tech" | "international" | "broad" | "speculative" | "other";

/** Which group a symbol belongs to, from its ticker and name. */
export function symbolGroup(ticker: string, name: string): SymbolGroup {
  const text = `${ticker} ${name}`;

  if (/\bBND\b|bond|treasur|fixed income/i.test(text)) return "bonds";
  if (/IPO|\blab\b|speculat|crypto/i.test(text)) return "speculative";
  if (/\bQQQ\b|tech|growth|nasdaq|semiconductor/i.test(text)) return "tech";
  if (/\bVXUS\b|international|world|ex-us|emerging|global/i.test(text)) return "international";
  if (/\bSPY\b|\bVTI\b|s&p|total|500|index/i.test(text)) return "broad";
  return "other";
}

export type MarketTemplate = {
  description: string;
  id: string;
  moves: Record<SymbolGroup, number>; // percent at "realistic"
  needsTicker?: boolean; // the teacher picks one symbol (company scandal)
  news: string;
  title: string;
};

export const marketTemplates: MarketTemplate[] = [
  {
    description: "The economy shrinks. Stocks fall, risky ones the most, and investors move into bonds.",
    id: "recession",
    moves: { bonds: 3, broad: -8, international: -9, other: -8, speculative: -18, tech: -12 },
    news: "Market event: a recession is announced. Stocks fall and investors move into bonds.",
    title: "Recession",
  },
  {
    description: "Prices rise faster than expected. Both stocks and bonds lose value as interest rates are expected to climb.",
    id: "inflation-spike",
    moves: { bonds: -5, broad: -4, international: -3, other: -4, speculative: -8, tech: -6 },
    news: "Market event: inflation came in much higher than expected.",
    title: "Inflation spike",
  },
  {
    description: "The central bank cuts interest rates. Borrowing gets cheaper and most investments rise.",
    id: "rate-cut",
    moves: { bonds: 2, broad: 3, international: 2, other: 3, speculative: 6, tech: 5 },
    news: "Market event: the central bank cut interest rates.",
    title: "Rate cut",
  },
  {
    description: "Technology shares sell off after disappointing results. Tech and speculative symbols fall; bonds edge up.",
    id: "tech-selloff",
    moves: { bonds: 1, broad: -4, international: -1, other: -2, speculative: -12, tech: -10 },
    news: "Market event: technology shares sold off after weak results.",
    title: "Sector shock: tech selloff",
  },
  {
    description: "One company is caught in an accounting scandal. Only the symbol you pick falls, sharply.",
    id: "company-scandal",
    moves: { bonds: 0, broad: 0, international: 0, other: 0, speculative: 0, tech: 0 },
    needsTicker: true,
    news: "Market event: an accounting scandal hit this company.",
    title: "Company scandal",
  },
];

export const SCANDAL_PERCENT = -20;

export function findTemplate(templateId: string) {
  return marketTemplates.find((template) => template.id === templateId) ?? null;
}

/**
 * Per-symbol moves for a template at a difficulty. Symbols that wouldn't
 * move are left out. A company scandal moves only the chosen ticker.
 */
export function templateMoves(
  template: MarketTemplate,
  symbols: Array<{ name: string; ticker: string }>,
  difficulty: Difficulty = "realistic",
  scandalTicker?: string | null
) {
  const scale = difficultyScale[difficulty];

  if (template.needsTicker) {
    const ticker = scandalTicker?.trim().toUpperCase();
    const symbol = symbols.find((item) => item.ticker === ticker);

    return symbol ? [{ percent: Math.round(SCANDAL_PERCENT * scale), ticker: symbol.ticker }] : [];
  }

  return symbols
    .map((symbol) => ({ percent: Math.round(template.moves[symbolGroup(symbol.ticker, symbol.name)] * scale), ticker: symbol.ticker }))
    .filter((move) => move.percent !== 0);
}

export type ComboPreset = { cardId: string; description: string; id: string; templateId: string; title: string };

/** Ready-made pairs of a market event and a life event: the hardest test. */
export const comboPresets: ComboPreset[] = [
  {
    cardId: "hours-cut",
    description: "The economy shrinks and your hours are cut at the same time.",
    id: "recession-hours-cut",
    templateId: "recession",
    title: "Recession + hours cut",
  },
  {
    cardId: "rent-increase",
    description: "Everything costs more, including your rent.",
    id: "inflation-rent",
    templateId: "inflation-spike",
    title: "Inflation spike + rent increase",
  },
  {
    cardId: "appliance-breakdown",
    description: "Tech stocks drop the same week your fridge dies.",
    id: "selloff-fridge",
    templateId: "tech-selloff",
    title: "Tech selloff + fridge breakdown",
  },
];
