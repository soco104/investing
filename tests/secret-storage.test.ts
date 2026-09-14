import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const postgresMock = vi.hoisted(() => ({
  factory: vi.fn(),
  rows: new Map<
    string,
    {
      auth_tag: string;
      ciphertext: string;
      iv: string;
      key_version: string;
    }
  >(),
}));

vi.mock("postgres", () => ({
  default: postgresMock.factory,
}));

describe("market token secret storage", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.resetModules();
    postgresMock.rows.clear();
    postgresMock.factory.mockReset();
    postgresMock.factory.mockImplementation(() => {
      const sql = vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => {
        const query = strings.join(" ");

        if (query.includes("insert into credential_secret_values")) {
          postgresMock.rows.set(String(values[0]), {
            auth_tag: String(values[3]),
            ciphertext: String(values[1]),
            iv: String(values[2]),
            key_version: String(values[4]),
          });
          return Promise.resolve([]);
        }

        if (query.includes("select ciphertext, iv, auth_tag, key_version")) {
          const row = postgresMock.rows.get(String(values[0]));
          return Promise.resolve(row ? [row] : []);
        }

        return Promise.resolve([]);
      });

      Object.assign(sql, { end: vi.fn().mockResolvedValue(undefined) });

      return sql;
    });
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.CREDENTIAL_ENCRYPTION_KEY;
    delete process.env.CREDENTIAL_ENCRYPTION_KEY_VERSION;
    delete process.env.DATABASE_URL;
    delete process.env.MARKET_SECRET_BACKEND;
    delete process.env.MARKET_PROVIDER_TOKENS_SECRET;
    delete process.env.MARKET_PROVIDER_TOKENS_JSON;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.CREDENTIAL_ENCRYPTION_KEY;
    delete process.env.CREDENTIAL_ENCRYPTION_KEY_VERSION;
    delete process.env.DATABASE_URL;
    delete process.env.MARKET_SECRET_BACKEND;
    delete process.env.MARKET_PROVIDER_TOKENS_SECRET;
    delete process.env.MARKET_PROVIDER_TOKENS_JSON;
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

  it("reads DigitalOcean encrypted environment token envelopes", async () => {
    process.env.MARKET_SECRET_BACKEND = "digitalocean-env";
    process.env.MARKET_PROVIDER_TOKENS_JSON = JSON.stringify({
      "market-integration-finnhub": "finnhub-token",
    });

    const { readSecretValue } = await import("@/lib/server/secrets");

    await expect(
      readSecretValue("do-env://MARKET_PROVIDER_TOKENS_JSON#market-integration-finnhub")
    ).resolves.toBe("finnhub-token");
  });

  it("does not pretend DigitalOcean encrypted environment variables can be updated at runtime", async () => {
    process.env.MARKET_SECRET_BACKEND = "digitalocean-env";
    process.env.MARKET_PROVIDER_TOKENS_JSON = "{}";

    const { storeMarketIntegrationToken } = await import("@/lib/server/secrets");

    await expect(
      storeMarketIntegrationToken("integration-new", "new-token")
    ).rejects.toThrow("read-only at runtime");
  });

  it("returns a DigitalOcean secret ref when the credential already exists in the encrypted environment", async () => {
    process.env.MARKET_SECRET_BACKEND = "digitalocean-env";
    process.env.MARKET_PROVIDER_TOKENS_JSON = JSON.stringify({
      "market-integration-existing": "existing-token",
    });

    const { storeMarketIntegrationToken } = await import("@/lib/server/secrets");

    await expect(
      storeMarketIntegrationToken("integration-existing", "existing-token")
    ).resolves.toBe(
      "do-env://MARKET_PROVIDER_TOKENS_JSON#market-integration-existing"
    );
  });

  it("stores and reads encrypted PostgreSQL credentials for DigitalOcean mutable vaults", async () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64");
    process.env.DATABASE_URL = "postgres://futurefund.test/db";
    process.env.MARKET_SECRET_BACKEND = "postgres-encrypted";

    const { readSecretValue, storeMarketIntegrationToken } = await import(
      "@/lib/server/secrets"
    );
    const secretRef = await storeMarketIntegrationToken("integration-finnhub", "finnhub-token");

    expect(secretRef).toBe(
      "pg-encrypted://credential_secret_values#market-integration-finnhub"
    );
    expect(postgresMock.rows.get("market-integration-finnhub")?.ciphertext).not.toBe(
      "finnhub-token"
    );
    await expect(readSecretValue(secretRef)).resolves.toBe("finnhub-token");
  });

  it("requires a 32-byte encryption key for encrypted PostgreSQL credentials", async () => {
    process.env.CREDENTIAL_ENCRYPTION_KEY = "not-long-enough";
    process.env.DATABASE_URL = "postgres://futurefund.test/db";
    process.env.MARKET_SECRET_BACKEND = "postgres-encrypted";

    const { storeMarketIntegrationToken } = await import("@/lib/server/secrets");

    await expect(
      storeMarketIntegrationToken("integration-finnhub", "finnhub-token")
    ).rejects.toThrow("32 bytes");
  });
});
