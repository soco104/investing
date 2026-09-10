import { beforeEach, describe, expect, it, vi } from "vitest";

const auth = vi.hoisted(() => ({
  requirePermission: vi.fn(),
}));
const audit = vi.hoisted(() => ({
  recordAuditEvent: vi.fn(),
}));
const repository = vi.hoisted(() => ({
  deleteCredentialMetadata: vi.fn(),
  listCredentialMetadata: vi.fn(),
  upsertCredentialMetadata: vi.fn(),
}));
const secrets = vi.hoisted(() => ({
  storeCredentialSecret: vi.fn(),
}));

vi.mock("@/lib/server/auth", () => auth);
vi.mock("@/lib/server/audit", () => audit);
vi.mock("@/lib/server/repository", () => repository);
vi.mock("@/lib/server/secrets", () => secrets);

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

function vaultRequest(body: unknown) {
  return new Request("http://futurefund.test/api/admin/credentials", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
}

describe("admin credential vault", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.requirePermission.mockResolvedValue({ response: null, user: adminUser });
    audit.recordAuditEvent.mockResolvedValue({ id: "audit-vault" });
    repository.deleteCredentialMetadata.mockResolvedValue(undefined);
    repository.listCredentialMetadata.mockResolvedValue([]);
    repository.upsertCredentialMetadata.mockResolvedValue(undefined);
    secrets.storeCredentialSecret.mockResolvedValue(
      "projects/test/secrets/futurefund-market-provider-tokens#credential-1"
    );
  });

  it("lists credential metadata without returning secret values", async () => {
    const { GET } = await import("@/app/api/admin/credentials/route");
    repository.listCredentialMetadata.mockResolvedValueOnce([
      {
        credential_type: "api_token",
        id: "credential-1",
        label: "District market token",
        provider_name: "Example Provider",
        status: "active",
        token_placement: "bearer",
      },
    ]);

    const response = await GET(
      new Request("http://futurefund.test/api/admin/credentials")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(JSON.stringify(body)).not.toContain("secret-token");
    expect(body.credentials).toHaveLength(1);
  });

  it("audits before storing a new secret and metadata record", async () => {
    const { POST } = await import("@/app/api/admin/credentials/route");
    const response = await POST(
      vaultRequest({
        action: "create",
        credentialId: "credential-1",
        credentialType: "api_token",
        label: "District market token",
        providerName: "Example Provider",
        scopeId: "7th Grade Finance A",
        scopeType: "class",
        secretValue: "secret-token",
        tokenPlacement: "x-api-key",
        username: "vendor-admin@example.edu",
      })
    );

    expect(response.status).toBe(200);
    expect(audit.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "credential.created",
        targetId: "credential-1",
      })
    );
    expect(secrets.storeCredentialSecret).toHaveBeenCalledWith(
      "credential-1",
      "secret-token"
    );
    expect(repository.upsertCredentialMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        credentialId: "credential-1",
        secretRef:
          "projects/test/secrets/futurefund-market-provider-tokens#credential-1",
        usernameHint: "ve***u",
      })
    );
    expect(
      audit.recordAuditEvent.mock.invocationCallOrder[0]
    ).toBeLessThan(secrets.storeCredentialSecret.mock.invocationCallOrder[0]);
  });

  it("does not store a secret when audit persistence fails", async () => {
    const { POST } = await import("@/app/api/admin/credentials/route");
    audit.recordAuditEvent.mockRejectedValueOnce(new Error("audit unavailable"));

    await expect(
      POST(
        vaultRequest({
          action: "rotate",
          credentialId: "credential-1",
          credentialType: "api_token",
          label: "District market token",
          providerName: "Example Provider",
          secretValue: "new-secret",
        })
      )
    ).rejects.toThrow("audit unavailable");
    expect(secrets.storeCredentialSecret).not.toHaveBeenCalled();
    expect(repository.upsertCredentialMetadata).not.toHaveBeenCalled();
  });

  it("soft-deletes credential metadata after audit", async () => {
    const { POST } = await import("@/app/api/admin/credentials/route");
    const response = await POST(
      vaultRequest({
        action: "delete",
        credentialId: "credential-1",
      })
    );

    expect(response.status).toBe(200);
    expect(audit.recordAuditEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: "credential.deleted" })
    );
    expect(repository.deleteCredentialMetadata).toHaveBeenCalledWith("credential-1");
  });
});
