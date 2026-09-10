import { hashToken } from "./crypto";

export async function isAuthorizedServiceIngest(request: Request) {
  const configuredSecret = process.env.OBSERVABILITY_INGEST_SECRET;

  if (!configuredSecret) {
    return process.env.NODE_ENV !== "production";
  }

  const suppliedSecret = request.headers.get("x-futurefund-ingest");

  if (!suppliedSecret) {
    return false;
  }

  return (await hashToken(suppliedSecret)) === (await hashToken(configuredSecret));
}

export function unauthorizedIngestResponse() {
  return Response.json(
    { message: "Observability ingest is not authorized.", ok: false },
    { status: 401 }
  );
}
