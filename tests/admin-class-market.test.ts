import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  userFromRequest: vi.fn(),
}));
const audit = vi.hoisted(() => ({
  recordAuditEvent: vi.fn(),
}));
const repository = vi.hoisted(() => ({
  getClassMarketState: vi.fn(),
  upsertClassMarketConfig: vi.fn(),
}));

vi.mock("@/lib/server/auth", () => auth);
vi.mock("@/lib/server/audit", () => audit);
vi.mock("@/lib/server/repository", () => repository);

const teacherUser = {
  className: "7th Grade Finance A",
  classNames: ["7th Grade Finance A", "7th Grade Finance B"],
  email: "erivera@lincolnusd.edu",
  id: "user-rivera",
  permissions: {
    adminPortal: false,
    teacherPortal: true,
  },
  role: "Teacher" as const,
};

describe("admin class market route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.userFromRequest.mockResolvedValue(teacherUser);
    audit.recordAuditEvent.mockResolvedValue({ id: "audit-class-market" });
    repository.getClassMarketState.mockResolvedValue({
      className: "7th Grade Finance B",
      config: {},
      engineMode: "central-simulator",
      symbols: [],
    });
    repository.upsertClassMarketConfig.mockResolvedValue(undefined);
  });

  it("allows teachers to configure a managed class market", async () => {
    const { POST } = await import("@/app/api/admin/class-market/route");
    const response = await POST(
      new Request("http://futurefund.test/api/admin/class-market", {
        body: JSON.stringify({
          className: "7th Grade Finance B",
          eventScenario: "growth_rally",
          simulationMode: "teacher_scenario",
        }),
        method: "POST",
      })
    );

    expect(response.status).toBe(201);
    expect(repository.upsertClassMarketConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        actor: teacherUser,
        config: expect.objectContaining({
          className: "7th Grade Finance B",
          eventScenario: "growth_rally",
        }),
      })
    );
  });

  it("blocks teachers from configuring unmanaged class markets", async () => {
    const { POST } = await import("@/app/api/admin/class-market/route");
    const response = await POST(
      new Request("http://futurefund.test/api/admin/class-market", {
        body: JSON.stringify({
          className: "High School Personal Finance",
          simulationMode: "teacher_scenario",
        }),
        method: "POST",
      })
    );

    expect(response.status).toBe(403);
    expect(repository.upsertClassMarketConfig).not.toHaveBeenCalled();
  });
});
