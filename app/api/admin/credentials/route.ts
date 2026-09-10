import { recordAuditEvent } from "@/lib/server/audit";
import { requirePermission } from "@/lib/server/auth";
import {
  deleteCredentialMetadata,
  listCredentialMetadata,
  upsertCredentialMetadata,
} from "@/lib/server/repository";
import { storeCredentialSecret } from "@/lib/server/secrets";

type CredentialMutationRequest = {
  action: "create" | "update" | "rotate" | "delete";
  credentialId?: string;
  credentialType?: "api_token" | "username_password" | "oauth_client_secret";
  label?: string;
  providerName?: string;
  reason?: string;
  scopeId?: string;
  scopeType?: "district" | "school" | "class";
  secretValue?: string;
  status?: "active" | "disabled";
  tokenPlacement?: "bearer" | "query" | "x-api-key" | "basic" | "client-secret";
  username?: string;
};

export async function GET(request: Request) {
  const { response } = await requirePermission(request, "adminPortal");

  if (response) {
    return response;
  }

  return Response.json({
    credentials: await listCredentialMetadata(),
    ok: true,
  });
}

export async function POST(request: Request) {
  const { response, user } = await requirePermission(request, "adminPortal");

  if (response || !user) {
    return response;
  }

  const body = (await request.json()) as CredentialMutationRequest;
  const credentialId = body.credentialId ?? `credential-${Date.now()}`;

  if (body.action === "delete") {
    const audit = await recordAuditEvent({
      action: "credential.deleted",
      actor: user,
      context: { credentialId },
      reason: body.reason,
      targetId: credentialId,
      targetType: "integration_credential",
    });

    await deleteCredentialMetadata(credentialId);

    return Response.json({ audit, credentialId, ok: true, persisted: true });
  }

  if (!body.label || !body.providerName || !body.credentialType) {
    return Response.json(
      {
        message: "label, providerName, and credentialType are required.",
        ok: false,
      },
      { status: 400 }
    );
  }

  const audit = await recordAuditEvent({
    action:
      body.action === "rotate"
        ? "credential.rotated"
        : body.action === "create"
          ? "credential.created"
          : "credential.updated",
    actor: user,
    context: {
      credentialType: body.credentialType,
      hasSecretValue: Boolean(body.secretValue),
      providerName: body.providerName,
      scopeId: body.scopeId,
      scopeType: body.scopeType,
      tokenPlacement: body.tokenPlacement,
      usernameHint: maskUsername(body.username),
    },
    reason: body.reason,
    targetId: credentialId,
    targetType: "integration_credential",
  });
  const secretRef = body.secretValue
    ? await storeCredentialSecret(credentialId, body.secretValue)
    : null;

  await upsertCredentialMetadata({
    actor: user,
    credentialId,
    credentialType: body.credentialType,
    label: body.label,
    providerName: body.providerName,
    scopeId: body.scopeId,
    scopeType: body.scopeType,
    secretRef,
    status: body.status ?? "active",
    tokenPlacement: body.tokenPlacement,
    usernameHint: maskUsername(body.username),
  });

  return Response.json({ audit, credentialId, ok: true, persisted: true });
}

function maskUsername(username: string | undefined) {
  if (!username) {
    return undefined;
  }

  const trimmed = username.trim();

  if (trimmed.length <= 3) {
    return "***";
  }

  return `${trimmed.slice(0, 2)}***${trimmed.slice(-1)}`;
}
