const localSecrets = new Map<string, string>();

type MarketTokenEnvelope = Record<string, string>;

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

  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    const localRef = `local://futurefund-credential-vault#${credentialId}`;
    localSecrets.set(localRef, token);
    return localRef;
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

  const [secretName, integrationId] = secretRef.split("#");
  const secretValue = await accessSecretVersion(secretName);

  if (!integrationId) {
    return secretValue;
  }

  const parsed = parseMarketTokenEnvelope(secretValue);

  return parsed[integrationId] ?? "";
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
