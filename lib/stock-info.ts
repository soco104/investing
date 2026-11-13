/**
 * Stock info (v0.2.11): what the popup behind each market symbol shows.
 *
 * Everything here is SAMPLE DATA until real feeds are added (see
 * docs/roadmap.md, "A live market"). Pure functions only: the server decides
 * the level and sends just what that level allows.
 */

export type InfoLevel = "basic" | "full";
export type ChartRange = "1D" | "1W" | "1M" | "1Y";

export const FULL_INFO_MIN_GRADE = 9;
export const FULL_RANGES: ChartRange[] = ["1D", "1W", "1M", "1Y"];
export const BASIC_RANGES: ChartRange[] = ["1M"];

export function isInfoLevel(value: unknown): value is InfoLevel {
  return value === "basic" || value === "full";
}

/** Grades 9-12 default to Full; younger grades, or no grade set, get Basic. */
export function defaultInfoLevel(gradeLevel: number | null | undefined): InfoLevel {
  return typeof gradeLevel === "number" && gradeLevel >= FULL_INFO_MIN_GRADE ? "full" : "basic";
}

/** The class's own setting wins; otherwise the default for its grade. */
export function resolveInfoLevel(setting: string | null | undefined, gradeLevel: number | null | undefined): InfoLevel {
  return isInfoLevel(setting) ? setting : defaultInfoLevel(gradeLevel);
}

export function rangesFor(level: InfoLevel): ChartRange[] {
  return level === "full" ? FULL_RANGES : BASIC_RANGES;
}

type SampleProfile = {
  description: string; // plain language, for every grade
  headlines: string[];
  kind: string;
  marketCapBillions: number;
  peRatio: number | null;
  sector: string;
  volumeMillions: number;
};

const sampleProfiles: Record<string, SampleProfile> = {
  SPY: {
    description:
      "A fund that owns a small piece of 500 of the largest companies in the United States. Buying one share spreads your money across all of them.",
    headlines: [
      "Large companies report steady earnings as the quarter closes",
      "Investors watch interest rate decision due next week",
      "Broad market funds see strong inflows this month",
    ],
    kind: "Fund (ETF)",
    marketCapBillions: 640,
    peRatio: 24.1,
    sector: "Broad U.S. market",
    volumeMillions: 61.2,
  },
  QQQ: {
    description:
      "A fund that owns 100 large companies, mostly in technology. It can grow quickly, and it can also drop quickly.",
    headlines: [
      "Technology shares swing as chip makers update forecasts",
      "Growth funds lag the wider market for a second week",
      "Analysts split on how long the tech rally can last",
    ],
    kind: "Fund (ETF)",
    marketCapBillions: 365,
    peRatio: 31.8,
    sector: "Technology and growth",
    volumeMillions: 38.4,
  },
  BND: {
    description:
      "A fund that owns thousands of bonds. Bonds are loans to governments and companies that pay interest, so this fund usually moves less than stock funds.",
    headlines: [
      "Bond prices edge up as inflation cools",
      "Savers weigh bonds against high-interest savings accounts",
      "What an interest rate change means for bond funds",
    ],
    kind: "Bond fund (ETF)",
    marketCapBillions: 128,
    peRatio: null,
    sector: "U.S. bonds",
    volumeMillions: 6.3,
  },
  VTI: {
    description:
      "A fund that owns almost every company on the U.S. stock market, large and small. It is one of the widest ways to invest in one purchase.",
    headlines: [
      "Small companies outpace large ones this month",
      "Total-market funds remain a favorite for long-term savers",
      "U.S. stocks close mixed after a busy earnings week",
    ],
    kind: "Fund (ETF)",
    marketCapBillions: 480,
    peRatio: 23.4,
    sector: "Total U.S. market",
    volumeMillions: 3.9,
  },
  VXUS: {
    description:
      "A fund that owns thousands of companies outside the United States, in Europe, Asia and elsewhere. It adds countries your other funds may not cover.",
    headlines: [
      "Overseas markets rise as the dollar weakens",
      "European shares steady after central bank meeting",
      "Why investors hold companies from more than one country",
    ],
    kind: "Fund (ETF)",
    marketCapBillions: 92,
    peRatio: 15.2,
    sector: "International stocks",
    volumeMillions: 4.1,
  },
  "IPO-LAB": {
    description:
      "A made-up basket of brand-new companies for classroom practice. New companies can rise fast on excitement and fall just as fast.",
    headlines: [
      "New listings jump on their first day, then give back gains",
      "Excitement or evidence? How to judge a brand-new company",
      "Classroom basket adds two simulated new listings",
    ],
    kind: "Classroom simulation",
    marketCapBillions: 1.4,
    peRatio: null,
    sector: "New companies (simulated)",
    volumeMillions: 0.8,
  },
};

