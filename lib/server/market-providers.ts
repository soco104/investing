export type MarketProviderConfig = {
  allowedSymbols?: string;
  endpoint: string;
  maxSymbols?: number;
  provider: string;
  token?: string;
  tokenPlacement?: "bearer" | "query" | "x-api-key";
};

export type MarketProviderResult = {
  importedSymbols: number;
  message: string;
  ok: boolean;
  statusCode?: number;
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
    };
  }

  const symbolLimit = resolvedSymbolLimit(config.allowedSymbols, config.maxSymbols);

  if (endpoint.startsWith("/api/market")) {
    return {
      importedSymbols: Math.min(symbolLimit, 4),
      message: "GET succeeded from the classroom-safe market endpoint.",
      ok: true,
      statusCode: 200,
    };
  }

  const url = tokenizedUrl(endpoint, config);
  const headers = tokenizedHeaders(config);
  const response = await fetch(url, { headers, method: "GET" });

  return {
    importedSymbols: response.ok ? symbolLimit : 0,
    message: response.ok
      ? `GET succeeded. Imported up to ${symbolLimit} symbols.`
      : `GET returned ${response.status}.`,
    ok: response.ok,
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
