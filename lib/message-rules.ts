/**
 * Messaging rules, as pure functions (no database): who may message whom, the
 * safety filter, the 90-day retention rule, and email-domain checks. Used by
 * lib/server/messages.ts and covered by tests/message-rules.test.ts.
 */

export type Role = "Student" | "Teacher" | "Admin";

export type Person = {
  classNames: string[];
  role: Role;
};

export const RETENTION_DAYS = 90;
export const MAX_MESSAGE = 1_000;

const shareClass = (a: Person, b: Person) => a.classNames.some((name) => b.classNames.includes(name));

/**
 * Who can message whom:
 * - students: students in their classes, and their teachers;
 * - teachers: students in their classes, other teachers, and admins;
 * - admins: everyone.
 */
export function canMessage(sender: Person, recipient: Person) {
  if (sender.role === "Admin") return true;

  if (sender.role === "Teacher") {
    if (recipient.role === "Student") return shareClass(sender, recipient);
    return true; // other teachers and admins
  }

  // Student
  if (recipient.role === "Admin") return false;
  return shareClass(sender, recipient);
}

/** A message can be deleted once it is older than 90 days and nobody kept it. */
export function isExpired(createdAt: Date, keptByAnyone: boolean, now = new Date()) {
  if (keptByAnyone) return false;
  return now.getTime() - createdAt.getTime() > RETENTION_DAYS * 24 * 60 * 60 * 1000;
}

// ------------------------------------------------------------ safety filter

// Words blocked when they appear as a whole word (so "class" and "shell" are
// fine). Letters repeated or spaced out, and look-alike symbols, are
// normalized first, so "sh1t", "f.u.c.k" and "fuuuck" are caught.
const blockedWords = new Set([
  "ass",
  "asshole",
  "bastard",
  "bitch",
  "bullshit",
  "crap",
  "cunt",
  "damn",
  "dick",
  "fag",
  "faggot",
  "fuck",
  "fucker",
  "fucking",
  "fucked",
  "goddamn",
  "hell",
  "motherfucker",
  "nigga",
  "nigger",
  "piss",
  "pussy",
  "retard",
  "retarded",
  "shit",
  "shitty",
  "slut",
  "whore",
]);

// Stems blocked even inside a longer word ("fuckface", "dumbshit").
// Not "cunt" (it's inside "Scunthorpe"); whole-word matching covers it.
const blockedStems = ["fuck", "shit", "bitch"];

// Real words that contain a blocked stem.
const safeTokens = new Set(["shiitake", "shitake"]);

const lookalikes: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  "$": "s",
  "!": "i",
};

/** Lowercases, swaps look-alike symbols, joins spaced-out letters, squeezes repeats. */
export function normalizeForFilter(text: string) {
  let value = text.toLowerCase();

  value = [...value].map((char) => lookalikes[char] ?? char).join("");
  // "f u c k" / "f.u.c.k" / "f-u-c-k": single letters separated by one separator.
  value = value.replace(/\b(?:[a-z][\s._*-]){2,}[a-z]\b/g, (match) => match.replace(/[\s._*-]/g, ""));
  // Replace other punctuation with spaces, then squeeze 3+ repeated letters to 1.
  value = value.replace(/[^a-z\s]/g, " ").replace(/([a-z])\1{2,}/g, "$1");

  return value;
}

function matchedBlockedWords(text: string) {
  const normalized = normalizeForFilter(text);
  const squeezed = normalized.replace(/([a-z])\1+/g, "$1");
  const found = new Set<string>();

  for (const token of normalized.split(/\s+/).filter(Boolean)) {
    const collapsed = token.replace(/([a-z])\1+/g, "$1");

    if (safeTokens.has(token) || safeTokens.has(collapsed)) continue;

    for (const candidate of [token, collapsed]) {
      if (blockedWords.has(candidate)) found.add(candidate);
      for (const stem of blockedStems) {
        if (candidate.includes(stem)) found.add(stem);
      }
    }
  }

  // "fuuuck" collapses to "fuck", but "hell"/"damn" keep their double letters
  // above; also check the fully squeezed text for words like "shiit".
  for (const token of squeezed.split(/\s+/).filter(Boolean)) {
    if (blockedWords.has(token)) found.add(token);
  }

  return [...found];
}

const reviewPatterns: Array<{ pattern: RegExp; reason: string }> = [
  { pattern: /\b\d{3}[\s.-]?\d{3}[\s.-]?\d{4}\b/, reason: "Possible phone number" },
  { pattern: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i, reason: "Possible email address" },
  {
    pattern: /\b\d{1,5}\s+[a-z0-9]+(?:\s+[a-z0-9]+)?\s+(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|ct|court)\b/i,
    reason: "Possible home address",
  },
  {
    pattern: /\b(?:my|add me on|follow me on)\s+(?:snap|snapchat|insta|instagram|tiktok|discord|kik)\b/i,
    reason: "Possible social media contact",
  },
  {
    pattern: /\b(?:kill|hurt|harm)\s+(?:myself|yourself|urself)\b|\bwant to die\b|\bkys\b/i,
    reason: "Possible safety concern",
  },
  {
    pattern: /\bi(?:'m| am| will| ll)?\s*(?:going to|gonna)?\s*(?:beat|punch|kill)\s+you\b|\bnobody likes you\b|\byou(?:'re| are) (?:ugly|stupid|worthless)\b/i,
    reason: "Possible bullying",
  },
];

export type FilterResult =
  | { reasons: string[]; status: "allowed" }
  | { reasons: string[]; status: "blocked" }
  | { reasons: string[]; status: "review" };

/**
 * Checks a message before it is saved.
 * - blocked: language that isn't allowed; the message is not sent.
 * - review: the message is sent but flagged to the teacher (personal
 *   information, a possible safety concern, or bullying).
 */
export function filterMessage(body: string): FilterResult {
  const blocked = matchedBlockedWords(body);

  if (blocked.length) return { reasons: blocked, status: "blocked" };

  const reasons = reviewPatterns.filter((rule) => rule.pattern.test(body)).map((rule) => rule.reason);

  return reasons.length ? { reasons, status: "review" } : { reasons: [], status: "allowed" };
}

// ------------------------------------------------------------ email domains

const emailPattern = /^[^\s@]+@([^\s@]+\.[^\s@]{2,})$/;

export function isValidEmail(value: string) {
  return emailPattern.test(value.trim()) && value.trim().length <= 254;
}

/** "Example.EDU", "@example.edu" or "https://example.edu/x" → "example.edu". */
export function normalizeDomain(value: string) {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");

  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(cleaned) ? cleaned : null;
}

/**
 * Whether an email's domain is on the allowed list. A listed domain also
 * allows its subdomains (listing "district.org" allows "mail.district.org").
 */
export function isAllowedEmailDomain(email: string, allowedDomains: string[]) {
  const match = emailPattern.exec(email.trim().toLowerCase());

  if (!match) return false;

  const domain = match[1];
  return allowedDomains.some((allowed) => domain === allowed || domain.endsWith(`.${allowed}`));
}
