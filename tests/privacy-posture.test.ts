import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({ requirePermission: vi.fn() }));
const audit = vi.hoisted(() => ({ recordAuditEvent: vi.fn() }));
const repository = vi.hoisted(() => ({
  createPrivacyPosture: vi.fn(),
  recordEmailDelivery: vi.fn(),
}));

vi.mock("@/lib/server/auth", () => auth);
vi.mock("@/lib/server/audit", () => audit);
vi.mock("@/lib/server/repository", () => repository);

const adminUser = {
  alias: "DistrictAdmin",
  className: "District",
  classNames: ["District"],
  email: "sam.gordon@example.edu",
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

function post(body: unknown) {
  return new Request("http://futurefund.test/api/admin/privacy", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

describe("privacy posture saving", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.requirePermission.mockResolvedValue({ response: null, user: adminUser });
    audit.recordAuditEvent.mockResolvedValue({ id: "audit-privacy" });
  });

  it("saves each option the Privacy posture page offers, and audits it", async () => {
    const { POST } = await import("@/app/api/admin/privacy/route");

    for (const posture of ["standard", "state-restricted", "district-custom"]) {
      const response = await POST(
        post({ posture, privacyContactEmail: " privacy@district.org " })
      );
      expect(response.status, posture).toBe(200);
      expect(repository.createPrivacyPosture).toHaveBeenLastCalledWith(
        expect.objectContaining({ posture, privacyContactEmail: "privacy@district.org" })
      );
    }

    expect(audit.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "privacy.updated", actor: adminUser })
    );
  });

  it("rejects an unknown posture", async () => {
    const { POST } = await import("@/app/api/admin/privacy/route");
    const response = await POST(
      post({ posture: "strict", privacyContactEmail: "privacy@district.org" })
    );

    expect(response.status).toBe(400);
    expect(repository.createPrivacyPosture).not.toHaveBeenCalled();
  });

  it("rejects an invalid contact email", async () => {
    const { POST } = await import("@/app/api/admin/privacy/route");
    const response = await POST(post({ posture: "standard", privacyContactEmail: "nope" }));

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      message: "Enter a valid privacy contact email.",
    });
    expect(repository.createPrivacyPosture).not.toHaveBeenCalled();
  });

  it("requires the Admin portal permission", async () => {
    auth.requirePermission.mockResolvedValue({
      response: Response.json({ ok: false }, { status: 403 }),
      user: null,
    });
    const { POST } = await import("@/app/api/admin/privacy/route");

    expect((await POST(post({ posture: "standard" })))?.status).toBe(403);
  });
});
