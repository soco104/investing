import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  listPollableIntegrations: vi.fn(),
  markCredentialUsed: vi.fn(),
  updateIntegrationPollResult: vi.fn(),
}));
const secrets = vi.hoisted(() => ({
  readSecretValue: vi.fn(),
}));
const marketProviders = vi.hoisted(() => ({
  testMarketProvider: vi.fn(),
}));

vi.mock("@/lib/server/repository", () => repository);
vi.mock("@/lib/server/secrets", () => secrets);
vi.mock("@/lib/server/market-providers", () => marketProviders);

describe("market polling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "poll-secret";
    repository.markCredentialUsed.mockResolvedValue(undefined);
    repository.updateIntegrationPollResult.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it("rejects polling requests without the scheduler secret", async () => {
    const { POST } = await import("@/app/api/market/poll/route");
    const response = await POST(
      new Request("http://futurefund.test/api/market/poll", { method: "POST" })
    );

    expect(response.status).toBe(401);
    expect(repository.listPollableIntegrations).not.toHaveBeenCalled();
  });

  it("reads stored provider tokens and records poll results", async () => {
    const { POST } = await import("@/app/api/market/poll/route");
    repository.listPollableIntegrations.mockResolvedValue([
      {
        allowed_symbols_csv: "",
        endpoint_url: "https://market.example.test/v1/quotes",
        id: "integration-1",
        credential_id: "market-integration-1",
        max_symbols: 200,
        provider_name: "Example Market",
        token_placement: "x-api-key",
        token_required: true,
        token_secret_ref: "projects/test/secrets/futurefund-market-provider-tokens#integration-1",
      },
    ]);
    secrets.readSecretValue.mockResolvedValue("provider-token");
    marketProviders.testMarketProvider.mockResolvedValue({
      importedSymbols: 200,
      message: "GET succeeded.",
      ok: true,
      quotes: [],
      statusCode: 200,
    });

    const response = await POST(
      new Request("http://futurefund.test/api/market/poll", {
        headers: { "x-futurefund-cron": "poll-secret" },
        method: "POST",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ integrationCount: 1, ok: true });
    expect(secrets.readSecretValue).toHaveBeenCalledWith(
      "projects/test/secrets/futurefund-market-provider-tokens#integration-1"
    );
    expect(marketProviders.testMarketProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        maxSymbols: 200,
        token: "provider-token",
        tokenPlacement: "x-api-key",
      })
    );
    expect(repository.markCredentialUsed).toHaveBeenCalledWith("market-integration-1");
    expect(repository.updateIntegrationPollResult).toHaveBeenCalledWith({
      errorMessage: undefined,
      integrationId: "integration-1",
      ok: true,
      quotes: [],
    });
  });
});
