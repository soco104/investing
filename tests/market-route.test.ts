import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  hasProductionDatabase: vi.fn(),
  listLatestMarketQuotes: vi.fn(),
}));
const auth = vi.hoisted(() => ({
  userFromRequest: vi.fn(),
}));

vi.mock("@/lib/server/repository", () => repository);
vi.mock("@/lib/server/auth", () => auth);

describe("market snapshot route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serves provider-backed cached quotes when production data exists", async () => {
    const { GET } = await import("@/app/api/market/route");
    repository.hasProductionDatabase.mockReturnValue(true);
    auth.userFromRequest.mockResolvedValue(null);
    repository.listLatestMarketQuotes.mockResolvedValue([
      {
        change_percent: "1.25",
        fetched_at: new Date(),
        integration_id: "integration-1",
        name: "Example ETF",
        price: "101.42",
        ticker: "EXM",
      },
    ]);

    const response = await GET(
      new Request("http://futurefund.test/api/market?className=7th%20Grade%20Finance%20A")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      mode: "provider-backed-delayed",
      source: "provider-cache",
    });
    expect(body.symbols).toEqual([
      expect.objectContaining({
        changePercent: 1.25,
        name: "Example ETF",
        price: 101.42,
        ticker: "EXM",
      }),
    ]);
    expect(repository.listLatestMarketQuotes).toHaveBeenCalledWith(
      "7th Grade Finance A"
    );
  });
});
