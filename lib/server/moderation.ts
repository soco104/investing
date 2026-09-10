export type ModerationStatus = "allowed" | "blocked" | "pending_review" | "resolved";

export type ModerationReview = {
  action: "allow" | "block" | "escalate";
  messageId: string;
  note: string;
};

const blockedTerms = ["damn", "hell"];

export function moderateTextMessage(body: string) {
  const normalized = body.toLowerCase();
  const matchedTerms = blockedTerms.filter((term) =>
    normalized.split(/\W+/).includes(term)
  );

  return {
    matchedTerms,
    profanityDetected: matchedTerms.length > 0,
    status: matchedTerms.length > 0 ? ("blocked" as const) : ("allowed" as const),
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
