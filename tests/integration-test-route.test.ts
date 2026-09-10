import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  requirePermission: vi.fn(),
}));
const marketProviders = vi.hoisted(() => ({
  testMarketProvider: vi.fn(),
}));

vi.mock("@/lib/server/auth", () => auth);
vi.mock("@/lib/server/market-providers", () => marketProviders);

function integrationRequest(endpoint: string) {
  return new Request("http://futurefund.test/api/integration-test", {
    body: JSON.stringify({ endpoint, provider: "Example Provider" }),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

describe("integration GET test route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.requirePermission.mockResolvedValue({ response: null, user: { id: "admin" } });
    marketProviders.testMarketProvider.mockResolvedValue({
      importedSymbols: 1,
      message: "GET succeeded.",
      ok: true,
      quotes: [{ changePercent: 0.1, name: "Example", price: 42, ticker: "EXM" }],
      statusCode: 200,
    });
  });

  it("requires admin portal permission", async () => {
    const { POST } = await import("@/app/api/integration-test/route");
    auth.requirePermission.mockResolvedValueOnce({
      response: Response.json({ ok: false }, { status: 403 }),
      user: null,
    });

    const response = await POST(integrationRequest("https://market.example.test/quotes"));

    expect(response.status).toBe(403);
    expect(marketProviders.testMarketProvider).not.toHaveBeenCalled();
  });

  it("rejects private infrastructure endpoints", async () => {
    const { POST } = await import("@/app/api/integration-test/route");
    const response = await POST(integrationRequest("http://metadata.google.internal/"));

    expect(response.status).toBe(400);
    expect(marketProviders.testMarketProvider).not.toHaveBeenCalled();
  });

  it("allows safe HTTPS provider endpoints", async () => {
    const { POST } = await import("@/app/api/integration-test/route");
    const response = await POST(integrationRequest("https://market.example.test/quotes"));

    expect(response.status).toBe(200);
    expect(marketProviders.testMarketProvider).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: "https://market.example.test/quotes" })
    );
  });
});
