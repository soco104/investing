const localSecrets = new Map<string, string>();

type MarketTokenEnvelope = Record<string, string>;
type SecretBackend = "digitalocean-env" | "google-secret-manager" | "local";

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

  if (configured === "google-secret-manager" || configured === "google") {
    return "google-secret-manager";
  }

  if (configured === "local") {
    return "local";
  }

  if (process.env.MARKET_PROVIDER_TOKENS_SECRET?.startsWith("do-env://")) {
    return "digitalocean-env";
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
