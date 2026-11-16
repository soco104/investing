import {
  allowsDebt,
  eventAmountCents,
  findCard,
  isValidPercent,
  lifeEventDeck,
  MAX_RANDOM_STUDENTS,
  pickRandom,
  type LifeEventKind,
} from "@/lib/life-events";
import type { AuthenticatedUser } from "@/lib/server/auth";
import {
  adjustCashInTransaction,
  getClassGradeLevel,
  listClassPortfolios,
  PortfolioError,
  type ClassPortfolioRow,
} from "@/lib/server/portfolios";
import { defaultDistrictId, getSql, hasProductionDatabase, id } from "@/lib/server/repository";
import { controllableClasses, requireControllable } from "@/lib/server/teacher-market";

/**
 * Life event cards (v0.2.17). A teacher (or admin) plays a card at the whole
 * class, a random handful, or one student. Each hit moves that student's
 * cash and shows up in their activity. Undo reverses every hit.
 */

export type LifeEventTarget =
  | { type: "class" }
  | { count: number; type: "random" }
  | { studentEmail: string; type: "student" };

export type LifeEventChoice =
  | { cardId: string }
  | { description: string; kind: LifeEventKind; percentOfStartingCash: number; title: string };

export const MAX_TITLE = 80;
export const MAX_DESCRIPTION = 400;

const actorId = (user: AuthenticatedUser) => user.actingAdmin?.id ?? user.id;

function requireDatabase() {
  if (!hasProductionDatabase()) throw new PortfolioError("Life events need a database (DATABASE_URL).", 503);
}

/** The card as it will be played: from the deck, or a teacher's own. */
export function resolveChoice(choice: LifeEventChoice) {
  if ("cardId" in choice) {
    const card = findCard(choice.cardId);

    if (!card) throw new PortfolioError("That card isn't in the deck.", 404);

    return { ...card, cardId: card.id };
  }

  const title = choice.title.trim();
  const description = choice.description.trim();

  if (!title || title.length > MAX_TITLE) throw new PortfolioError(`Give the event a title up to ${MAX_TITLE} characters.`, 400);
  if (!description || description.length > MAX_DESCRIPTION) {
    throw new PortfolioError(`Describe the event in up to ${MAX_DESCRIPTION} characters.`, 400);
  }
  if (choice.kind !== "expense" && choice.kind !== "windfall") throw new PortfolioError("Choose expense or windfall.", 400);
  if (!isValidPercent(choice.percentOfStartingCash)) {
    throw new PortfolioError("The amount must be a whole percent of starting cash from 1 to 100.", 400);
  }

  return { cardId: null, description, kind: choice.kind, percentOfStartingCash: choice.percentOfStartingCash, prompt: "", title };
}

/** Who a target picks in a class, and what the card would do to each of them. */
async function planHits(className: string, target: LifeEventTarget, card: ReturnType<typeof resolveChoice>, seed: string) {
  const [portfolios, gradeLevel] = await Promise.all([listClassPortfolios(className), getClassGradeLevel(className)]);
  const debtAllowed = allowsDebt(gradeLevel);
  let chosen: ClassPortfolioRow[] = portfolios;

  if (target.type === "student") {
    const email = target.studentEmail.trim().toLowerCase();

    chosen = portfolios.filter((row) => row.email.toLowerCase() === email);
    if (chosen.length === 0) throw new PortfolioError(`That student doesn't have a portfolio in ${className} this year.`, 404);
  } else if (target.type === "random") {
    const count = Number(target.count);

    if (!Number.isInteger(count) || count < 1 || count > MAX_RANDOM_STUDENTS) {
      throw new PortfolioError(`Choose how many students, from 1 to ${MAX_RANDOM_STUDENTS}.`, 400);
    }

    chosen = pickRandom(portfolios, count, seed);
  }

  if (chosen.length === 0) throw new PortfolioError(`Nobody in ${className} has a portfolio this year yet.`, 404);

  return {
    debtAllowed,
    gradeLevel,
    hits: chosen.map((row) => {
      const cash = Number(row.cash_cents);
      const { amountCents, capped } = eventAmountCents({
        cashCents: cash,
        debtAllowed,
        kind: card.kind,
        percentOfStartingCash: card.percentOfStartingCash,
        startingCashCents: Number(row.starting_cash_cents),
      });

      return {
        amountCents,
        capped,
        cashAfterCents: cash + amountCents,
        cashBeforeCents: cash,
        email: row.email,
        name: `${row.first_name} ${row.last_name}`.trim(),
        portfolioId: row.id,
        studentUserId: row.user_id,
      };
    }),
  };
}

