import bcrypt from "bcryptjs";

const bcryptRounds = Number(process.env.PASSWORD_BCRYPT_ROUNDS ?? 12);
const sha256HexPattern = /^[a-f0-9]{64}$/i;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, bcryptRounds);
}

export async function verifyPassword(password: string, passwordHash: string) {
  if (sha256HexPattern.test(passwordHash)) {
    return (await sha256Hex(password)) === passwordHash.toLowerCase();
  }

  return bcrypt.compare(password, passwordHash);
}

export async function hashToken(token: string) {
  return sha256Hex(token);
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
