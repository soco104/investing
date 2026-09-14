import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import postgres from "postgres";

const localSecrets = new Map<string, string>();

type MarketTokenEnvelope = Record<string, string>;
type SecretBackend =
  | "digitalocean-env"
  | "google-secret-manager"
  | "local"
  | "postgres-encrypted";

export async function storeMarketIntegrationToken(
  integrationId: string,
  token: string
) {
  return storeCredentialSecret(`market-${integrationId}`, token);
}

export async function storeCredentialSecret(credentialId: string, token: string) {
  if (!token) {
    return null;
  }

  const backend = secretBackend();

  if (backend === "local") {
    const localRef = `local://futurefund-credential-vault#${credentialId}`;
    localSecrets.set(localRef, token);
    return localRef;
  }

  if (backend === "digitalocean-env") {
    const envName = digitalOceanTokenEnvName();
    const existingTokens = readDigitalOceanTokenEnvelope(envName);

    if (existingTokens[credentialId]) {
      return `do-env://${envName}#${credentialId}`;
    }

    throw new Error(
      `DigitalOcean App Platform encrypted environment variables are read-only at runtime. Add ${credentialId} to ${envName} or configure an external credential vault.`
    );
  }

  if (backend === "postgres-encrypted") {
    return storePostgresEncryptedCredential(credentialId, token);
  }

  const secretName = process.env.MARKET_PROVIDER_TOKENS_SECRET;

  if (!secretName) {
    throw new Error("MARKET_PROVIDER_TOKENS_SECRET is required for token storage.");
  }

  const existingTokens = await readMarketTokenEnvelope(secretName);
  const updatedTokens = {
    ...existingTokens,
    [credentialId]: token,
  };

  await addSecretVersion(secretName, JSON.stringify(updatedTokens));

  return `${secretName}#${credentialId}`;
}

export async function readSecretValue(secretRef: string | null | undefined) {
  if (!secretRef) {
    return "";
  }

  if (secretRef.startsWith("local://")) {
    return localSecrets.get(secretRef) ?? "";
  }

  if (secretRef.startsWith("do-env://")) {
    return readDigitalOceanSecretValue(secretRef);
  }

  if (secretRef.startsWith("pg-encrypted://")) {
    return readPostgresEncryptedCredential(secretRef);
  }

  const [secretName, integrationId] = secretRef.split("#");
  const secretValue = await accessSecretVersion(secretName);

  if (!integrationId) {
    return secretValue;
  }

  const parsed = parseMarketTokenEnvelope(secretValue);

  return parsed[integrationId] ?? "";
}

function secretBackend(): SecretBackend {
  const configured = process.env.MARKET_SECRET_BACKEND?.toLowerCase();

  if (configured === "digitalocean-env" || configured === "digitalocean") {
    return "digitalocean-env";
  }

  if (configured === "postgres-encrypted" || configured === "postgres") {
    return "postgres-encrypted";
  }

  if (configured === "google-secret-manager" || configured === "google") {
    return "google-secret-manager";
  }

  if (configured === "local") {
    return "local";
  }

  if (process.env.MARKET_PROVIDER_TOKENS_SECRET?.startsWith("do-env://")) {
    return "digitalocean-env";
  }

  if (process.env.MARKET_PROVIDER_TOKENS_SECRET?.startsWith("pg-encrypted://")) {
    return "postgres-encrypted";
  }

  if (process.env.GOOGLE_CLOUD_PROJECT) {
    return "google-secret-manager";
  }

  return "local";
}

function digitalOceanTokenEnvName() {
  const secretRef = process.env.MARKET_PROVIDER_TOKENS_SECRET;

  if (secretRef?.startsWith("do-env://")) {
    return secretRef.replace("do-env://", "").split("#")[0] || "MARKET_PROVIDER_TOKENS_JSON";
  }

  return process.env.MARKET_PROVIDER_TOKENS_ENV ?? "MARKET_PROVIDER_TOKENS_JSON";
}

function readDigitalOceanSecretValue(secretRef: string) {
  const [envName, credentialId] = secretRef.replace("do-env://", "").split("#");

  if (!credentialId) {
    return process.env[envName] ?? "";
  }

  return readDigitalOceanTokenEnvelope(envName)[credentialId] ?? "";
}

function readDigitalOceanTokenEnvelope(envName: string) {
  return parseMarketTokenEnvelope(process.env[envName] ?? "");
}

