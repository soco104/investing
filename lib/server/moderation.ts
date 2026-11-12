import { filterMessage } from "@/lib/message-rules";

export type ModerationStatus = "allowed" | "blocked" | "pending_review" | "resolved";

export type ModerationReview = {
  action: "allow" | "block" | "escalate";
  messageId: string;
  note: string;
};

/**
 * Checks text with the shared safety filter (lib/message-rules.ts): "blocked"
 * for language that isn't allowed, "allowed" otherwise. (Messages also use the
 * filter's "review" result to flag personal information to the teacher.)
 */
export function moderateTextMessage(body: string) {
  const result = filterMessage(body);
  const matchedTerms = result.status === "blocked" ? result.reasons : [];

  return {
    matchedTerms,
    profanityDetected: result.status === "blocked",
    status: result.status === "blocked" ? ("blocked" as const) : ("allowed" as const),
  };
}

export function reviewModerationItem(input: ModerationReview) {
  const nextStatus: ModerationStatus =
    input.action === "allow"
      ? "allowed"
      : input.action === "block"
        ? "blocked"
        : "pending_review";

  return {
    messageId: input.messageId,
    note: input.note,
    reviewedAt: new Date().toISOString(),
    status: nextStatus,
  };
}
