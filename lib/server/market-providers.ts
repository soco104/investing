export type MarketProviderConfig = {
  allowedSymbols?: string;
  endpoint: string;
  maxSymbols?: number;
  provider: string;
  timeoutMs?: number;
  token?: string;
  tokenPlacement?: "bearer" | "query" | "x-api-key";
};

export type MarketProviderResult = {
  importedSymbols: number;
  message: string;
  ok: boolean;
  quotes: NormalizedMarketQuote[];
  statusCode?: number;
};

export type NormalizedMarketQuote = {
  changePercent: number;
  name: string;
  price: number;
  ticker: string;
};

export async function testMarketProvider(
  config: MarketProviderConfig
): Promise<MarketProviderResult> {
  const endpoint = config.endpoint.trim();

  if (!endpoint) {
    return {
      importedSymbols: 0,
      message: "Endpoint is required before running GET.",
      ok: false,
      quotes: [],
    };
  }

  const symbolLimit = resolvedSymbolLimit(config.allowedSymbols, config.maxSymbols);

  if (endpoint.startsWith("/api/market")) {
    return {
      importedSymbols: Math.min(symbolLimit, 4),
      message: "GET succeeded from the classroom-safe market endpoint.",
      ok: true,
      quotes: demoMarketQuotes.slice(0, Math.min(symbolLimit, demoMarketQuotes.length)),
      statusCode: 200,
    };
  }

  const url = tokenizedUrl(endpoint, config);
  const headers = tokenizedHeaders(config);
  const timeoutMs = Math.min(
    Math.max(config.timeoutMs ?? Number(process.env.MARKET_PROVIDER_TIMEOUT_MS ?? 7000), 1000),
    30000
  );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;

  try {
    response = await fetch(url, {
      headers,
      method: "GET",
      signal: controller.signal,
    });
  } catch (error) {
    return {
      importedSymbols: 0,
      message:
        (error as Error).name === "AbortError"
          ? `GET timed out after ${timeoutMs}ms.`
          : `GET failed: ${(error as Error).message}`,
      ok: false,
      quotes: [],
    };
  } finally {
    clearTimeout(timeout);
  }

  const quotes = response.ok
    ? normalizeProviderQuotes(await response.json(), symbolLimit)
    : [];

  return {
    importedSymbols: response.ok ? quotes.length : 0,
    message: response.ok
      ? `GET succeeded. Imported ${quotes.length} symbols.`
      : `GET returned ${response.status}.`,
    ok: response.ok,
    quotes,
    statusCode: response.status,
  };
}

export function resolvedSymbolLimit(allowedSymbols?: string, maxSymbols = 200) {
  const listedSymbols = (allowedSymbols ?? "")
    .split(",")
    .map((symbol) => symbol.trim())
    .filter(Boolean);

  if (listedSymbols.length > 0) {
    return Math.min(listedSymbols.length, 200);
  }

  return Math.min(Math.max(maxSymbols, 1), 200);
}

function tokenizedUrl(endpoint: string, config: MarketProviderConfig) {
  if (!config.token || config.tokenPlacement !== "query") {
    return endpoint;
  }

  const url = new URL(endpoint);
  url.searchParams.set("token", config.token);

  return url.toString();
}

function tokenizedHeaders(config: MarketProviderConfig) {
  if (!config.token) {
    return undefined;
  }

  if (config.tokenPlacement === "x-api-key") {
    return { "X-API-Key": config.token };
  }

  return { Authorization: `Bearer ${config.token}` };
}

function normalizeProviderQuotes(payload: unknown, symbolLimit: number) {
  const rows = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { symbols?: unknown[] })?.symbols)
      ? (payload as { symbols: unknown[] }).symbols
      : Array.isArray((payload as { data?: unknown[] })?.data)
        ? (payload as { data: unknown[] }).data
        : Array.isArray((payload as { quotes?: unknown[] })?.quotes)
          ? (payload as { quotes: unknown[] }).quotes
          : [];

  return rows
    .map((row) => normalizeQuote(row))
    .filter((quote): quote is NormalizedMarketQuote => Boolean(quote))
    .slice(0, symbolLimit);
}

function normalizeQuote(row: unknown) {
  if (!row || typeof row !== "object") {
    return null;
  }

  const record = row as Record<string, unknown>;
  const ticker = String(record.ticker ?? record.symbol ?? "").trim().toUpperCase();
  const price = Number(record.price ?? record.last ?? record.close);

  if (!ticker || !Number.isFinite(price)) {
    return null;
  }

  return {
    changePercent: Number(record.changePercent ?? record.change_percent ?? record.change ?? 0),
    name: String(record.name ?? ticker),
    price,
    ticker,
  };
}

const demoMarketQuotes: NormalizedMarketQuote[] = [
  { changePercent: 0.7, name: "S&P 500 ETF", price: 689.42, ticker: "SPY" },
  { changePercent: -0.4, name: "Growth ETF", price: 621.15, ticker: "QQQ" },
  { changePercent: 0.2, name: "Bond ETF", price: 74.18, ticker: "BND" },
  { changePercent: 1.9, name: "Simulated IPO basket", price: 31.62, ticker: "IPO-LAB" },
];
