import { beforeEach, describe, expect, it, vi } from "vitest";

const repo = vi.hoisted(() => ({
  createSession: vi.fn(),
  findActiveSession: vi.fn(),
  findUserById: vi.fn(),
  findUserByPassword: vi.fn(),
  hasProductionDatabase: vi.fn(),
  revokeSession: vi.fn(),
}));

vi.mock("@/lib/server/repository", () => repo);

const adminUser = {
  alias: "DistrictAdmin",
  className: "District",
  email: "sgordon@lincolnusd.edu",
  firstName: "Sam",
  id: "user-admin",
  lastName: "Gordon",
  permissions: {
    adminPortal: true,
    portfolioCorrections: true,
    questImportExport: true,
    studentProfile: true,
    teacherPortal: true,
  },
  role: "Admin" as const,
};

describe("auth session trust", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SESSION_SECRET = "test-session-secret-with-enough-entropy";
    repo.createSession.mockResolvedValue(undefined);
    repo.findUserById.mockResolvedValue(adminUser);
    repo.hasProductionDatabase.mockReturnValue(true);
    repo.revokeSession.mockResolvedValue(undefined);
  });

  it("requires an active persisted session and rejects a revoked session", async () => {
    const { createSessionToken, revokeCurrentSession, userFromRequest } = await import(
      "@/lib/server/auth"
    );
    const token = await createSessionToken(adminUser);
    const request = new Request("http://futurefund.test/api/auth/me", {
      headers: { authorization: `Bearer ${token}` },
    });

    repo.findActiveSession.mockResolvedValue({ user_id: adminUser.id });
    await expect(userFromRequest(request)).resolves.toEqual(adminUser);

    await expect(revokeCurrentSession(request)).resolves.toBe(true);
    expect(repo.revokeSession).toHaveBeenCalledWith(
      repo.createSession.mock.calls[0][0].sessionTokenHash
    );

    repo.findActiveSession.mockResolvedValue(null);
    await expect(userFromRequest(request)).resolves.toBeNull();
  });

  it("does not allow seeded demo credentials in production without opt-in", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    delete process.env.ALLOW_DEMO_AUTH;
    repo.hasProductionDatabase.mockReturnValue(false);
    repo.findUserByPassword.mockResolvedValue(null);

    const { authenticatePassword } = await import("@/lib/server/auth");

    await expect(
      authenticatePassword("sam.gordon@example.edu", "admin-demo")
    ).resolves.toBeNull();

    process.env.NODE_ENV = previousNodeEnv;
  });
});
