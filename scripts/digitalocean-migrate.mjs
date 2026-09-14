/**
 * FutureFund Classroom - DigitalOcean production migration wrapper
 *
 * The application already has scripts/cloudrun-migrate.mjs, and most of that
 * PostgreSQL schema is cloud-provider-neutral despite its historical filename.
 *
 * This wrapper intentionally reuses that migration first, then adds the one
 * table needed by the DigitalOcean credential vault. Keeping the wrapper small
 * avoids forking the existing production schema into two independent copies.
 */

import postgres from "postgres";

// Reuse the existing production PostgreSQL bootstrap/migrations.
await import("./cloudrun-migrate.mjs");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for DigitalOcean production startup.");
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false,
});

try {
  /**
   * Stores only encrypted credential payloads.
   *
   * Encryption/decryption happens in lib/server/secrets.ts using AES-256-GCM
   * and CREDENTIAL_ENCRYPTION_KEY. The database never stores the plaintext API
   * token/credential.
   */
  await sql`
    create table if not exists credential_secrets (
      credential_id text primary key,
      encrypted_value text not null,
      created_at timestamp not null,
      updated_at timestamp not null
    )
  `;

  console.log("DigitalOcean credential-vault migration complete.");
} finally {
  await sql.end();
}
