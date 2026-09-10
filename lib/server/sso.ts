export function buildDistrictSsoStartUrl() {
  const authorizationUrl = process.env.SSO_AUTHORIZATION_URL;
  const clientId = process.env.SSO_CLIENT_ID;
  const redirectUri = process.env.SSO_REDIRECT_URI;

  if (!authorizationUrl || !clientId || !redirectUri) {
    return null;
  }

  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  const url = new URL(authorizationUrl);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", process.env.SSO_SCOPE ?? "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);

  return {
    nonce,
    redirectUrl: url.toString(),
    state,
  };
}
