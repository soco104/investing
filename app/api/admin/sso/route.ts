import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import { createSsoProvider } from "@/lib/server/repository";

type SsoProviderRequest = {
  clientId?: string;
  issuerUrl?: string;
  metadataUrl?: string;
  providerName: string;
  providerType: "saml" | "oidc";
  reason: string;
};

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as SsoProviderRequest;

  if (!body.providerName || !body.providerType || !body.reason) {
    return Response.json(
      { message: "providerName, providerType, and reason are required.", ok: false },
      { status: 400 }
    );
  }

  const providerId = `sso-${Date.now()}`;
  await createSsoProvider({
    actor: user,
    clientId: body.clientId,
    issuerUrl: body.issuerUrl,
    metadataUrl: body.metadataUrl,
    providerId,
    providerName: body.providerName,
    providerType: body.providerType,
  });
  const audit = await recordAuditEvent({
    action: "sso.updated",
    actor: user,
    context: {
      clientId: body.clientId ? "configured" : null,
      issuerUrl: body.issuerUrl,
      metadataUrl: body.metadataUrl,
      providerName: body.providerName,
      providerType: body.providerType,
      status: "draft",
    },
    reason: body.reason,
    targetId: providerId,
    targetType: "sso_identity_provider",
  });

  return Response.json(
    {
      audit,
      ok: true,
      provider: {
        id: providerId,
        providerName: body.providerName,
        providerType: body.providerType,
        status: "draft",
      },
    },
    { status: 201 }
  );
}
