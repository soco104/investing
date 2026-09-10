import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  hasProductionDatabase: vi.fn(),
  listErrorEvents: vi.fn(),
  listPerformanceEvents: vi.fn(),
  recordErrorEvent: vi.fn(),
  recordPerformanceEvent: vi.fn(),
}));

vi.mock("@/lib/server/repository", () => repository);

describe("protected observability ingest", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "production";
    process.env.OBSERVABILITY_INGEST_SECRET = "ingest-secret";
    repository.hasProductionDatabase.mockReturnValue(false);
    repository.recordErrorEvent.mockResolvedValue(undefined);
    repository.recordPerformanceEvent.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    delete process.env.OBSERVABILITY_INGEST_SECRET;
  });

  it("rejects unauthenticated error ingest in production", async () => {
    const { POST } = await import("@/app/api/observability/errors/route");
    const response = await POST(
      new Request("http://futurefund.test/api/observability/errors", {
        body: JSON.stringify({ message: "boom" }),
        method: "POST",
      })
    );

    expect(response.status).toBe(401);
    expect(repository.recordErrorEvent).not.toHaveBeenCalled();
  });

  it("accepts performance ingest with the configured service secret", async () => {
    const { POST } = await import("@/app/api/observability/performance/route");
    const response = await POST(
      new Request("http://futurefund.test/api/observability/performance", {
        body: JSON.stringify({
          durationMs: 85,
          operation: "marketSnapshot",
          route: "/api/market",
        }),
        headers: { "x-futurefund-ingest": "ingest-secret" },
        method: "POST",
      })
    );

    expect(response.status).toBe(201);
    expect(repository.recordPerformanceEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        durationMs: 85,
        operation: "marketSnapshot",
        route: "/api/market",
      })
    );
  });
});
