/**
 * Life event cards (v0.2.17): the "wrenches" a teacher throws into a
 * student's finances. Pure rules and the built-in deck; no database.
 *
 * Decided 2026-11-16:
 * - Amounts are a percent of the student's starting cash, so a card lands
 *   the same way in a $1,000 class and a $10,000 class.
 * - Who it hits is the teacher's choice each time: the whole class, a random
 *   handful, or one student.
 * - Cash can go below zero only for grades 9-12. Younger grades stop at $0
 *   (the card takes what there is).
 */

export type LifeEventKind = "expense" | "windfall";
export type LifeEventCategory = "car" | "health" | "home" | "work" | "school" | "family" | "fun" | "money";

export type LifeEventCard = {
  category: LifeEventCategory;
  description: string; // what the student is told
  id: string;
  kind: LifeEventKind;
  percentOfStartingCash: number; // 1 to 100
  prompt: string; // a question to think about
  title: string;
};

export const DEBT_MIN_GRADE = 9;
export const MIN_EVENT_PERCENT = 1;
export const MAX_EVENT_PERCENT = 100;
export const MAX_RANDOM_STUDENTS = 50;

export const lifeEventDeck: LifeEventCard[] = [
  {
    category: "car",
    description: "Your car failed inspection. The mechanic needs the brakes done before you can drive it again.",
    id: "car-repair",
    kind: "expense",
    percentOfStartingCash: 8,
    prompt: "Would you pay from cash, sell an investment, or both? Why?",
    title: "Car repair",
  },
  {
    category: "car",
    description: "A parking ticket you forgot about doubled when the deadline passed.",
    id: "parking-ticket",
    kind: "expense",
    percentOfStartingCash: 2,
    prompt: "What small habit would have avoided this?",
    title: "Parking ticket",
  },
  {
    category: "health",
    description: "A trip to urgent care and a prescription. Insurance covered some, but not all.",
    id: "urgent-care",
    kind: "expense",
    percentOfStartingCash: 6,
    prompt: "How much should an emergency fund hold for surprises like this?",
    title: "Urgent care visit",
  },
  {
    category: "health",
    description: "A chipped tooth needs a crown. The dentist wants half up front.",
    id: "dental-bill",
    kind: "expense",
    percentOfStartingCash: 10,
    prompt: "Is this the kind of cost you can plan for, or only prepare for?",
    title: "Dental bill",
  },
  {
    category: "home",
    description: "Your phone screen shattered. The repair shop can fix it today.",
    id: "phone-repair",
    kind: "expense",
    percentOfStartingCash: 3,
    prompt: "Repair, replace, or live with it? What does each choice cost over a year?",
    title: "Cracked phone",
  },
  {
    category: "home",
    description: "Rent went up when the lease renewed. This is the extra for the first month.",
    id: "rent-increase",
    kind: "expense",
    percentOfStartingCash: 5,
    prompt: "What changes to your plan when a regular bill grows?",
    title: "Rent increase",
  },
  {
    category: "home",
    description: "The fridge died. A used replacement and delivery, today.",
    id: "appliance-breakdown",
    kind: "expense",
    percentOfStartingCash: 12,
    prompt: "Which investment would you sell first if you had to, and why that one?",
    title: "Fridge breakdown",
  },
  {
    category: "work",
    description: "Your hours were cut for two weeks while the shop is slow.",
    id: "hours-cut",
    kind: "expense",
    percentOfStartingCash: 7,
    prompt: "How would you cover regular bills with less money coming in?",
    title: "Hours cut at work",
  },
  {
    category: "school",
    description: "The class trip costs more than expected, and the deposit is due Friday.",
    id: "class-trip",
    kind: "expense",
    percentOfStartingCash: 4,
    prompt: "Is this a need or a want? How do you decide?",
    title: "Class trip deposit",
  },
  {
    category: "family",
    description: "A relative needs a loan to get through the month. You said yes.",
    id: "family-loan",
    kind: "expense",
    percentOfStartingCash: 10,
    prompt: "What would you agree on before lending money to someone you care about?",
    title: "Lending to family",
  },
  {
    category: "fun",
    description: "Concert tickets for your favorite band went on sale. You bought two.",
    id: "concert-tickets",
    kind: "expense",
    percentOfStartingCash: 5,
    prompt: "How much fun spending fits in a plan without wrecking it?",
    title: "Concert tickets",
  },
  {
    category: "money",
    description: "A subscription you forgot about renewed for the year.",
    id: "forgotten-subscription",
    kind: "expense",
    percentOfStartingCash: 2,
    prompt: "What's on your list of automatic payments? Are you sure?",
    title: "Forgotten subscription",
  },
  {
    category: "money",
    description: "Your tax refund arrived.",
    id: "tax-refund",
    kind: "windfall",
    percentOfStartingCash: 8,
    prompt: "Spend, save or invest it? What split would you choose?",
    title: "Tax refund",
  },
  {
    category: "work",
    description: "You got a bonus for a project that went well.",
    id: "work-bonus",
    kind: "windfall",
    percentOfStartingCash: 10,
    prompt: "Does a one-time bonus change your plan, or only your balance?",
    title: "Work bonus",
  },
  {
    category: "family",
    description: "A birthday gift from your grandparents, with a note that says 'be smart with it'.",
    id: "birthday-gift",
    kind: "windfall",
    percentOfStartingCash: 4,
    prompt: "What does 'be smart with it' mean to you?",
    title: "Birthday gift",
  },
  {
    category: "money",
    description: "You sold old games and a bike you don't use.",
    id: "sold-old-stuff",
    kind: "windfall",
    percentOfStartingCash: 3,
    prompt: "Where should money from selling things you own go?",
    title: "Sold old stuff",
  },
  {
    category: "work",
    description: "Overtime for a busy month paid off.",
    id: "overtime",
    kind: "windfall",
    percentOfStartingCash: 6,
    prompt: "Is extra income a reason to spend more, or a chance to get ahead?",
    title: "Overtime pay",
  },
  {
    category: "money",
    description: "A bank fee was charged by mistake and refunded, with a small credit for the trouble.",
    id: "fee-refund",
    kind: "windfall",
    percentOfStartingCash: 1,
    prompt: "How often do you check your statements for mistakes?",
    title: "Fee refund",
  },
];

