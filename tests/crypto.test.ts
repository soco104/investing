import { describe, expect, it } from "vitest";

import { hashPassword, hashToken, verifyPassword } from "@/lib/server/crypto";

describe("credential hashing", () => {
  it("uses bcrypt for new password hashes", async () => {
    const hash = await hashPassword("ClassroomPassword123!");

    expect(hash).toMatch(/^\$2[aby]\$/);
    await expect(verifyPassword("ClassroomPassword123!", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-password", hash)).resolves.toBe(false);
  });

  it("continues to verify legacy SHA-256 hashes without using them for new passwords", async () => {
    const legacyStudentDemoHash =
      "d5f83a521580eb51068dd4238cb9abd7c571e1f5f026a6859af398dce85c7c98";

    await expect(verifyPassword("student-demo", legacyStudentDemoHash)).resolves.toBe(
      true
    );
  });

  it("keeps session and reset token hashes deterministic", async () => {
    const first = await hashToken("session-token");
    const second = await hashToken("session-token");

    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });
});
