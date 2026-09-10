import { createTraceId, nowIso } from "@/lib/observability";
import type { AuthenticatedUser } from "@/lib/server/auth";

export type AuditAction =
  | "role.changed"
  | "users.imported"
  | "user.created"
  | "user.updated"
  | "permission.changed"
  | "portfolio.corrected"
  | "integration.created"
  | "integration.updated"
  | "integration.deleted"
  | "privacy.updated"
  | "password_reset.requested"
  | "retention.export_requested"
  | "retention.delete_requested"
  | "moderation.reviewed"
  | "backup.requested"
  | "incident.opened"
  | "sso.updated";

export type AuditEvent = {
  id: string;
  districtId: string;
  actorUserId: string;
  actorEmail: string;
  action: AuditAction;
  targetType: string;
  targetId: string;
  reason?: string;
  context: Record<string, unknown>;
  createdAt: string;
  traceId: string;
};

const fallbackAuditEvents: AuditEvent[] = [];

export async function recordAuditEvent(input: {
  action: AuditAction;
  actor: AuthenticatedUser;
  context?: Record<string, unknown>;
  districtId?: string;
  reason?: string;
  targetId: string;
  targetType: string;
}) {
  const event: AuditEvent = {
    action: input.action,
    actorEmail: input.actor.email,
    actorUserId: input.actor.id,
    context: input.context ?? {},
    createdAt: nowIso(),
    districtId: input.districtId ?? "district-lincoln-usd",
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    reason: input.reason,
    targetId: input.targetId,
    targetType: input.targetType,
    traceId: createTraceId(),
  };

  fallbackAuditEvents.unshift(event);
  await persistAuditEventToDatabase(event);

  return event;
}

export function listAuditEvents() {
  return fallbackAuditEvents.slice(0, 100);
}

async function persistAuditEventToDatabase(event: AuditEvent) {
  try {
    const [{ getDb }, schema] = await Promise.all([import("@/db"), import("@/db/schema")]);
    const db = getDb();

    await db.insert(schema.adminAuditEvents).values({
      action: event.action,
      actorUserId: event.actorUserId,
      createdAt: new Date(event.createdAt),
      districtId: event.districtId,
      id: event.id,
      reason: event.reason,
      targetId: event.targetId,
      targetType: event.targetType,
    });
  } catch {
    // Local development and Cloud Run builds may not have the D1 binding yet.
    // The in-memory event still lets the API respond and keeps audit shape stable.
  }
}
