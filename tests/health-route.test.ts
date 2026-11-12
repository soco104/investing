import { afterEach, describe, expect, it, vi } from "vitest";

describe("health route", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Regression: issue #17. This test used to rely on DATABASE_URL being unset
  // in the environment, so it failed wherever a database was configured (CI).
  it("reports unhealthy when the database is not configured", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const { GET } = await import("@/app/api/health/route");
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      database: "not-configured",
      ok: false,
      service: "futurefund-classroom",
    });
  });
});
