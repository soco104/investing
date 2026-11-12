import { recordEmailDelivery } from "@/lib/server/repository";

/**
 * Sends email through Resend's HTTPS API. (DigitalOcean blocks outbound SMTP,
 * so the app sends over HTTPS instead.)
 *
 * Settings (DigitalOcean → App → Settings → web → Environment Variables):
 * - RESEND_API_KEY: the Resend API key (set as encrypted).
 * - EMAIL_FROM: the sender, e.g. "FutureFund Classroom <no-reply@school.org>".
 *   Its domain must be verified in Resend.
 *
 * Without RESEND_API_KEY the app does not send:
 * - in development, the email (including links) is printed to the server log
 *   so it can be tested locally;
 * - in production, nothing is printed (emails can contain reset links and
 *   student information) and the send is logged as "not_configured".
 *
 * Every attempt is recorded in the email delivery log (recipient, kind,
 * subject, status). Message bodies are never stored.
 */

export type EmailKind =
  | "password_reset"
  | "test"
  | "flagged_message_forward"
  | "portfolio_reset_decision";

export type SendEmailInput = {
  html?: string;
  kind: EmailKind;
  requestedByUserId?: string | null;
  subject: string;
  text: string;
  to: string;
};

export type SendEmailResult = {
  error?: string;
  ok: boolean;
  status: "sent" | "failed" | "logged" | "not_configured";
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const SEND_TIMEOUT_MS = 10_000;

export function getEmailSettings() {
  const apiKey = process.env.RESEND_API_KEY?.trim() || null;
  const from = process.env.EMAIL_FROM?.trim() || null;

  return {
    apiKey,
    configured: Boolean(apiKey && from),
    from,
    provider: apiKey ? ("resend" as const) : ("log" as const),
  };
}

/** Safe-to-show status for the Admin portal (never includes the key). */
export function getEmailStatus() {
  const settings = getEmailSettings();
  const missing: string[] = [];

  if (!settings.apiKey) missing.push("RESEND_API_KEY");
  if (!settings.from) missing.push("EMAIL_FROM");

  return {
    configured: settings.configured,
    from: settings.from,
    missing,
    provider: settings.provider,
  };
}

export function isValidEmailAddress(value: string) {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value.trim());
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const settings = getEmailSettings();
  const to = input.to.trim().toLowerCase();
  let result: SendEmailResult;
  let providerMessageId: string | null = null;

  if (!isValidEmailAddress(to)) {
    result = { error: "Invalid recipient address.", ok: false, status: "failed" };
  } else if (!settings.configured) {
    if (process.env.NODE_ENV !== "production") {
      console.log(
        [
          "--- Email (not sent: RESEND_API_KEY / EMAIL_FROM not set) ---",
          `To: ${to}`,
          `Subject: ${input.subject}`,
          "",
          input.text,
          "--- End email ---",
        ].join("\n")
      );
      result = { ok: true, status: "logged" };
    } else {
      result = {
        error: "Email is not set up (RESEND_API_KEY and EMAIL_FROM are required).",
        ok: false,
        status: "not_configured",
      };
    }
  } else {
    try {
      const response = await fetch(RESEND_ENDPOINT, {
        body: JSON.stringify({
          from: settings.from,
          html: input.html,
          subject: input.subject,
          text: input.text,
          to: [to],
        }),
        headers: {
          Authorization: `Bearer ${settings.apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      });
      const body = (await response.json().catch(() => ({}))) as {
        id?: string;
        message?: string;
      };

      if (response.ok) {
        providerMessageId = body.id ?? null;
        result = { ok: true, status: "sent" };
      } else {
        result = {
          error: body.message ?? `Email service returned ${response.status}.`,
          ok: false,
          status: "failed",
        };
      }
    } catch (error) {
      result = {
        error:
          error instanceof Error && error.name === "TimeoutError"
            ? "Email service did not respond in time."
            : "Email service could not be reached.",
        ok: false,
        status: "failed",
      };
    }
  }

  try {
    await recordEmailDelivery({
      error: result.error ?? null,
      kind: input.kind,
      provider: settings.provider,
      providerMessageId,
      recipient: to,
      requestedByUserId: input.requestedByUserId ?? null,
      status: result.status,
      subject: input.subject,
    });
  } catch (error) {
    // Logging must never stop the email result from reaching the caller.
    console.error("Could not record email delivery.", error);
  }

  return result;
}

/** Base URL for links in emails: APP_BASE_URL if set, else the request's. */
export function appBaseUrl(request: Request) {
  const configured = process.env.APP_BASE_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  return `${forwardedProto ?? url.protocol.replace(":", "")}://${
    forwardedHost ?? url.host
  }`;
}

export function passwordResetEmail(resetUrl: string, minutesValid: number) {
  const subject = "Reset your FutureFund Classroom password";
  const text = [
    "Hello,",
    "",
    "An administrator started a password reset for your FutureFund Classroom account.",
    "",
    `Set a new password here (this link works for ${minutesValid} minutes):`,
    resetUrl,
    "",
    "If you weren't expecting this, you can ignore this email; your password won't change.",
  ].join("\n");
  const html = `<p>Hello,</p>
<p>An administrator started a password reset for your FutureFund Classroom account.</p>
<p><a href="${escapeHtml(resetUrl)}">Set a new password</a> (this link works for ${minutesValid} minutes).</p>
<p>If the button doesn't work, copy this address into your browser:<br>${escapeHtml(resetUrl)}</p>
<p>If you weren't expecting this, you can ignore this email; your password won't change.</p>`;

  return { html, subject, text };
}

export function testEmail(sentBy: string) {
  const subject = "FutureFund Classroom test email";
  const text = [
    "This is a test email from FutureFund Classroom.",
    "",
    `Sent by ${sentBy} from the Admin portal. If you received it, email is working.`,
  ].join("\n");

  return {
    html: `<p>This is a test email from FutureFund Classroom.</p><p>Sent by ${escapeHtml(
      sentBy
    )} from the Admin portal. If you received it, email is working.</p>`,
    subject,
    text,
  };
}
