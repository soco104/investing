import { createTraceId, nowIso } from "@/lib/observability";
import type { AuthenticatedUser } from "@/lib/server/auth";
import { hasProductionDatabase, listAudit, recordAudit } from "./repository";

export type AuditAction =
  | "role.changed"
  | "users.imported"
  | "user.created"
  | "user.updated"
  | "permission.changed"
  | "portfolio.corrected"
  | "portfolio_reset.requested"
  | "portfolio_reset.approved"
  | "portfolio_reset.denied"
  | "school_year.updated"
  | "view_as.started"
  | "view_as.ended"
  | "view_as.action"
  | "integration.created"
  | "integration.updated"
  | "integration.deleted"
  | "credential.created"
  | "credential.updated"
  | "credential.deleted"
  | "credential.rotated"
  | "class_market.updated"
  | "class_market.info_level_updated"
  | "market_change.created"
  | "market_change.undone"
  | "market_change.reset"
  | "market_clock.paused"
  | "market_clock.resumed"
  | "market_clock.speed_changed"
  | "market_clock.hours_changed"
  | "quest.saved"
  | "quest.copied"
  | "quest.assigned"
  | "quest.graded"
  | "quest.grade_changed"
  | "quest.grade_released"
  | "message.flagged"
  | "message.flag_resolved"
  | "message.flag_forwarded"
  | "message.kept"
  | "message.cleanup"
  | "life_event.played"
  | "life_event.undone"
  | "debrief.submitted"
  | "debrief.graded"
  | "debrief.grade_changed"
  | "debrief.grade_released"
  | "email_domain.added"
  | "email_domain.removed"
  | "alternate_contact.requested"
  | "alternate_contact.approved"
  | "alternate_contact.denied"
  | "alternate_contact.added"
  | "alternate_contact.removed"
  | "privacy.updated"
  | "email.test_sent"
  | "password_reset.requested"
  | "retention.export_requested"
  | "retention.delete_requested"
  | "moderation.reviewed"
  | "backup.requested"
  | "incident.opened"
  | "sso.updated"
  | "school.created"
  | "school.deleted"
  | "support_case.created"
  | "quest_templates.exported"
  | "quest_templates.imported";

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

export async function listAuditEvents() {
  if (hasProductionDatabase()) {
    return listAudit();
  }

  return fallbackAuditEvents.slice(0, 100);
}

async function persistAuditEventToDatabase(event: AuditEvent) {
  try {
    await recordAudit(event);
  } catch (error) {
    if (hasProductionDatabase()) {
      throw error;
    }
  }
}
