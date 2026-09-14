export type MarketEngineQuote = {
  changePercent: number;
  lessonUse?: string;
  name: string;
  price: number;
  ticker: string;
};

export type ClassMarketConfig = {
  allowedAssetTypes: string[];
  allowedSymbols: string[];
  className: string;
  eventScenario: "baseline" | "market_drop" | "growth_rally" | "rate_shock";
  simulationMode: "shared_provider" | "teacher_scenario" | "frozen";
  startingCashCents: number;
  teacherControlsEnabled: boolean;
  volatilityMultiplier: number;
};

export type ClassMarketState = {
  className: string;
  config: ClassMarketConfig;
  disclosure: string;
  engineMode: "central-simulator";
  generatedAt: string;
  scenarioLabel: string;
  symbols: Array<
    MarketEngineQuote & {
      simulatedChangePercent: number;
      simulatedPrice: number;
    }
  >;
};

export const fallbackMarketQuotes: MarketEngineQuote[] = [
  {
    ticker: "SPY",
    name: "S&P 500 ETF",
    price: 689.42,
    changePercent: 0.7,
    lessonUse: "Broad market benchmark for diversification lessons",
  },
  {
    ticker: "QQQ",
    name: "Growth ETF",
    price: 621.15,
    changePercent: -0.4,
    lessonUse: "Volatility comparison for growth-heavy portfolios",
  },
  {
    ticker: "BND",
    name: "Bond ETF",
    price: 74.18,
    changePercent: 0.2,
    lessonUse: "Lower-risk asset behavior during market movement",
  },
  {
    ticker: "IPO-LAB",
    name: "Simulated IPO basket",
    price: 31.62,
    changePercent: 1.9,
    lessonUse: "Risk and hype discussion without real IPO access",
  },
];

export const defaultClassMarketConfigs: ClassMarketConfig[] = [
  {
    allowedAssetTypes: ["Stocks", "ETFs", "Bonds", "Cash"],
    allowedSymbols: ["SPY", "QQQ", "BND", "IPO-LAB"],
    className: "7th Grade Finance A",
    eventScenario: "market_drop",
    simulationMode: "teacher_scenario",
    startingCashCents: 100000,
    teacherControlsEnabled: true,
    volatilityMultiplier: 1.2,
  },
  {
    allowedAssetTypes: ["Stocks", "ETFs", "Bonds", "Cash"],
    allowedSymbols: ["SPY", "QQQ", "BND"],
    className: "7th Grade Finance B",
    eventScenario: "baseline",
    simulationMode: "shared_provider",
    startingCashCents: 100000,
    teacherControlsEnabled: true,
    volatilityMultiplier: 1,
  },
  {
    allowedAssetTypes: ["Stocks", "ETFs", "Roth IRA", "Cash"],
    allowedSymbols: ["VTI", "VXUS", "BND", "SPY"],
    className: "8th Grade Investing Lab",
    eventScenario: "growth_rally",
    simulationMode: "teacher_scenario",
    startingCashCents: 150000,
    teacherControlsEnabled: true,
    volatilityMultiplier: 1.35,
  },
  {
    allowedAssetTypes: ["Stocks", "ETFs", "Bonds", "Retirement", "Cash"],
    allowedSymbols: ["SPY", "QQQ", "BND", "VTI"],
    className: "High School Personal Finance",
    eventScenario: "rate_shock",
    simulationMode: "teacher_scenario",
    startingCashCents: 200000,
    teacherControlsEnabled: true,
    volatilityMultiplier: 1.1,
  },
];

const scenarioDrift: Record<ClassMarketConfig["eventScenario"], number> = {
  baseline: 0,
  growth_rally: 0.65,
  market_drop: -1.1,
  rate_shock: -0.35,
};

const scenarioLabels: Record<ClassMarketConfig["eventScenario"], string> = {
  baseline: "Shared provider market",
  growth_rally: "Growth rally scenario",
  market_drop: "Broad market drop scenario",
  rate_shock: "Interest-rate shock scenario",
};

