export async function storeMarketIntegrationToken(
  integrationId: string,
  token: string
) {
  if (!token) {
    return null;
  }

  const secretId = `${process.env.MARKET_TOKEN_SECRET_PREFIX ?? "futurefund-market-token"}-${integrationId}`;

  if (!process.env.GOOGLE_CLOUD_PROJECT) {
    return `local://${secretId}`;
  }

  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const accessToken = await googleMetadataAccessToken();
  const secretName = `projects/${projectId}/secrets/${secretId}`;

  await fetch(`https://secretmanager.googleapis.com/v1/${secretName}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    method: "GET",
  }).then(async (response) => {
    if (response.status !== 404) {
      return;
    }

    const createResponse = await fetch(
      `https://secretmanager.googleapis.com/v1/projects/${projectId}/secrets?secretId=${encodeURIComponent(secretId)}`,
      {
        body: JSON.stringify({ replication: { automatic: {} } }),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    );

    if (!createResponse.ok) {
      throw new Error("Market API token secret could not be created.");
    }
  });

  const versionResponse = await fetch(
    `https://secretmanager.googleapis.com/v1/${secretName}:addVersion`,
    {
      body: JSON.stringify({
        payload: { data: btoa(token) },
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    }
  );

  if (!versionResponse.ok) {
    throw new Error("Market API token could not be stored.");
  }

  return secretName;
}

export async function readSecretValue(secretRef: string | null | undefined) {
  if (!secretRef || secretRef.startsWith("local://")) {
    return "";
  }

  const accessToken = await googleMetadataAccessToken();
  const response = await fetch(
    `https://secretmanager.googleapis.com/v1/${secretRef}/versions/latest:access`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error("Secret Manager value could not be read.");
  }

  const body = (await response.json()) as { payload?: { data?: string } };

  return body.payload?.data ? atob(body.payload.data) : "";
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
