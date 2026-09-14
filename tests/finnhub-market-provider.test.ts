import { afterEach, describe, expect, it, vi } from "vitest";

import { testMarketProvider } from "@/lib/server/market-providers";

describe("Finnhub market provider adapter", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("imports allowed symbols through Finnhub quote calls with query token auth", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input.toString());

      expect(url.searchParams.get("token")).toBe("finnhub-token");

      return Response.json({
        c: url.searchParams.get("symbol") === "AAPL" ? 261.74 : 512.3,
        d: 2.29,
        dp: 0.88,
        pc: 259.45,
        t: 1582641000,
      });
    });

    const result = await testMarketProvider({
      allowedSymbols: "AAPL, MSFT",
      endpoint: "https://finnhub.io/api/v1/quote",
      provider: "Finnhub",
      token: "finnhub-token",
      tokenPlacement: "query",
    });

    expect(result).toMatchObject({
      importedSymbols: 2,
      ok: true,
      quotes: [
        { changePercent: 0.88, name: "AAPL", price: 261.74, ticker: "AAPL" },
        { changePercent: 0.88, name: "MSFT", price: 512.3, ticker: "MSFT" },
      ],
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it("discovers US symbols when the allowed symbol field is blank", async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(input.toString());

      if (url.pathname.endsWith("/stock/symbol")) {
        expect(url.searchParams.get("exchange")).toBe("US");
        return Response.json([
          { description: "Apple Inc", displaySymbol: "AAPL", symbol: "AAPL" },
          { description: "Microsoft Corp", displaySymbol: "MSFT", symbol: "MSFT" },
          { description: "Nvidia Corp", displaySymbol: "NVDA", symbol: "NVDA" },
        ]);
      }

      return Response.json({
        c: 100,
        d: 1,
        pc: 99,
      });
    });

    const result = await testMarketProvider({
      allowedSymbols: "",
      endpoint: "https://finnhub.io/api/v1/quote",
      maxSymbols: 2,
      provider: "Finnhub",
      token: "finnhub-token",
      tokenPlacement: "query",
    });

    expect(result.ok).toBe(true);
    expect(result.importedSymbols).toBe(2);
    expect(result.quotes.map((quote) => quote.ticker)).toEqual(["AAPL", "MSFT"]);
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it("uses the Finnhub token header when query placement is not selected", async () => {
    globalThis.fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      expect(init?.headers).toEqual({ "X-Finnhub-Token": "finnhub-token" });

      return Response.json({
        c: 261.74,
        d: 2.29,
        pc: 259.45,
      });
    });

    const result = await testMarketProvider({
      allowedSymbols: "AAPL",
      endpoint: "https://finnhub.io/api/v1/quote",
      provider: "Finnhub",
      token: "finnhub-token",
      tokenPlacement: "bearer",
    });

    expect(result.ok).toBe(true);
    expect(result.quotes[0]).toMatchObject({
      changePercent: expect.closeTo(0.8826, 4),
      ticker: "AAPL",
    });
  });
});
