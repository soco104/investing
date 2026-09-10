import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { testMarketProvider } from "@/lib/server/market-providers";

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
      tokenSecretRef: body.token ? "secret-manager-pending" : null,
    },
    reason: body.reason,
    targetId: body.integrationId ?? `integration-${Date.now()}`,
    targetType: "market_integration",
  });

  return Response.json({ audit, health, ok: true, persisted: true }, { status: 201 });
}
