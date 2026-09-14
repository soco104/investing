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

  if (isFinnhubProvider(config.provider, endpoint)) {
    return testFinnhubProvider({ ...config, endpoint }, symbolLimit);
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

async function testFinnhubProvider(
  config: MarketProviderConfig,
  symbolLimit: number
): Promise<MarketProviderResult> {
  const timeoutMs = boundedTimeout(config.timeoutMs);
  const symbols = parseAllowedSymbols(config.allowedSymbols);
  const quoteSymbols =
    symbols.length > 0
      ? symbols.slice(0, symbolLimit)
      : await fetchFinnhubSymbols(config, symbolLimit, timeoutMs);

  if (quoteSymbols.length === 0) {
    return {
      importedSymbols: 0,
      message:
        symbols.length > 0
          ? "No valid Finnhub symbols were configured."
          : "Finnhub symbol discovery returned no importable symbols.",
      ok: false,
      quotes: [],
    };
  }

  const quoteResults = await mapWithConcurrency(
    quoteSymbols,
    4,
    async (symbol) => fetchFinnhubQuote(config, symbol, timeoutMs)
  );
  const firstFailure = quoteResults.find((result) => !result.ok);
  const quotes = quoteResults
    .map((result) => result.quote)
    .filter((quote): quote is NormalizedMarketQuote => Boolean(quote));

  return {
    importedSymbols: quotes.length,
    message: firstFailure
      ? `Finnhub GET partially succeeded. Imported ${quotes.length} of ${quoteSymbols.length} symbols.`
      : `Finnhub GET succeeded. Imported ${quotes.length} symbols.`,
    ok: quotes.length > 0 && !firstFailure,
    quotes,
    statusCode: firstFailure?.statusCode ?? 200,
  };
}

async function fetchFinnhubSymbols(
  config: MarketProviderConfig,
  symbolLimit: number,
  timeoutMs: number
) {
  const url = finnhubUrl(config.endpoint, "/stock/symbol", config, {
    forcePath: true,
  });
  url.searchParams.set("exchange", "US");

  const response = await fetchWithTimeout(url, config, timeoutMs);

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload : [];

  return rows
    .map((row) => {
      if (!row || typeof row !== "object") {
        return "";
      }
      const record = row as Record<string, unknown>;
      return String(record.displaySymbol ?? record.symbol ?? "").trim().toUpperCase();
    })
    .filter(Boolean)
    .slice(0, symbolLimit);
}

async function fetchFinnhubQuote(
  config: MarketProviderConfig,
  symbol: string,
  timeoutMs: number
) {
  try {
    const url = finnhubUrl(config.endpoint, "/quote", config);
    url.searchParams.set("symbol", symbol);

    const response = await fetchWithTimeout(url, config, timeoutMs);

    if (!response.ok) {
      return { ok: false, statusCode: response.status };
    }

    return {
      ok: true,
      quote: normalizeFinnhubQuote(symbol, await response.json()),
      statusCode: response.status,
    };
  } catch {
    return { ok: false };
  }
}

function normalizeFinnhubQuote(symbol: string, payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const price = Number(record.c);

  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }

  const directPercent = Number(record.dp);
  const dollarChange = Number(record.d);
  const previousClose = Number(record.pc);
  const calculatedPercent =
    Number.isFinite(dollarChange) && Number.isFinite(previousClose) && previousClose > 0
      ? (dollarChange / previousClose) * 100
      : 0;

  return {
    changePercent: Number.isFinite(directPercent) ? directPercent : calculatedPercent,
    name: symbol,
    price,
    ticker: symbol,
  };
}

async function fetchWithTimeout(
  url: URL,
  config: MarketProviderConfig,
  timeoutMs: number
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: finnhubHeaders(config),
      method: "GET",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function finnhubUrl(
  endpoint: string,
  fallbackPath: string,
  config: MarketProviderConfig,
  options: { forcePath?: boolean } = {}
) {
  const configured = new URL(endpoint);
  const path =
    options.forcePath ||
    configured.pathname === "/" ||
    configured.pathname === "/api/v1"
      ? fallbackPath
      : configured.pathname;
  const url = new URL(`https://${configured.host}${path}`);

  if (configured.search) {
    for (const [key, value] of configured.searchParams.entries()) {
      if (key !== "symbol" && key !== "token") {
        url.searchParams.set(key, value);
      }
    }
  }

  if (config.token && config.tokenPlacement === "query") {
    url.searchParams.set("token", config.token);
  }

  return url;
}

function finnhubHeaders(config: MarketProviderConfig) {
  if (!config.token || config.tokenPlacement === "query") {
    return undefined;
  }

  return { "X-Finnhub-Token": config.token };
}

function isFinnhubProvider(provider: string, endpoint: string) {
  let host = "";

  try {
    host = new URL(endpoint).hostname.toLowerCase();
  } catch {
    host = "";
  }

  return (
    provider.toLowerCase().includes("finnhub") ||
    host.endsWith("finnhub.io")
  );
}

function parseAllowedSymbols(allowedSymbols?: string) {
  return (allowedSymbols ?? "")
    .split(",")
    .map((symbol) => symbol.trim().toUpperCase())
    .filter(Boolean);
}

function boundedTimeout(timeoutMs?: number) {
  return Math.min(
    Math.max(timeoutMs ?? Number(process.env.MARKET_PROVIDER_TIMEOUT_MS ?? 7000), 1000),
    30000
  );
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
) {
  const results: R[] = [];
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker())
  );

  return results;
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