export function getDefaultClassMarketConfig(className: string) {
  return (
    defaultClassMarketConfigs.find((config) => config.className === className) ?? {
      ...defaultClassMarketConfigs[0],
      className,
      eventScenario: "baseline",
      simulationMode: "shared_provider",
      volatilityMultiplier: 1,
    }
  );
}

export function buildClassMarketState(input: {
  className: string;
  config?: ClassMarketConfig | null;
  quotes?: MarketEngineQuote[];
}) {
  const config = input.config ?? getDefaultClassMarketConfig(input.className);
  const sourceQuotes = input.quotes?.length ? input.quotes : fallbackMarketQuotes;
  const allowedSymbols = new Set(
    config.allowedSymbols.map((symbol) => symbol.trim().toUpperCase())
  );
  const filteredQuotes = sourceQuotes.filter(
    (quote) => allowedSymbols.size === 0 || allowedSymbols.has(quote.ticker)
  );
  const usableQuotes = filteredQuotes.length ? filteredQuotes : sourceQuotes.slice(0, 4);

  return {
    className: input.className,
    config,
    disclosure:
      "Educational simulation only. Class markets are centrally generated and cannot place trades or provide financial advice.",
    engineMode: "central-simulator",
    generatedAt: new Date().toISOString(),
    scenarioLabel: scenarioLabels[config.eventScenario],
    symbols: usableQuotes.map((quote) => {
      const offset = deterministicOffset(`${input.className}:${quote.ticker}`);
      const simulatedChangePercent =
        config.simulationMode === "frozen"
          ? 0
          : roundPercent(
              quote.changePercent * config.volatilityMultiplier +
                scenarioDrift[config.eventScenario] +
                offset
            );

      return {
        ...quote,
        simulatedChangePercent,
        simulatedPrice: roundPrice(
          quote.price * (1 + simulatedChangePercent / 100)
        ),
      };
    }),
  } satisfies ClassMarketState;
}

export function normalizeClassMarketConfig(input: {
  allowedAssetTypes?: string[];
  allowedSymbols?: string[] | string;
  className: string;
  eventScenario?: string;
  simulationMode?: string;
  startingCashCents?: number;
  teacherControlsEnabled?: boolean;
  volatilityMultiplier?: number;
}) {
  const fallback = getDefaultClassMarketConfig(input.className);
  const allowedSymbols = Array.isArray(input.allowedSymbols)
    ? input.allowedSymbols
    : (input.allowedSymbols ?? "")
        .split(",")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean);
  const allowedAssetTypes = input.allowedAssetTypes?.length
    ? input.allowedAssetTypes
    : fallback.allowedAssetTypes;

  return {
    allowedAssetTypes,
    allowedSymbols,
    className: input.className,
    eventScenario: normalizeScenario(input.eventScenario, fallback.eventScenario),
    simulationMode: normalizeSimulationMode(
      input.simulationMode,
      fallback.simulationMode
    ),
    startingCashCents: Number.isFinite(input.startingCashCents)
      ? Math.max(0, Math.round(input.startingCashCents ?? 0))
      : fallback.startingCashCents,
    teacherControlsEnabled:
      input.teacherControlsEnabled ?? fallback.teacherControlsEnabled,
    volatilityMultiplier: Number.isFinite(input.volatilityMultiplier)
      ? Math.min(3, Math.max(0, Number(input.volatilityMultiplier)))
      : fallback.volatilityMultiplier,
  } satisfies ClassMarketConfig;
}

function normalizeScenario(
  value: string | undefined,
  fallback: ClassMarketConfig["eventScenario"]
) {
  return value === "market_drop" ||
    value === "growth_rally" ||
    value === "rate_shock" ||
    value === "baseline"
    ? value
    : fallback;
}

function normalizeSimulationMode(
  value: string | undefined,
  fallback: ClassMarketConfig["simulationMode"]
) {
  return value === "shared_provider" ||
    value === "teacher_scenario" ||
    value === "frozen"
    ? value
    : fallback;
}

function deterministicOffset(seed: string) {
  let hash = 0;

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) % 1000;
  }

  return (hash % 41 - 20) / 100;
}

function roundPercent(value: number) {
  return Math.round(value * 100) / 100;
}

function roundPrice(value: number) {
  return Math.round(value * 100) / 100;
}