export function findCard(cardId: string) {
  return lifeEventDeck.find((card) => card.id === cardId) ?? null;
}

export function isValidPercent(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= MIN_EVENT_PERCENT && value <= MAX_EVENT_PERCENT;
}

/** Only grades 9-12 can go into debt from an event. */
export function allowsDebt(gradeLevel: number | null | undefined) {
  return typeof gradeLevel === "number" && gradeLevel >= DEBT_MIN_GRADE;
}

/**
 * What one card does to one student. Expenses take a percent of the
 * student's starting cash; if debt isn't allowed, only what's there. The
 * amount is negative for an expense, positive for a windfall.
 */
export function eventAmountCents(input: {
  cashCents: number;
  debtAllowed: boolean;
  kind: LifeEventKind;
  percentOfStartingCash: number;
  startingCashCents: number;
}) {
  const full = Math.round((input.startingCashCents * input.percentOfStartingCash) / 100);

  if (input.kind === "windfall") return { amountCents: full, capped: false };

  const take = input.debtAllowed ? full : Math.min(full, Math.max(0, input.cashCents));

  return { amountCents: take === 0 ? 0 : -take, capped: take < full };
}

/** A repeatable pick of n students (for "random handful"), given a seed. */
export function pickRandom<T>(items: T[], count: number, seed: string) {
  let state = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }

  const next = () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pool = [...items];

  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(next() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap], pool[index]];
  }

  return pool.slice(0, Math.max(0, Math.min(count, pool.length)));
}
