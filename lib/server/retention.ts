export type RetentionRequestType = "export" | "delete";

export type RetentionRequest = {
  districtId: string;
  reason: string;
  requestedByUserId: string;
  targetId: string;
  targetType: "student" | "teacher" | "classroom" | "school" | "district";
  type: RetentionRequestType;
};

export function createRetentionPlan(request: RetentionRequest) {
  const isDelete = request.type === "delete";

  return {
    districtId: request.districtId,
    estimatedCompletion: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    id: `retention-${Date.now()}`,
    nextSteps: isDelete
      ? [
          "Verify district authorization for deletion.",
          "Export records required by contract before deletion.",
          "Delete or anonymize target records after retention checks pass.",
          "Record the deletion audit event.",
        ]
      : [
          "Verify requester authority.",
          "Collect profile, roster, portfolio, quest, message, and audit records.",
          "Redact secrets and unrelated student data.",
          "Package the export for secure district delivery.",
        ],
    reason: request.reason,
    requestedAt: new Date().toISOString(),
    requestedByUserId: request.requestedByUserId,
    status: "pending_review",
    targetId: request.targetId,
    targetType: request.targetType,
    type: request.type,
  };
}
