import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Security question for demo logins.
 *
 * The demo accounts have published passwords, so after the password checks
 * out we also ask a question only the app owner should know. The answer is
 * read from the DEMO_SECURITY_ANSWER env var (never stored in the code).
 *
 * - Production: if DEMO_SECURITY_ANSWER is not set, demo logins are refused.
 * - Development: if it is not set, the question is skipped.
 */

export const DEMO_SECURITY_QUESTION = "What city was Sean born in?";

// Every account created by scripts/seed-demo-data.mjs, plus the local
// development copies. All of them get the question, so the published
// passwords alone are never enough. tests/demo-challenge.test.ts checks this
// list against the seed script so they can't drift apart.
const DEMO_ACCOUNT_EMAILS = new Set([
  "demo-user@demo.edu",
  "avery.johnson@example.edu",
  "maya.patel@example.edu",
  "jordan.lee@example.edu",
  "elena.rivera@example.edu",
  "sam.gordon@example.edu",
]);

const MAX_WRONG_ANSWERS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

type AttemptRecord = { wrong: number; lockedUntil: number };

// Keyed by account email (not IP, which a client can spoof via headers).
// In-memory, per server instance. Good enough to stop casual guessing.
const attempts = new Map<string, AttemptRecord>();

export type DemoChallengeResult =
  | { status: "not-required" }
  | { status: "passed" }
  | { status: "required" }
  | { status: "wrong"; remaining: number }
  | { status: "locked"; retryAfterSeconds: number }
  | { status: "unconfigured" };

export function isDemoAccountEmail(email: string) {
  return DEMO_ACCOUNT_EMAILS.has(email.trim().toLowerCase());
}

/** "Concord", " concord ", "Concord, NH" all normalize to "concord". */
export function normalizeCityAnswer(answer: string) {
  return answer.split(",")[0].trim().replace(/\s+/g, " ").toLowerCase();
}

function digest(value: string) {
  return createHash("sha256").update(value).digest();
}

export function checkDemoChallenge({
  email,
  answer,
  clientKey,
  now = Date.now(),
}: {
  email: string;
  answer: string | undefined;
  clientKey: string;
  now?: number;
}): DemoChallengeResult {
  if (!isDemoAccountEmail(email)) {
    return { status: "not-required" };
  }

  const configured = process.env.DEMO_SECURITY_ANSWER?.trim();

  if (!configured) {
    return process.env.NODE_ENV === "production"
      ? { status: "unconfigured" }
      : { status: "not-required" };
  }

  const record = attempts.get(clientKey);

  if (record && record.lockedUntil > now) {
    return {
      status: "locked",
      retryAfterSeconds: Math.ceil((record.lockedUntil - now) / 1000),
    };
  }

  if (!answer?.trim()) {
    return { status: "required" };
  }

  const matches = timingSafeEqual(
    digest(normalizeCityAnswer(answer)),
    digest(normalizeCityAnswer(configured))
  );

  if (matches) {
    attempts.delete(clientKey);
    return { status: "passed" };
  }

  const wrong = (record?.wrong ?? 0) + 1;

  if (wrong >= MAX_WRONG_ANSWERS) {
    attempts.set(clientKey, { wrong: 0, lockedUntil: now + LOCKOUT_MS });
    return { status: "locked", retryAfterSeconds: LOCKOUT_MS / 1000 };
  }

  attempts.set(clientKey, { wrong, lockedUntil: 0 });
  return { status: "wrong", remaining: MAX_WRONG_ANSWERS - wrong };
}

/** Test helper. */
export function resetDemoChallengeAttempts() {
  attempts.clear();
}
