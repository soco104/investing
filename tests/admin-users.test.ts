import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  requirePermission: vi.fn(),
}));
const audit = vi.hoisted(() => ({
  recordAuditEvent: vi.fn(),
}));
const repository = vi.hoisted(() => ({
  createOrUpdateUsers: vi.fn(),
}));

vi.mock("@/lib/server/auth", () => auth);
vi.mock("@/lib/server/audit", () => audit);
vi.mock("@/lib/server/repository", () => repository);

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

function mutationRequest(body: unknown) {
  return new Request("http://futurefund.test/api/admin/users", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

describe("admin user mutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.requirePermission.mockResolvedValue({ response: null, user: adminUser });
    audit.recordAuditEvent.mockResolvedValue({ id: "audit-1" });
    repository.createOrUpdateUsers.mockResolvedValue({ affected: 1 });
  });

  it("persists individual user creation behind admin authorization and audit", async () => {
    const { POST } = await import("@/app/api/admin/users/route");
    const response = await POST(
      mutationRequest({
        action: "create",
        reason: "new enrollment",
        users: [
          {
            alias: "BudgetAce",
            className: "7th Grade Finance A",
            email: "new.student@lincolnusd.edu",
            firstName: "New",
            lastName: "Student",
            role: "Student",
            temporaryPassword: "Temporary123!",
          },
        ],
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      persisted: true,
    });
    expect(response.status).toBe(201);
    expect(auth.requirePermission).toHaveBeenCalledWith(expect.any(Request), "adminPortal");
    expect(audit.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "user.created", actor: adminUser })
    );
    expect(repository.createOrUpdateUsers).toHaveBeenCalledWith(
      expect.objectContaining({ action: "create", actor: adminUser })
    );
  });

  it("does not mutate users when audit persistence fails", async () => {
    const { POST } = await import("@/app/api/admin/users/route");
    audit.recordAuditEvent.mockRejectedValueOnce(new Error("audit database unavailable"));

    await expect(
      POST(mutationRequest({ action: "disable", targetUserId: "user-avery" }))
    ).rejects.toThrow("audit database unavailable");
    expect(repository.createOrUpdateUsers).not.toHaveBeenCalled();
  });

  it("persists user modifications behind admin authorization and audit", async () => {
    const { POST } = await import("@/app/api/admin/users/route");
    const response = await POST(
      mutationRequest({
        action: "update",
        reason: "correct roster details",
        targetUserId: "user-avery",
        users: [
          {
            alias: "ValueVoyager2",
            className: "8th Grade Investing Lab",
            email: "avery.updated@lincolnusd.edu",
            enabled: true,
            firstName: "Avery",
            lastName: "Johnson",
            role: "Student",
          },
        ],
      })
    );

    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      persisted: true,
    });
    expect(response.status).toBe(201);
    expect(audit.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "user.modified",
        actor: adminUser,
        targetId: "user-avery",
      })
    );
    expect(repository.createOrUpdateUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        actor: adminUser,
        targetUserId: "user-avery",
      })
    );
  });

  it("rejects admin mutations without the adminPortal permission", async () => {
    const { POST } = await import("@/app/api/admin/users/route");
    auth.requirePermission.mockResolvedValueOnce({
      response: Response.json({ ok: false }, { status: 403 }),
      user: null,
    });

    const response = await POST(mutationRequest({ action: "enable", targetUserId: "user-1" }));

    expect(response?.status).toBe(403);
    expect(audit.recordAuditEvent).not.toHaveBeenCalled();
    expect(repository.createOrUpdateUsers).not.toHaveBeenCalled();
  });
});
