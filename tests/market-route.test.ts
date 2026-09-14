import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  getClassMarketState: vi.fn(),
  hasProductionDatabase: vi.fn(),
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
    repository.getClassMarketState.mockResolvedValue({
      className: "7th Grade Finance A",
      config: {
        simulationMode: "teacher_scenario",
      },
      disclosure: "Educational simulation only.",
      engineMode: "central-simulator",
      generatedAt: "2026-09-14T12:00:00.000Z",
      symbols: [
        {
          changePercent: 1.25,
          lessonUse: "Provider-backed classroom market data",
          name: "Example ETF",
          price: 101.42,
          simulatedChangePercent: 0.75,
          simulatedPrice: 102.18,
          ticker: "EXM",
        },
      ],
    });

    const response = await GET(
      new Request("http://futurefund.test/api/market?className=7th%20Grade%20Finance%20A")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      mode: "teacher_scenario",
      source: "central-simulator",
    });
    expect(body.symbols).toEqual([
      expect.objectContaining({
        changePercent: 0.75,
        name: "Example ETF",
        price: 102.18,
        ticker: "EXM",
      }),
    ]);
    expect(repository.getClassMarketState).toHaveBeenCalledWith(
      "7th Grade Finance A"
    );
  });
});
