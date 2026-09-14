import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

import postgres from "postgres";

const localSecrets = new Map<string, string>();

type MarketTokenEnvelope = Record<string, string>;
type SecretSqlClient = ReturnType<typeof postgres>;

const databaseSecretPrefix = "pg-encrypted://credential_secret_values#";
let secretSqlClient: SecretSqlClient | null = null;

/**
 * Store a market integration token using the configured production vault.
 *
 * Supported backends:
 *   - Google Secret Manager when GOOGLE_CLOUD_PROJECT is configured.
 *   - Encrypted PostgreSQL when DATABASE_URL is configured (DigitalOcean path).
 *   - An in-memory Map for local development only.
 *
 * The database backend encrypts values with AES-256-GCM before persistence.
 */
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

  // Preserve the existing Google Cloud production behavior for Cloud Run.
  if (process.env.GOOGLE_CLOUD_PROJECT) {
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

  // DigitalOcean (and any other ordinary Node/PostgreSQL production host)
  // stores encrypted payloads in the production database.
  if (process.env.DATABASE_URL) {
    return storeDatabaseSecret(credentialId, token);
  }

  // Local-only fallback. This intentionally remains non-persistent so local
  // development does not require production infrastructure.
  const localRef = `local://futurefund-credential-vault#${credentialId}`;
  localSecrets.set(localRef, token);
  return localRef;
}

export async function readSecretValue(secretRef: string | null | undefined) {
  if (!secretRef) {
    return "";
  }

  if (secretRef.startsWith("local://")) {
    return localSecrets.get(secretRef) ?? "";
  }

  if (secretRef.startsWith(databaseSecretPrefix)) {
    return readDatabaseSecret(secretRef);
  }

  // Any other reference is treated as the existing Google Secret Manager
  // resource format: projects/.../secrets/...#credential-id.
  const [secretName, integrationId] = secretRef.split("#");
  const secretValue = await accessSecretVersion(secretName);

  if (!integrationId) {
    return secretValue;
  }

  const parsed = parseMarketTokenEnvelope(secretValue);
  return parsed[integrationId] ?? "";
}

// ---------------------------------------------------------------------------
// PostgreSQL encrypted credential vault (DigitalOcean production path)
// ---------------------------------------------------------------------------

function getSecretSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for database credential storage.");
  }

  secretSqlClient ??= postgres(process.env.DATABASE_URL, {
    // Keep this tiny because the main application repository already owns its
    // own connection pool. Credential reads/writes are low-frequency.
    max: 2,
    prepare: false,
  });

  return secretSqlClient;
}

function getCredentialEncryptionKey() {
  const encoded = process.env.CREDENTIAL_ENCRYPTION_KEY;

  if (!encoded) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY is required for production credential storage."
    );
  }

  const key = Buffer.from(encoded, "base64");

  if (key.length !== 32) {
    throw new Error(
      "CREDENTIAL_ENCRYPTION_KEY must be a base64-encoded 32-byte key."
    );
  }

  return key;
}

function encryptCredentialValue(credentialId: string, value: string) {
  const key = getCredentialEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(credentialId, "utf8"));

  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return {
    authTag: authTag.toString("base64"),
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
  };
}

function decryptCredentialValue(
  credentialId: string,
  encrypted: { auth_tag: string; ciphertext: string; iv: string }
) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    getCredentialEncryptionKey(),
    Buffer.from(encrypted.iv, "base64")
  );

  decipher.setAAD(Buffer.from(credentialId, "utf8"));
  decipher.setAuthTag(Buffer.from(encrypted.auth_tag, "base64"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

async function storeDatabaseSecret(credentialId: string, value: string) {
  const encrypted = encryptCredentialValue(credentialId, value);
  const sql = getSecretSql();

  await sql`
    insert into credential_secret_values (
      credential_id,
      ciphertext,
      iv,
      auth_tag,
      algorithm,
      key_version,
      created_at,
      updated_at
    )
    values (
      ${credentialId},
      ${encrypted.ciphertext},
      ${encrypted.iv},
      ${encrypted.authTag},
      'aes-256-gcm',
      ${process.env.CREDENTIAL_ENCRYPTION_KEY_VERSION ?? "v1"},
      now(),
      now()
    )
    on conflict (credential_id)
    do update set
      ciphertext = excluded.ciphertext,
      iv = excluded.iv,
      auth_tag = excluded.auth_tag,
      algorithm = excluded.algorithm,
      key_version = excluded.key_version,
      updated_at = now()
  `;

  return `${databaseSecretPrefix}${credentialId}`;
}

async function readDatabaseSecret(secretRef: string) {
  const credentialId = secretRef.slice(databaseSecretPrefix.length);

  if (!credentialId) {
    return "";
  }

  const [row] = await getSecretSql()<
    Array<{ auth_tag: string; ciphertext: string; iv: string }>
  >`
    select ciphertext, iv, auth_tag
    from credential_secret_values
    where credential_id = ${credentialId}
    limit 1
  `;

  return row ? decryptCredentialValue(credentialId, row) : "";
}

// ---------------------------------------------------------------------------
// Existing Google Secret Manager implementation
// ---------------------------------------------------------------------------

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
