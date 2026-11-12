import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  requirePermission: vi.fn(),
}));
const audit = vi.hoisted(() => ({
  recordAuditEvent: vi.fn(),
}));
const repository = vi.hoisted(() => ({
  completePasswordReset: vi.fn(),
  createPasswordReset: vi.fn(),
  recordEmailDelivery: vi.fn(),
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

function postRequest(url: string, body: unknown) {
  return new Request(url, {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

describe("password reset flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.requirePermission.mockResolvedValue({ response: null, user: adminUser });
    audit.recordAuditEvent.mockResolvedValue({ id: "audit-reset" });
    repository.createPasswordReset.mockResolvedValue("user-avery");
    repository.completePasswordReset.mockResolvedValue(true);
  });

  it("lets admins create password reset requests and audits them", async () => {
    const { POST } = await import("@/app/api/admin/password-resets/route");
    const response = await POST(
      postRequest("http://futurefund.test/api/admin/password-resets", {
        email: "Avery.Johnson@Student.LincolnUSD.edu",
        reason: "student forgot password",
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, resetStatus: "pending_delivery" });
    expect(body.resetUrl).toContain("/reset-password?token=");
    expect(repository.createPasswordReset).toHaveBeenCalledWith(
      expect.objectContaining({
        requestedByUserId: adminUser.id,
        userEmail: "avery.johnson@student.lincolnusd.edu",
      })
    );
    expect(audit.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "password_reset.requested",
        actor: adminUser,
        targetId: "avery.johnson@student.lincolnusd.edu",
      })
    );
  });

  it("emails the reset link through Resend when email is set up", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "FutureFund <no-reply@futurefund.test>");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "msg_1" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      const { POST } = await import("@/app/api/admin/password-resets/route");
      const response = await POST(
        postRequest("https://classroom.test/api/admin/password-resets", {
          email: "avery.johnson@example.edu",
        })
      );
      const body = await response.json();

      expect(body).toMatchObject({
        delivery: "sent",
        ok: true,
        resetStatus: "email_sent",
      });
      const sent = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(sent.to).toEqual(["avery.johnson@example.edu"]);
      expect(sent.text).toContain("https://classroom.test/reset-password?token=");
      expect(audit.recordAuditEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          context: expect.objectContaining({ delivery: "sent" }),
        })
      );
    } finally {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    }
  });

  it("says so when no user has that email, without sending anything", async () => {
    repository.createPasswordReset.mockRejectedValue(
      new Error("No active user was found for that email.")
    );
    const { POST } = await import("@/app/api/admin/password-resets/route");
    const response = await POST(
      postRequest("http://futurefund.test/api/admin/password-resets", {
        email: "nobody@example.edu",
      })
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({
      message: "No user was found with the email nobody@example.edu.",
      ok: false,
    });
    expect(repository.recordEmailDelivery).not.toHaveBeenCalled();
  });

  it("completes reset tokens with minimum password strength", async () => {
    const { POST } = await import("@/app/api/auth/reset-password/route");
    const response = await POST(
      postRequest("http://futurefund.test/api/auth/reset-password", {
        newPassword: "NewClassroom123!",
        token: "reset-token",
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ok: true,
      resetStatus: "completed",
    });
    expect(repository.completePasswordReset).toHaveBeenCalledWith(
      expect.objectContaining({ newPassword: "NewClassroom123!" })
    );
  });

  it("rejects weak reset passwords before persistence", async () => {
    const { POST } = await import("@/app/api/auth/reset-password/route");
    const response = await POST(
      postRequest("http://futurefund.test/api/auth/reset-password", {
        newPassword: "short",
        token: "reset-token",
      })
    );

    expect(response.status).toBe(400);
    expect(repository.completePasswordReset).not.toHaveBeenCalled();
  });
});
