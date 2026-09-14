import { describe, expect, it } from "vitest";

describe("health route", () => {
  it("reports unhealthy when the database is not configured", async () => {
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