async function storePostgresEncryptedCredential(
  credentialId: string,
  token: string
) {
  const encrypted = encryptCredentialValue(credentialId, token);
  const sql = postgresDatabase();

  try {
    await ensureCredentialSecretTable(sql);
    await sql`
      insert into credential_secret_values (
        credential_id, ciphertext, iv, auth_tag, algorithm, key_version,
        created_at, updated_at
      )
      values (
        ${credentialId}, ${encrypted.ciphertext}, ${encrypted.iv},
        ${encrypted.authTag}, 'aes-256-gcm', ${encryptionKeyVersion()},
        now(), now()
      )
      on conflict (credential_id) do update set
        ciphertext = excluded.ciphertext,
        iv = excluded.iv,
        auth_tag = excluded.auth_tag,
        algorithm = excluded.algorithm,
        key_version = excluded.key_version,
        updated_at = excluded.updated_at
    `;
  } finally {
    await sql.end();
  }

  return `pg-encrypted://credential_secret_values#${credentialId}`;
}

async function readPostgresEncryptedCredential(secretRef: string) {
  const credentialId = secretRef.replace("pg-encrypted://credential_secret_values#", "");

  if (!credentialId || credentialId === secretRef) {
    return "";
  }

  const sql = postgresDatabase();

  try {
    await ensureCredentialSecretTable(sql);
    const rows = await sql<{
      auth_tag: string;
      ciphertext: string;
      iv: string;
      key_version: string;
    }[]>`
      select ciphertext, iv, auth_tag, key_version
      from credential_secret_values
      where credential_id = ${credentialId}
      limit 1
    `;

    if (!rows[0]) {
      return "";
    }

    return decryptCredentialValue(credentialId, rows[0]);
  } finally {
    await sql.end();
  }
}

function encryptCredentialValue(credentialId: string, value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", credentialEncryptionKey(), iv);
  cipher.setAAD(Buffer.from(credentialId, "utf8"));

  const ciphertext = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
  };
}

function decryptCredentialValue(
  credentialId: string,
  encrypted: { auth_tag: string; ciphertext: string; iv: string }
) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    credentialEncryptionKey(),
    Buffer.from(encrypted.iv, "base64")
  );
  decipher.setAAD(Buffer.from(credentialId, "utf8"));
  decipher.setAuthTag(Buffer.from(encrypted.auth_tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

function credentialEncryptionKey() {
  const configuredKey = process.env.CREDENTIAL_ENCRYPTION_KEY?.trim();

  if (!configuredKey) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY is required for encrypted credential storage.");
  }

  const hexKey = /^[a-f0-9]{64}$/i.test(configuredKey)
    ? Buffer.from(configuredKey, "hex")
    : null;
  const base64Key = hexKey ? null : Buffer.from(configuredKey, "base64");
  const key = hexKey ?? base64Key;

  if (key.length !== 32) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY must decode to 32 bytes.");
  }

  return key;
}

function encryptionKeyVersion() {
  return process.env.CREDENTIAL_ENCRYPTION_KEY_VERSION ?? "v1";
}

function postgresDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for encrypted credential storage.");
  }

  return postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
}

async function ensureCredentialSecretTable(sql: ReturnType<typeof postgres>) {
  await sql`
    create table if not exists credential_secret_values (
      credential_id text primary key,
      ciphertext text not null,
      iv text not null,
      auth_tag text not null,
      algorithm text not null default 'aes-256-gcm',
      key_version text not null default 'v1',
      created_at timestamp not null,
      updated_at timestamp not null
    )
  `;
}

async function readMarketTokenEnvelope(secretName: string) {
  try {
    return parseMarketTokenEnvelope(await accessSecretVersion(secretName));
  } catch {
    return {};
  }
}

function parseMarketTokenEnvelope(value: string): MarketTokenEnvelope {
  if (!value) {
    return {};
  }

  const parsed = JSON.parse(value) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(parsed).filter((entry): entry is [string, string] => {
      return typeof entry[0] === "string" && typeof entry[1] === "string";
    })
  );
}

async function accessSecretVersion(secretName: string) {
  const accessToken = await googleMetadataAccessToken();
  const response = await fetch(
    `https://secretmanager.googleapis.com/v1/${secretName}/versions/latest:access`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (response.status === 404) {
    return "";
  }

  if (!response.ok) {
    throw new Error("Secret Manager value could not be read.");
  }

  const body = (await response.json()) as { payload?: { data?: string } };

  return body.payload?.data ? atob(body.payload.data) : "";
}

async function addSecretVersion(secretName: string, value: string) {
  const accessToken = await googleMetadataAccessToken();
  const response = await fetch(
    `https://secretmanager.googleapis.com/v1/${secretName}:addVersion`,
    {
      body: JSON.stringify({
        payload: { data: btoa(value) },
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Market API token could not be stored.");
  }
}

async function googleMetadataAccessToken() {
  const response = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    {
      headers: { "Metadata-Flavor": "Google" },
    }
  );

  if (!response.ok) {
    throw new Error("Google metadata access token is unavailable.");
  }

  const body = (await response.json()) as { access_token?: string };

  if (!body.access_token) {
    throw new Error("Google metadata access token response was empty.");
  }

  return body.access_token;
}
