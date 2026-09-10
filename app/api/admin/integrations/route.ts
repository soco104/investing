import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { testMarketProvider } from "@/lib/server/market-providers";
import {
  deleteIntegration,
  upsertIntegration,
} from "@/lib/server/repository";
import { storeMarketIntegrationToken } from "@/lib/server/secrets";

type IntegrationMutationRequest = {
  action: "create" | "update" | "delete" | "test";
  allowedSymbols?: string;
  endpoint: string;
  integrationId?: string;
  maxSymbols?: number;
  provider: string;
  reason?: string;
  targetClass?: string;
  token?: string;
  tokenPlacement?: "bearer" | "query" | "x-api-key";
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as IntegrationMutationRequest;

  if (!body.provider || !body.endpoint) {
    return Response.json(
      { message: "provider and endpoint are required.", ok: false },
      { status: 400 }
    );
  }

  const integrationId = body.integrationId ?? `integration-${Date.now()}`;
  const tokenSecretRef =
    body.token && body.action !== "delete"
      ? await storeMarketIntegrationToken(integrationId, body.token)
      : null;
  const health =
    body.action === "test"
      ? await testMarketProvider({
          allowedSymbols: body.allowedSymbols,
          endpoint: body.endpoint,
          maxSymbols: body.maxSymbols,
          provider: body.provider,
          token: body.token,
          tokenPlacement: body.tokenPlacement,
        })
      : null;
  if (body.action === "delete") {
    await deleteIntegration(integrationId);
  } else {
    await upsertIntegration({
      actor: user,
      allowedSymbols: body.allowedSymbols,
      endpoint: body.endpoint,
      integrationId,
      maxSymbols: body.maxSymbols ?? 200,
      provider: body.provider,
      status: health?.ok === false ? "Needs key" : "Connected",
      tokenRequired: Boolean(body.token),
      tokenSecretRef,
    });
  }
  const audit = await recordAuditEvent({
    action:
      body.action === "delete"
        ? "integration.deleted"
        : body.action === "create"
          ? "integration.created"
          : "integration.updated",
    actor: user,
    context: {
      allowedSymbols: body.allowedSymbols ? "explicit" : "default_200_max",
      endpoint: body.endpoint,
      health,
      provider: body.provider,
      targetClass: body.targetClass,
      tokenSecretRef,
    },
    reason: body.reason,
    targetId: integrationId,
    targetType: "market_integration",
  });

  return Response.json({ audit, health, ok: true, persisted: true }, { status: 201 });
}
