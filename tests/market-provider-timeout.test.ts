import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { testMarketProvider } from "@/lib/server/market-providers";

describe("market provider adapter timeout", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = originalFetch;
  });

  it("aborts slow provider calls", async () => {
    globalThis.fetch = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("Aborted", "AbortError"));
          });
        })
    );

    const resultPromise = testMarketProvider({
      endpoint: "https://market.example.test/quotes",
      provider: "Slow Provider",
      timeoutMs: 1000,
    });

    await vi.advanceTimersByTimeAsync(1000);
    const result = await resultPromise;

    expect(result).toMatchObject({
      importedSymbols: 0,
      ok: false,
      quotes: [],
    });
    expect(result.message).toContain("timed out");
  });
});
