import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("market token secret storage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.MARKET_PROVIDER_TOKENS_SECRET;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.MARKET_PROVIDER_TOKENS_SECRET;
  });

  it("stores and reads local tokens without exposing them in the secret ref", async () => {
    const { readSecretValue, storeMarketIntegrationToken } = await import(
      "@/lib/server/secrets"
    );

    const secretRef = await storeMarketIntegrationToken("integration-local", "local-token");

    expect(secretRef).toBe("local://futurefund-credential-vault#market-integration-local");
    await expect(readSecretValue(secretRef)).resolves.toBe("local-token");
  });

  it("adds a version to the provisioned aggregate secret instead of creating secrets", async () => {
    process.env.GOOGLE_CLOUD_PROJECT = "district-project";
    process.env.MARKET_PROVIDER_TOKENS_SECRET =
      "projects/district-project/secrets/futurefund-market-provider-tokens";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          access_token: "metadata-token",
        })
      )
      .mockResolvedValueOnce(
        Response.json({
          payload: {
            data: btoa(JSON.stringify({ "market-integration-existing": "existing-token" })),
          },
        })
      )
      .mockResolvedValueOnce(
        Response.json({
          access_token: "metadata-token",
        })
      )
      .mockResolvedValueOnce(Response.json({ name: "versions/2" }));
    global.fetch = fetchMock;

    const { storeMarketIntegrationToken } = await import("@/lib/server/secrets");
    const secretRef = await storeMarketIntegrationToken("integration-new", "new-token");
    const addVersionCall = fetchMock.mock.calls.find(([url]) =>
      String(url).endsWith(":addVersion")
    );

    expect(secretRef).toBe(
      "projects/district-project/secrets/futurefund-market-provider-tokens#market-integration-new"
    );
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("?secretId="))).toBe(
      false
    );
    expect(addVersionCall).toBeDefined();

    const requestBody = JSON.parse(addVersionCall?.[1]?.body as string) as {
      payload: { data: string };
    };
    expect(JSON.parse(atob(requestBody.payload.data))).toEqual({
      "market-integration-existing": "existing-token",
      "market-integration-new": "new-token",
    });
  });
});
