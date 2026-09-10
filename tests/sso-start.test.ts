import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  createSession: vi.fn(),
  findActiveSession: vi.fn(),
  findUserById: vi.fn(),
  findUserByPassword: vi.fn(),
  hasProductionDatabase: vi.fn(),
  revokeSession: vi.fn(),
}));

vi.mock("@/lib/server/repository", () => repository);

describe("district SSO start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repository.hasProductionDatabase.mockReturnValue(false);
    process.env.SSO_AUTHORIZATION_URL = "https://idp.example.edu/oauth2/authorize";
    process.env.SSO_CLIENT_ID = "futurefund-client";
    process.env.SSO_REDIRECT_URI = "https://futurefund.example.edu/api/auth/sso/callback";
  });

  afterEach(() => {
    delete process.env.SSO_AUTHORIZATION_URL;
    delete process.env.SSO_CLIENT_ID;
    delete process.env.SSO_REDIRECT_URI;
    delete process.env.SSO_SCOPE;
  });

  it("returns an IdP redirect URL with state and nonce cookies", async () => {
    const { POST } = await import("@/app/api/auth/login/route");
    const response = await POST(
      new Request("http://futurefund.test/api/auth/login", {
        body: JSON.stringify({ provider: "district-sso" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      })
    );
    const body = await response.json();
    const redirectUrl = new URL(body.redirectUrl);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ ok: true, provider: "district-sso" });
    expect(redirectUrl.origin).toBe("https://idp.example.edu");
    expect(redirectUrl.searchParams.get("client_id")).toBe("futurefund-client");
    expect(redirectUrl.searchParams.get("state")).toBeTruthy();
    expect(redirectUrl.searchParams.get("nonce")).toBeTruthy();
    expect(response.headers.get("set-cookie")).toContain("futurefund_sso_state");
  });
});