export type PlayInput = { choice: LifeEventChoice; className: string; seed?: string; target: LifeEventTarget };

/** What would happen, without doing it. */
export async function previewLifeEvent(user: AuthenticatedUser, input: PlayInput) {
  requireDatabase();
  await requireControllable(user, input.className);

  const card = resolveChoice(input.choice);
  const plan = await planHits(input.className, input.target, card, input.seed ?? "");

  return { card, ...plan };
}

/** Plays the card: moves every chosen student's cash and records the event. */
export async function playLifeEvent(user: AuthenticatedUser, input: PlayInput) {
  requireDatabase();
  await requireControllable(user, input.className);

  const card = resolveChoice(input.choice);
  const eventId = id("life-event");
  // A random handful is re-picked with the event's own id, so the preview
  // (which used the client's seed) and the play can differ: the teacher is
  // told who was hit either way.
  const plan = await planHits(input.className, input.target, card, input.seed ?? eventId);
  const now = new Date();
  const sql = getSql();
  const amountText = (cents: number) => `${cents < 0 ? "-" : ""}$${(Math.abs(cents) / 100).toFixed(2)}`;

  await sql.begin(async (tx) => {
    await tx`
      insert into life_events (
        id, district_id, class_name, card_id, title, description, prompt, kind, percent_of_starting_cash,
        target_type, played_by_user_id, played_at
      )
      values (
        ${eventId}, ${defaultDistrictId}, ${input.className}, ${card.cardId}, ${card.title}, ${card.description},
        ${card.prompt}, ${card.kind}, ${card.percentOfStartingCash}, ${input.target.type}, ${actorId(user)}, ${now}
      )
    `;

    for (const hit of plan.hits) {
      const moved = await adjustCashInTransaction(tx, {
        actorUserId: actorId(user),
        amountCents: hit.amountCents,
        kind: "life_event",
        note: `Life event: ${card.title}${hit.capped ? " (took what was there)" : ""}`,
        portfolioId: hit.portfolioId,
      });

      await tx`
        insert into life_event_hits (id, event_id, portfolio_id, student_user_id, amount_cents, capped, cash_before_cents, cash_after_cents)
        values (${id("life-hit")}, ${eventId}, ${hit.portfolioId}, ${hit.studentUserId}, ${hit.amountCents}, ${hit.capped},
          ${moved.beforeCents}, ${moved.afterCents})
      `;
      hit.cashBeforeCents = moved.beforeCents;
      hit.cashAfterCents = moved.afterCents;
    }
  });

  return {
    card,
    eventId,
    hits: plan.hits.map((hit) => ({ ...hit, amountText: amountText(hit.amountCents) })),
    summary: `${card.title}: ${plan.hits.length} student${plan.hits.length === 1 ? "" : "s"} in ${input.className}`,
  };
}

