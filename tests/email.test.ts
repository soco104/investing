import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const repo = vi.hoisted(() => ({
  recordEmailDelivery: vi.fn(),
}));

vi.mock("@/lib/server/repository", () => repo);

import {
  appBaseUrl,
  getEmailStatus,
  passwordResetEmail,
  sendEmail,
} from "@/lib/server/email";

const message = {
  kind: "test" as const,
  subject: "Hello",
  text: "Body with a secret link",
  to: "Teacher@School.org",
};

describe("email sending", () => {
  beforeEach(() => {
    repo.recordEmailDelivery.mockReset();
    vi.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reports which settings are missing", () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("EMAIL_FROM", "");
    expect(getEmailStatus()).toMatchObject({
      configured: false,
      missing: ["RESEND_API_KEY", "EMAIL_FROM"],
      provider: "log",
    });
  });

  it("writes the email to the log in development when not set up", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "development");

    const result = await sendEmail(message);

    expect(result).toEqual({ ok: true, status: "logged" });
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining("Body with a secret link")
    );
    expect(repo.recordEmailDelivery).toHaveBeenCalledWith(
      expect.objectContaining({ recipient: "teacher@school.org", status: "logged" })
    );
  });

  it("never logs the body in production when not set up", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");

    const result = await sendEmail(message);

    expect(result).toMatchObject({ ok: false, status: "not_configured" });
    expect(console.log).not.toHaveBeenCalled();
  });

  it("sends through Resend and records the message id, without the body", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "FutureFund <no-reply@futurefund.test>");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "msg_123" }), { status: 200 })
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendEmail(message);

    expect(result).toEqual({ ok: true, status: "sent" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test_key");
    expect(JSON.parse(init.body)).toMatchObject({
      from: "FutureFund <no-reply@futurefund.test>",
      to: ["teacher@school.org"],
    });
    const recorded = repo.recordEmailDelivery.mock.calls[0][0];
    expect(recorded).toMatchObject({
      provider: "resend",
      providerMessageId: "msg_123",
      status: "sent",
    });
    expect(JSON.stringify(recorded)).not.toContain("secret link");
  });

  it("reports the provider's error when Resend rejects the email", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "FutureFund <no-reply@unverified.test>");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Domain is not verified." }), {
          status: 403,
        })
      )
    );

    expect(await sendEmail(message)).toEqual({
      error: "Domain is not verified.",
      ok: false,
      status: "failed",
    });
  });

  it("handles the email service being unreachable", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "no-reply@futurefund.test");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("network")));

    expect(await sendEmail(message)).toMatchObject({
      error: "Email service could not be reached.",
      status: "failed",
    });
  });

  it("rejects an invalid recipient without calling the service", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("EMAIL_FROM", "no-reply@futurefund.test");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(await sendEmail({ ...message, to: "not-an-email" })).toMatchObject({
      status: "failed",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("still returns the result if recording the delivery fails", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    repo.recordEmailDelivery.mockRejectedValue(new Error("db down"));

    expect(await sendEmail(message)).toEqual({ ok: true, status: "logged" });
  });
});

describe("email content and links", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("escapes the reset link in the HTML version", () => {
    const email = passwordResetEmail('https://x.test/reset?token=a"<b>', 30);
    expect(email.html).not.toContain('"<b>');
    expect(email.html).toContain("&quot;&lt;b&gt;");
    expect(email.text).toContain("30 minutes");
  });

  it("uses APP_BASE_URL when set, else the forwarded host", () => {
    vi.stubEnv("APP_BASE_URL", "https://classroom.example.org/");
    expect(appBaseUrl(new Request("http://internal:8080/api"))).toBe(
      "https://classroom.example.org"
    );

    vi.stubEnv("APP_BASE_URL", "");
    expect(
      appBaseUrl(
        new Request("http://internal:8080/api", {
          headers: {
            "x-forwarded-host": "futurefund.ondigitalocean.app",
            "x-forwarded-proto": "https",
          },
        })
      )
    ).toBe("https://futurefund.ondigitalocean.app");
  });
});
