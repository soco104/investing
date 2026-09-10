const blockedHostnames = new Set([
  "localhost",
  "metadata.google.internal",
]);

export function isSafeIntegrationEndpoint(endpoint: string) {
  try {
    if (endpoint.startsWith("/api/market")) {
      return true;
    }

    const url = new URL(endpoint);

    if (url.protocol !== "https:") {
      return false;
    }

    if (blockedHostnames.has(url.hostname.toLowerCase())) {
      return false;
    }

    if (isPrivateHostname(url.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0" ||
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized) ||
    normalized === "::1"
  );
}