/** Reverses every hit of an event. Only once. */
export async function undoLifeEvent(user: AuthenticatedUser, eventId: string) {
  requireDatabase();

  const sql = getSql();
  const [event] = await sql<Array<{ class_name: string; title: string; undone_at: Date | null }>>`
    select class_name, title, undone_at from life_events where id = ${eventId} and district_id = ${defaultDistrictId}
  `;

  if (!event) throw new PortfolioError("That life event wasn't found.", 404);

  await requireControllable(user, event.class_name);

  if (event.undone_at) throw new PortfolioError("That life event was already undone.", 409);

  const hits = await sql<Array<{ amount_cents: string; portfolio_id: string }>>`
    select portfolio_id, amount_cents from life_event_hits where event_id = ${eventId}
  `;

  await sql.begin(async (tx) => {
    const claimed = await tx`
      update life_events set undone_at = ${new Date()}, undone_by_user_id = ${actorId(user)}
      where id = ${eventId} and undone_at is null returning id
    `;

    if (claimed.length === 0) throw new PortfolioError("That life event was already undone.", 409);

    for (const hit of hits) {
      if (Number(hit.amount_cents) === 0) continue;

      await adjustCashInTransaction(tx, {
        actorUserId: actorId(user),
        amountCents: -Number(hit.amount_cents),
        kind: "life_event_undo",
        note: `Life event undone: ${event.title}`,
        portfolioId: hit.portfolio_id,
      });
    }
  });

  return { className: event.class_name, reversed: hits.length, title: event.title };
}

/** Recent events for the classes this user controls (newest first). */
export async function listLifeEvents(user: AuthenticatedUser, className?: string | null) {
  requireDatabase();

  const classes = await controllableClasses(user);
  const wanted = className ? classes.filter((name) => name === className) : classes;

  if (wanted.length === 0) return [];

  const sql = getSql();
  const rows = await sql<
    Array<{
      class_name: string; hit_count: string; id: string; kind: string; percent_of_starting_cash: number; played_at: Date;
      played_by: string; students: string | null; target_type: string; title: string; total_cents: string; undone_at: Date | null;
    }>
  >`
    select e.id, e.class_name, e.title, e.kind, e.percent_of_starting_cash, e.target_type, e.played_at, e.undone_at,
      (select u.first_name || ' ' || u.last_name from app_users u where u.id = e.played_by_user_id) as played_by,
      (select count(*) from life_event_hits h where h.event_id = e.id) as hit_count,
      (select coalesce(sum(h.amount_cents), 0) from life_event_hits h where h.event_id = e.id) as total_cents,
      (select string_agg(u.first_name || ' ' || u.last_name, ', ' order by u.last_name)
         from life_event_hits h join app_users u on u.id = h.student_user_id where h.event_id = e.id) as students
    from life_events e
    where e.district_id = ${defaultDistrictId} and e.class_name = any(${wanted})
    order by e.played_at desc
    limit 100
  `;

  return rows.map((row) => ({
    className: row.class_name,
    hitCount: Number(row.hit_count),
    id: row.id,
    kind: row.kind,
    percentOfStartingCash: row.percent_of_starting_cash,
    playedAt: new Date(row.played_at).toISOString(),
    playedBy: row.played_by?.trim() ?? "",
    students: row.students ?? "",
    targetType: row.target_type,
    title: row.title,
    totalCents: Number(row.total_cents),
    undoneAt: row.undone_at ? new Date(row.undone_at).toISOString() : null,
  }));
}

/** What a student sees: the events that hit them, newest first. */
export async function listStudentLifeEvents(userId: string, portfolioId?: string | null) {
  if (!hasProductionDatabase()) return [];

  const rows = await getSql()<
    Array<{ amount_cents: string; capped: boolean; class_name: string; description: string; id: string; kind: string; played_at: Date; prompt: string; title: string; undone_at: Date | null }>
  >`
    select e.id, e.class_name, e.title, e.description, e.prompt, e.kind, e.played_at, e.undone_at, h.amount_cents, h.capped
    from life_event_hits h join life_events e on e.id = h.event_id
    where h.student_user_id = ${userId} and (${portfolioId ?? null}::text is null or h.portfolio_id = ${portfolioId ?? null})
    order by e.played_at desc
    limit 20
  `;

  return rows.map((row) => ({
    amountCents: Number(row.amount_cents),
    capped: row.capped,
    className: row.class_name,
    description: row.description,
    id: row.id,
    kind: row.kind,
    playedAt: new Date(row.played_at).toISOString(),
    prompt: row.prompt,
    title: row.title,
    undone: row.undone_at !== null,
  }));
}

export const deck = lifeEventDeck;