const genericProfile: SampleProfile = {
  description:
    "An investment in your class market. Its price moves up and down as buyers and sellers change what they are willing to pay.",
  headlines: [
    "Markets open mixed as traders wait for new data",
    "What moves a price? Supply, demand and expectations",
    "Diversifying: why owning several investments lowers risk",
  ],
  kind: "Investment",
  marketCapBillions: 25,
  peRatio: 18.5,
  sector: "General",
  volumeMillions: 2.5,
};

// Small deterministic random number generator, so a symbol's sample chart is
// the same every time it is opened.
function seededRandom(seedText: string) {
  let seed = 2166136261;

  for (let index = 0; index < seedText.length; index += 1) {
    seed ^= seedText.charCodeAt(index);
    seed = Math.imul(seed, 16777619);
  }

  return () => {
    seed += 0x6d2b79f5;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rangeShape: Record<ChartRange, { labels: (index: number, count: number) => string; points: number; swing: number }> = {
  "1D": { labels: (i) => `${9 + Math.floor((i * 30 + 30) / 60)}:${(i * 30 + 30) % 60 === 0 ? "00" : "30"}`, points: 14, swing: 0.004 },
  "1W": { labels: (i, n) => (i === n - 1 ? "Today" : `${n - 1 - i}d ago`), points: 7, swing: 0.012 },
  "1M": { labels: (i, n) => (i === n - 1 ? "Today" : `${n - 1 - i}d ago`), points: 22, swing: 0.016 },
  "1Y": { labels: (i, n) => (i === n - 1 ? "Now" : `${n - 1 - i}mo ago`), points: 12, swing: 0.045 },
};

/** A sample price series for the chart. It always ends at the current price. */
export function sampleSeries(ticker: string, range: ChartRange, currentPrice: number, changePercent?: number) {
  const shape = rangeShape[range];
  const random = seededRandom(`${ticker}:${range}`);
  const values = [currentPrice];

  // Walk backwards from today's price.
  for (let index = 1; index < shape.points; index += 1) {
    const move = (random() - 0.48) * 2 * shape.swing;
    values.push(Math.max(0.01, values[index - 1] / (1 + move)));
  }

  values.reverse();

  // The 1-day chart should agree with "today's change": tilt it so it opens
  // where the day started.
  if (range === "1D" && typeof changePercent === "number" && Number.isFinite(changePercent)) {
    const open = currentPrice / (1 + changePercent / 100);
    const shift = open - values[0];
    const last = values.length - 1;

    for (let index = 0; index < values.length; index += 1) {
      values[index] = Math.max(0.01, values[index] + shift * (1 - index / last));
    }
  }

  return values.map((value, index) => ({
    label: shape.labels(index, shape.points),
    price: Math.round(value * 100) / 100,
  }));
}

export type StockInfo = {
  changePercent: number;
  chart: Array<{ label: string; price: number }>;
  description: string;
  kind: string;
  level: InfoLevel;
  name: string;
  price: number;
  range: ChartRange;
  ranges: ChartRange[];
  sampleData: true;
  ticker: string;
  // Full level only:
  headlines?: string[];
  keyFigures?: {
    marketCap: string;
    peRatio: string;
    volume: string;
    yearHigh: number;
    yearLow: number;
  };
  sector?: string;
};

const billions = (value: number) => (value >= 1000 ? `$${(value / 1000).toFixed(2)} trillion` : `$${value} billion`);

/**
 * Builds what the popup shows. Basic gets the essentials; Full adds key
 * figures, sector, headlines and more chart ranges. A range the level doesn't
 * allow falls back to the level's first range.
 */
export function buildStockInfo(input: {
  changePercent: number;
  level: InfoLevel;
  name: string;
  price: number;
  range?: string | null;
  ticker: string;
}): StockInfo {
  const ticker = input.ticker.toUpperCase();
  const profile = sampleProfiles[ticker] ?? genericProfile;
  const ranges = rangesFor(input.level);
  const range = ranges.includes(input.range as ChartRange) ? (input.range as ChartRange) : ranges[0];
  const info: StockInfo = {
    changePercent: input.changePercent,
    chart: sampleSeries(ticker, range, input.price, input.changePercent),
    description: profile.description,
    kind: profile.kind,
    level: input.level,
    name: input.name,
    price: input.price,
    range,
    ranges,
    sampleData: true,
    ticker,
  };

  if (input.level === "full") {
    const year = sampleSeries(ticker, "1Y", input.price).map((point) => point.price);

    info.sector = profile.sector;
    info.headlines = profile.headlines;
    info.keyFigures = {
      marketCap: billions(profile.marketCapBillions),
      peRatio: profile.peRatio === null ? "Not applicable" : profile.peRatio.toFixed(1),
      volume: `${profile.volumeMillions} million shares`,
      yearHigh: Math.max(...year),
      yearLow: Math.min(...year),
    };
  }

  return info;
}
