import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  checkDemoChallenge,
  normalizeCityAnswer,
  resetDemoChallengeAttempts,
} from "@/lib/server/demo-challenge";

const demoEmail = "demo-user@demo.edu";

describe("demo login security question", () => {
  beforeEach(() => {
    resetDemoChallengeAttempts();
    vi.stubEnv("DEMO_SECURITY_ANSWER", "Concord");
    vi.stubEnv("NODE_ENV", "production");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not apply to real (non-demo) accounts", () => {
    expect(
      checkDemoChallenge({ email: "teacher@school.org", answer: undefined, clientKey: "k" })
    ).toEqual({ status: "not-required" });
  });

  it("asks the question when a demo account gives no answer", () => {
    expect(
      checkDemoChallenge({ email: demoEmail, answer: undefined, clientKey: demoEmail })
    ).toEqual({ status: "required" });
  });

  it("covers the other seeded demo accounts too", () => {
    expect(
      checkDemoChallenge({ email: "sam.gordon@example.edu", answer: "", clientKey: "sam" })
    ).toEqual({ status: "required" });
  });

  it("accepts the answer regardless of case, spacing, or a state suffix", () => {
    for (const answer of ["Concord", "  concord ", "CONCORD", "Concord, NH"]) {
      expect(
        checkDemoChallenge({ email: demoEmail, answer, clientKey: answer })
      ).toEqual({ status: "passed" });
    }
    expect(normalizeCityAnswer("Concord,  MA")).toBe("concord");
  });

  it("rejects wrong answers and locks out after five", () => {
    const now = 1_000_000;
    for (let i = 4; i >= 1; i -= 1) {
      expect(
        checkDemoChallenge({ email: demoEmail, answer: "Boston", clientKey: demoEmail, now })
      ).toEqual({ status: "wrong", remaining: i });
    }
    expect(
      checkDemoChallenge({ email: demoEmail, answer: "Boston", clientKey: demoEmail, now })
    ).toMatchObject({ status: "locked" });

    // Even the right answer is refused while locked.
    expect(
      checkDemoChallenge({ email: demoEmail, answer: "Concord", clientKey: demoEmail, now })
    ).toMatchObject({ status: "locked" });

    // After 15 minutes it works again.
    expect(
      checkDemoChallenge({
        email: demoEmail,
        answer: "Concord",
        clientKey: demoEmail,
        now: now + 15 * 60 * 1000 + 1,
      })
    ).toEqual({ status: "passed" });
  });

  it("refuses demo logins in production when no answer is configured", () => {
    vi.stubEnv("DEMO_SECURITY_ANSWER", "");
    expect(
      checkDemoChallenge({ email: demoEmail, answer: "Concord", clientKey: demoEmail })
    ).toEqual({ status: "unconfigured" });
  });

  it("skips the question in development when no answer is configured", () => {
    vi.stubEnv("DEMO_SECURITY_ANSWER", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(
      checkDemoChallenge({ email: demoEmail, answer: undefined, clientKey: demoEmail })
    ).toEqual({ status: "not-required" });
  });
});
