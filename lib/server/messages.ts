import {
  canMessage,
  filterMessage,
  isAllowedEmailDomain,
  isValidEmail,
  MAX_MESSAGE,
  normalizeDomain,
  RETENTION_DAYS,
  type Person,
} from "@/lib/message-rules";
import type { AuthenticatedUser } from "@/lib/server/auth";
import { sendEmail } from "@/lib/server/email";
import { PortfolioError as MessageError } from "@/lib/server/portfolios-errors";
import { getSql, hasProductionDatabase, id } from "@/lib/server/repository";

/**
 * Messages (v0.2.10): one-to-one inbox threads and class discussion rooms.
 *
 * - Who can message whom is decided by canMessage (lib/message-rules.ts).
 * - Teachers see their students' conversations (read-only); admins see all.
 * - A message is deleted after 90 days unless someone ticked Keep, or it has
 *   an unresolved flag. A daily cleanup does this.
 * - Flags go to the teacher first, who can resolve them or forward them to
 *   admins, to an address on the admin-set domain list, or to the student's
 *   approved alternate contact (a parent or guardian an admin added).
 */

export { MessageError };

type Sql = ReturnType<typeof getSql>;

function requireDatabase() {
  if (!hasProductionDatabase()) {
    throw new MessageError("Messages need a database (DATABASE_URL).", 503);
  }
}

const isAdmin = (user: AuthenticatedUser) => user.role === "Admin";
const isStaff = (user: AuthenticatedUser) => user.role === "Teacher" || user.role === "Admin";
/** The person actually acting (the admin, while viewing as a student). */
const actingId = (user: AuthenticatedUser) => user.actingAdmin?.id ?? user.id;

function personOf(user: AuthenticatedUser): Person {
  return { classNames: isAdmin(user) ? [] : user.classNames, role: user.role };
}

const fullName = (first: string, last: string) => `${first} ${last}`.trim();

type PersonRow = {
  class_names: string[] | null;
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  role: string | null;
};

const personSelect = (sql: Sql) => sql`
  u.id, u.email, u.first_name, u.last_name,
  (select ra.role from role_assignments ra where ra.user_id = u.id
    order by ra.assigned_at desc limit 1) as role,
  (select json_agg(distinct ra.scope) from role_assignments ra
    where ra.user_id = u.id and ra.scope <> '' and ra.scope <> 'District') as class_names
`;

function toPerson(row: PersonRow): Person & { email: string; id: string; name: string } {
  const role = row.role === "Admin" || row.role === "Teacher" ? row.role : "Student";

  return {
    classNames: role === "Admin" ? [] : row.class_names ?? [],
    email: row.email,
    id: row.id,
    name: fullName(row.first_name, row.last_name),
    role,
  };
}

// ------------------------------------------------------------------ contacts

/** Everyone this user is allowed to start a conversation with. */
export async function listContacts(user: AuthenticatedUser) {
  requireDatabase();

  const sql = getSql();
  const rows = await sql<PersonRow[]>`
    select ${personSelect(sql)} from app_users u
    where u.status = 'active' and u.id <> ${user.id}
    order by u.last_name, u.first_name
    limit 3000
  `;
  const me = personOf(user);

  return rows
    .map(toPerson)
    .filter((person) => canMessage(me, person))
    .map((person) => ({
      classNames: person.classNames,
      email: person.email,
      name: person.name,
      role: person.role,
    }));
}

// -------------------------------------------------------------- conversations

type ConversationRow = {
  class_name: string | null;
  created_at: Date;
  id: string;
  kind: "direct" | "room";
  last_read_at: Date | null;
  title: string;
};

type MessageRow = {
  acting_admin_name: string | null;
  body: string;
  conversation_id: string;
  created_at: Date;
  flag_status: string | null;
  id: string;
  keep_count: string;
  kept_by_me: boolean;
  sender_first: string;
  sender_id: string;
  sender_last: string;
  sender_role: string | null;
};

export type ConversationView = "mine" | "oversight";

/** A conversation's participants and whether this user may read / post in it. */
async function conversationAccess(user: AuthenticatedUser, conversationId: string) {
  const sql = getSql();
  const [conversation] = await sql<Array<{ class_name: string | null; id: string; kind: "direct" | "room" }>>`
    select id, kind, class_name from conversations where id = ${conversationId}
  `;

  if (!conversation) throw new MessageError("That conversation wasn't found.", 404);

  if (conversation.kind === "room") {
    const member = isAdmin(user) || (conversation.class_name !== null && user.classNames.includes(conversation.class_name));
    return { conversation, canPost: member, canRead: member, participants: [] as ReturnType<typeof toPerson>[] };
  }

  const people = await sql<PersonRow[]>`
    select ${personSelect(sql)}
    from conversation_participants p join app_users u on u.id = p.user_id
    where p.conversation_id = ${conversationId}
  `;
  const participants = people.map(toPerson);
  const isParticipant = participants.some((person) => person.id === user.id);
  const me = personOf(user);
  const others = participants.filter((person) => person.id !== user.id);
  // Teachers oversee conversations of students in their classes; admins see all.
  const oversees =
    isAdmin(user) ||
    (user.role === "Teacher" &&
      participants.some((person) => person.role === "Student" && person.classNames.some((name) => user.classNames.includes(name))));

  return {
    conversation,
    canPost: isParticipant && others.every((other) => canMessage(me, other)),
    canRead: isParticipant || oversees,
    participants,
  };
}

async function requireReadable(user: AuthenticatedUser, conversationId: string) {
  const access = await conversationAccess(user, conversationId);

  if (!access.canRead) throw new MessageError("You can't open that conversation.", 403);
  return access;
}

/** Start (or reopen) a one-to-one conversation with someone you may message. */
export async function startConversation(user: AuthenticatedUser, recipientEmail: string) {
  requireDatabase();

  const sql = getSql();
  const [row] = await sql<PersonRow[]>`
    select ${personSelect(sql)} from app_users u
    where lower(u.email) = ${recipientEmail.trim().toLowerCase()} and u.status = 'active'
  `;

  if (!row || row.id === user.id) throw new MessageError("Choose someone to message.", 400);

  const recipient = toPerson(row);

  if (!canMessage(personOf(user), recipient)) {
    throw new MessageError(`You can't message ${recipient.name || "that person"}.`, 403);
  }

  const [existing] = await sql<Array<{ id: string }>>`
    select c.id from conversations c
    join conversation_participants a on a.conversation_id = c.id and a.user_id = ${user.id}
    join conversation_participants b on b.conversation_id = c.id and b.user_id = ${recipient.id}
    where c.kind = 'direct' limit 1
  `;

  if (existing) return { conversationId: existing.id, created: false, recipientName: recipient.name };

  const conversationId = id("conversation");
  const now = new Date();

  await sql.begin(async (tx) => {
    await tx`
      insert into conversations (id, kind, title, created_by_user_id, created_at)
      values (${conversationId}, 'direct', '', ${user.id}, ${now})
    `;
    await tx`
      insert into conversation_participants (conversation_id, user_id, last_read_at)
      values (${conversationId}, ${user.id}, ${now}), (${conversationId}, ${recipient.id}, null)
    `;
  });

  return { conversationId, created: true, recipientName: recipient.name };
}

/** Teachers create a discussion room for one of their classes. */
export async function createRoom(user: AuthenticatedUser, className: string, title: string) {
  requireDatabase();

  if (!isStaff(user)) throw new MessageError("Only teachers can create discussion rooms.", 403);
  if (!isAdmin(user) && !user.classNames.includes(className)) {
    throw new MessageError("You can only create rooms for your own classes.", 403);
  }

  const clean = title.trim();
  if (!clean || clean.length > 80) throw new MessageError("Give the room a title up to 80 characters.", 400);
  if (filterMessage(clean).status === "blocked") {
    throw new MessageError("That title has language that isn't allowed.", 400);
  }

  const roomId = id("conversation");

  await getSql()`
    insert into conversations (id, kind, title, class_name, created_by_user_id, created_at)
    values (${roomId}, 'room', ${clean}, ${className}, ${user.id}, ${new Date()})
  `;

  return { conversationId: roomId };
}

/** Conversations with their recent messages, for the Inbox and Discussion tabs. */
export async function listConversations(user: AuthenticatedUser, kind: "direct" | "room", view: ConversationView) {
  requireDatabase();
  void maybeRunDailyCleanup();

  const sql = getSql();
  const classes = isAdmin(user) ? [] : user.classNames;
  let rows: ConversationRow[];

  if (kind === "room") {
    rows = await sql<ConversationRow[]>`
      select c.id, c.kind, c.title, c.class_name, c.created_at, p.last_read_at
      from conversations c
      left join conversation_participants p on p.conversation_id = c.id and p.user_id = ${user.id}
      where c.kind = 'room' and (${isAdmin(user)} or c.class_name = any(${classes}))
      order by c.created_at desc limit 100
    `;
  } else if (view === "oversight") {
    if (!isStaff(user)) throw new MessageError("Only teachers and admins can see student conversations.", 403);

    rows = await sql<ConversationRow[]>`
      select c.id, c.kind, c.title, c.class_name, c.created_at, null::timestamp as last_read_at
      from conversations c
      where c.kind = 'direct'
        and not exists (select 1 from conversation_participants me where me.conversation_id = c.id and me.user_id = ${user.id})
        and exists (
          select 1 from conversation_participants p
          join role_assignments ra on ra.user_id = p.user_id and ra.role = 'Student'
          where p.conversation_id = c.id and (${isAdmin(user)} or ra.scope = any(${classes}))
        )
        and exists (select 1 from messages m where m.conversation_id = c.id)
      order by (select max(m.created_at) from messages m where m.conversation_id = c.id) desc
      limit 100
    `;
  } else {
    rows = await sql<ConversationRow[]>`
      select c.id, c.kind, c.title, c.class_name, c.created_at, p.last_read_at
      from conversations c
      join conversation_participants p on p.conversation_id = c.id and p.user_id = ${user.id}
      where c.kind = 'direct'
      order by coalesce((select max(m.created_at) from messages m where m.conversation_id = c.id), c.created_at) desc
      limit 100
    `;
  }

  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const [messages, participants] = await Promise.all([
    sql<MessageRow[]>`
      select * from (
        select m.id, m.conversation_id, m.body, m.created_at, m.sender_user_id as sender_id,
          s.first_name as sender_first, s.last_name as sender_last,
          (select ra.role from role_assignments ra where ra.user_id = s.id order by ra.assigned_at desc limit 1) as sender_role,
          (select a.first_name || ' ' || a.last_name from app_users a where a.id = m.acting_admin_user_id) as acting_admin_name,
          (select count(*) from message_keeps k where k.message_id = m.id) as keep_count,
          exists (select 1 from message_keeps k where k.message_id = m.id and k.user_id = ${user.id}) as kept_by_me,
          (select f.status from message_flags f where f.message_id = m.id order by f.created_at desc limit 1) as flag_status,
          row_number() over (partition by m.conversation_id order by m.created_at desc) as rn
        from messages m join app_users s on s.id = m.sender_user_id
        where m.conversation_id = any(${ids})
      ) t where rn <= 200 order by created_at asc
    `,
    sql<Array<{ conversation_id: string; first_name: string; last_name: string; user_id: string }>>`
      select p.conversation_id, p.user_id, u.first_name, u.last_name
      from conversation_participants p join app_users u on u.id = p.user_id
      where p.conversation_id = any(${ids})
    `,
  ]);

  return rows.map((row) => {
    const mine = messages.filter((message) => message.conversation_id === row.id);
    const people = participants.filter((p) => p.conversation_id === row.id);
    const others = people.filter((p) => p.user_id !== user.id);
    const names = people.map((p) => fullName(p.first_name, p.last_name));
    const readAt = row.last_read_at ? new Date(row.last_read_at).getTime() : 0;

    return {
      className: row.class_name,
      id: row.id,
      kind: row.kind,
      messages: mine.map((message) => ({
        actingAdminName: message.acting_admin_name?.trim() || null,
        body: message.body,
        createdAt: new Date(message.created_at).toISOString(),
        // Only staff see flag markers; students don't.
        flagStatus: isStaff(user) ? message.flag_status : null,
        id: message.id,
        keepCount: Number(message.keep_count),
        keptByMe: message.kept_by_me,
        mine: message.sender_id === user.id,
        senderName: fullName(message.sender_first, message.sender_last),
        senderRole: message.sender_role ?? "Student",
      })),
      participants:
        row.kind === "room"
          ? row.class_name ?? ""
          : view === "oversight"
            ? names.join(" and ")
            : others.map((p) => fullName(p.first_name, p.last_name)).join(", "),
      readOnly: view === "oversight" && kind === "direct",
      title:
        row.kind === "room"
          ? row.title
          : view === "oversight"
            ? names.join(" and ")
            : others.map((p) => fullName(p.first_name, p.last_name)).join(", "),
      unread: mine.filter((message) => message.sender_id !== user.id && new Date(message.created_at).getTime() > readAt).length,
    };
  });
}

export async function markRead(user: AuthenticatedUser, conversationId: string) {
  requireDatabase();

  const access = await conversationAccess(user, conversationId);
  const isMember = access.conversation.kind === "room" ? access.canRead : access.participants.some((p) => p.id === user.id);

  if (!isMember) return; // read-only oversight doesn't mark anything read

  await getSql()`
    insert into conversation_participants (conversation_id, user_id, last_read_at)
    values (${conversationId}, ${user.id}, ${new Date()})
    on conflict (conversation_id, user_id) do update set last_read_at = excluded.last_read_at
  `;
}

// ------------------------------------------------------------------- messages

/**
 * Send a message. Language that isn't allowed is refused. Personal
 * information, safety concerns and bullying from a student are sent but
 * flagged to the teacher automatically.
 */
export async function sendMessage(user: AuthenticatedUser, conversationId: string, body: string) {
  requireDatabase();

  const text = body.trim();

  if (!text) throw new MessageError("Write a message first.", 400);
  if (text.length > MAX_MESSAGE) throw new MessageError(`Keep messages under ${MAX_MESSAGE} characters.`, 400);

  const access = await conversationAccess(user, conversationId);

  if (!access.canPost) throw new MessageError("You can't post in that conversation.", 403);

  const result = filterMessage(text);

  if (result.status === "blocked") {
    throw new MessageError("Message blocked. Rewrite it using respectful classroom language.", 400);
  }

  const sql = getSql();
  const messageId = id("message");
  const now = new Date();
  const autoFlag = result.status === "review" && user.role === "Student";

  await sql.begin(async (tx) => {
    await tx`
      insert into messages (id, conversation_id, sender_user_id, acting_admin_user_id, body, created_at)
      values (${messageId}, ${conversationId}, ${user.id}, ${user.actingAdmin?.id ?? null}, ${text}, ${now})
    `;
    await tx`
      insert into conversation_participants (conversation_id, user_id, last_read_at)
      values (${conversationId}, ${user.id}, ${now})
      on conflict (conversation_id, user_id) do update set last_read_at = excluded.last_read_at
    `;

    if (autoFlag) {
      await tx`
        insert into message_flags (id, message_id, flagged_by_user_id, reason, status, created_at)
        values (${id("flag")}, ${messageId}, null, ${result.reasons.join("; ")}, 'open', ${now})
      `;
    }
  });

  return { flagged: autoFlag, messageId, reasons: autoFlag ? result.reasons : [] };
}

async function messageAccess(user: AuthenticatedUser, messageId: string) {
  const [row] = await getSql()<Array<{ conversation_id: string }>>`
    select conversation_id from messages where id = ${messageId}
  `;

  if (!row) throw new MessageError("That message wasn't found.", 404);

  await requireReadable(user, row.conversation_id);
  return row.conversation_id;
}

/** Keep is per person: a message stays while anyone has kept it. */
export async function setKeep(user: AuthenticatedUser, messageId: string, keep: boolean) {
  requireDatabase();
  await messageAccess(user, messageId);

  const sql = getSql();

  if (keep) {
    await sql`
      insert into message_keeps (message_id, user_id, kept_at)
      values (${messageId}, ${user.id}, ${new Date()})
      on conflict (message_id, user_id) do nothing
    `;
  } else {
    await sql`delete from message_keeps where message_id = ${messageId} and user_id = ${user.id}`;
  }
}

// ---------------------------------------------------------------------- flags

/** Anyone who can read a conversation can flag a message in it. */
export async function flagMessage(user: AuthenticatedUser, messageId: string, reason: string) {
  requireDatabase();
  await messageAccess(user, messageId);

  const clean = reason.trim().slice(0, 300) || "Flagged for review";
  const sql = getSql();
  const [open] = await sql<Array<{ id: string }>>`
    select id from message_flags where message_id = ${messageId} and status <> 'resolved' limit 1
  `;

  if (open) return { alreadyFlagged: true, flagId: open.id };

  const flagId = id("flag");
  await sql`
    insert into message_flags (id, message_id, flagged_by_user_id, reason, status, created_at)
    values (${flagId}, ${messageId}, ${user.id}, ${clean}, 'open', ${new Date()})
  `;

  return { alreadyFlagged: false, flagId };
}

type FlagRow = {
  body: string;
  class_name: string | null;
  conversation_id: string;
  created_at: Date;
  flagged_by_name: string | null;
  handled_at: Date | null;
  handled_by_name: string | null;
  handled_note: string;
  id: string;
  kind: string;
  message_at: Date;
  message_id: string;
  reason: string;
  sender_first: string;
  sender_id: string;
  sender_last: string;
  status: string;
};

/** Visibility rule: teachers see flags in their students' conversations; admins see forwarded ones. */
const flagVisibility = (sql: Sql, user: AuthenticatedUser) => {
  const classes = isAdmin(user) ? [] : user.classNames;

  return isAdmin(user)
    ? sql`exists (select 1 from message_flag_forwards ff where ff.flag_id = f.id and ff.forwarded_to_kind = 'admins')`
    : sql`(c.class_name = any(${classes}) or exists (
        select 1 from conversation_participants p
        join role_assignments ra on ra.user_id = p.user_id and ra.role = 'Student'
        where p.conversation_id = c.id and ra.scope = any(${classes})
      ))`;
};

export async function listFlags(user: AuthenticatedUser) {
  requireDatabase();

  if (!isStaff(user)) throw new MessageError("Only teachers and admins can review flags.", 403);

  const sql = getSql();
  const rows = await sql<FlagRow[]>`
    select f.id, f.message_id, f.reason, f.status, f.created_at, f.handled_at, f.handled_note,
      m.body, m.created_at as message_at, m.conversation_id, m.sender_user_id as sender_id,
      s.first_name as sender_first, s.last_name as sender_last,
      c.kind, c.class_name,
      (select a.first_name || ' ' || a.last_name from app_users a where a.id = f.flagged_by_user_id) as flagged_by_name,
      (select a.first_name || ' ' || a.last_name from app_users a where a.id = f.handled_by_user_id) as handled_by_name
    from message_flags f
    join messages m on m.id = f.message_id
    join conversations c on c.id = m.conversation_id
    join app_users s on s.id = m.sender_user_id
    where ${flagVisibility(sql, user)}
    order by (f.status = 'resolved'), f.created_at desc
    limit 100
  `;

  const results = [];

  for (const row of rows) {
    const [context, forwards] = await Promise.all([
      sql<Array<{ body: string; first_name: string; last_name: string }>>`
        select m.body, u.first_name, u.last_name from messages m join app_users u on u.id = m.sender_user_id
        where m.conversation_id = ${row.conversation_id} and m.created_at < ${row.message_at}
        order by m.created_at desc limit 3
      `,
      sql<Array<{ forwarded_at: Date; forwarded_to: string; forwarded_to_kind: string }>>`
        select forwarded_to_kind, forwarded_to, forwarded_at from message_flag_forwards
        where flag_id = ${row.id} order by forwarded_at asc
      `,
    ]);

    results.push({
      body: row.body,
      className: row.class_name,
      context: context.reverse().map((item) => ({ body: item.body, senderName: fullName(item.first_name, item.last_name) })),
      createdAt: new Date(row.created_at).toISOString(),
      flaggedBy: row.flagged_by_name?.trim() || "Automatic safety check",
      forwards: forwards.map((item) => ({
        at: new Date(item.forwarded_at).toISOString(),
        to: item.forwarded_to_kind === "admins" ? "Admins" : item.forwarded_to,
      })),
      handledBy: row.handled_by_name?.trim() || null,
      handledNote: row.handled_note,
      id: row.id,
      messageAt: new Date(row.message_at).toISOString(),
      reason: row.reason,
      senderName: fullName(row.sender_first, row.sender_last),
      status: row.status,
    });
  }

  return results;
}

async function loadVisibleFlag(user: AuthenticatedUser, flagId: string) {
  const sql = getSql();
  const [row] = await sql<
    Array<{ body: string; conversation_id: string; created_at: Date; id: string; message_id: string; reason: string; sender_id: string; sender_name: string }>
  >`
    select f.id, f.message_id, f.reason, m.body, m.conversation_id, m.created_at, m.sender_user_id as sender_id,
      s.first_name || ' ' || s.last_name as sender_name
    from message_flags f
    join messages m on m.id = f.message_id
    join conversations c on c.id = m.conversation_id
    join app_users s on s.id = m.sender_user_id
    where f.id = ${flagId} and ${flagVisibility(sql, user)}
  `;

  if (!row) throw new MessageError("That flag wasn't found.", 404);
  return row;
}

export async function resolveFlag(user: AuthenticatedUser, flagId: string, note: string) {
  requireDatabase();

  if (!isStaff(user)) throw new MessageError("Only teachers and admins can review flags.", 403);
  await loadVisibleFlag(user, flagId);

  await getSql()`
    update message_flags set status = 'resolved', handled_by_user_id = ${actingId(user)},
      handled_at = ${new Date()}, handled_note = ${note.trim().slice(0, 500)}
    where id = ${flagId}
  `;
}

/** The students involved in a flagged message (its sender, and a direct thread's students). */
async function involvedStudentIds(conversationId: string, senderId: string) {
  const rows = await getSql()<Array<{ user_id: string }>>`
    select distinct u.user_id from (
      select p.user_id from conversation_participants p where p.conversation_id = ${conversationId}
      union select ${senderId}::text as user_id
    ) u
    where exists (select 1 from role_assignments ra where ra.user_id = u.user_id and ra.role = 'Student')
      and (select ra.role from role_assignments ra where ra.user_id = u.user_id order by ra.assigned_at desc limit 1) = 'Student'
  `;

  return rows.map((row) => row.user_id);
}

export type ForwardTarget =
  | { to: "admins" }
  | { email: string; to: "email" }
  | { contactId: string; to: "alternate_contact" };

/**
 * Forward a flag. External addresses must be on the admin-set domain list or
 * be an approved alternate contact of a student in the conversation.
 */
export async function forwardFlag(user: AuthenticatedUser, flagId: string, target: ForwardTarget, note: string) {
  requireDatabase();

  if (user.role !== "Teacher" && !isAdmin(user)) {
    throw new MessageError("Only teachers can forward flagged messages.", 403);
  }

  const flag = await loadVisibleFlag(user, flagId);
  const sql = getSql();
  const cleanNote = note.trim().slice(0, 500);
  const forwarder = fullName(user.firstName, user.lastName) || user.email;
  let recipients: string[] = [];
  let recipientLabel = "";
  let kind: "admins" | "email" | "alternate_contact" = target.to;

  if (target.to === "admins") {
    const admins = await sql<Array<{ email: string }>>`
      select u.email from app_users u
      where u.status = 'active'
        and (select ra.role from role_assignments ra where ra.user_id = u.id order by ra.assigned_at desc limit 1) = 'Admin'
      limit 20
    `;
    recipients = admins.map((admin) => admin.email);
    recipientLabel = "admins";
  } else if (target.to === "alternate_contact") {
    const students = await involvedStudentIds(flag.conversation_id, flag.sender_id);
    const [contact] = await sql<Array<{ contact_email: string }>>`
      select contact_email from student_alternate_contacts
      where id = ${target.contactId} and removed_at is null and student_user_id = any(${students})
    `;

    if (!contact) throw new MessageError("That contact isn't an approved contact for a student in this conversation.", 400);

    recipients = [contact.contact_email];
    recipientLabel = contact.contact_email;
  } else {
    const email = target.email.trim().toLowerCase();

    if (!isValidEmail(email)) throw new MessageError("Enter a valid email address.", 400);

    const [domains, students] = await Promise.all([
      sql<Array<{ domain: string }>>`select domain from allowed_email_domains`,
      involvedStudentIds(flag.conversation_id, flag.sender_id),
    ]);
    const [contact] = await sql<Array<{ id: string }>>`
      select id from student_alternate_contacts
      where lower(contact_email) = ${email} and removed_at is null and student_user_id = any(${students})
    `;

    if (!contact && !isAllowedEmailDomain(email, domains.map((d) => d.domain))) {
      throw new MessageError(
        "That address isn't on the allowed list. Ask an admin to add its domain, or send the parent's email to an admin to add as an alternate contact.",
        403
      );
    }

    kind = contact ? "alternate_contact" : "email";
    recipients = [email];
    recipientLabel = email;
  }

  if (recipients.length === 0) throw new MessageError("There's nobody to send this to.", 400);

  const when = new Date(flag.created_at).toLocaleString("en-US", { timeZone: "America/New_York" });
  // Admins are pointed to the app (no message text in their email); outside
  // recipients get the flagged message itself.
  const text =
    target.to === "admins"
      ? [
          `${forwarder} forwarded a flagged message to the admins for review.`,
          `Reason: ${flag.reason}`,
          cleanNote ? `Note: ${cleanNote}` : "",
          "Sign in to FutureFund Classroom and open the Admin portal's Messaging page to review it.",
        ].filter(Boolean).join("\n\n")
      : [
          `${forwarder} is sharing a message from FutureFund Classroom that was flagged for review.`,
          `From: ${flag.sender_name.trim()}`,
          `Sent: ${when} (Eastern)`,
          `Message: ${flag.body}`,
          `Why it was flagged: ${flag.reason}`,
          cleanNote ? `Note from ${forwarder}: ${cleanNote}` : "",
          "This message contains student information. Please don't share it further.",
        ].filter(Boolean).join("\n\n");
  let emailStatus = "";

  for (const to of recipients) {
    const result = await sendEmail({
      kind: "flagged_message_forward",
      requestedByUserId: actingId(user),
      subject: "FutureFund Classroom: a message was flagged for review",
      text,
      to,
    });
    emailStatus = result.status;
  }

  const forwardedAt = new Date();

  await sql.begin(async (tx) => {
    await tx`
      insert into message_flag_forwards (id, flag_id, forwarded_to_kind, forwarded_to, forwarded_by_user_id, note, email_status, forwarded_at)
      values (${id("flag-forward")}, ${flagId}, ${kind === "admins" ? "admins" : kind}, ${kind === "admins" ? "admins" : recipientLabel},
        ${actingId(user)}, ${cleanNote}, ${emailStatus}, ${forwardedAt})
    `;
    await tx`update message_flags set status = 'forwarded' where id = ${flagId} and status = 'open'`;
  });

  return { emailStatus, recipientLabel, recipients: recipients.length };
}

// ------------------------------------------------------------ allowed domains

export async function listAllowedDomains() {
  requireDatabase();

  const rows = await getSql()<Array<{ added_at: Date; domain: string }>>`
    select domain, added_at from allowed_email_domains order by domain
  `;
  return rows.map((row) => ({ addedAt: new Date(row.added_at).toISOString(), domain: row.domain }));
}

export async function addAllowedDomain(user: AuthenticatedUser, raw: string) {
  requireDatabase();

  if (!isAdmin(user)) throw new MessageError("Only admins can change the allowed email domains.", 403);

  const domain = normalizeDomain(raw);
  if (!domain) throw new MessageError("Enter a domain like district.org.", 400);

  await getSql()`
    insert into allowed_email_domains (domain, added_by_user_id, added_at)
    values (${domain}, ${user.id}, ${new Date()}) on conflict (domain) do nothing
  `;
  return { domain };
}

export async function removeAllowedDomain(user: AuthenticatedUser, raw: string) {
  requireDatabase();

  if (!isAdmin(user)) throw new MessageError("Only admins can change the allowed email domains.", 403);

  const domain = normalizeDomain(raw);
  if (!domain) throw new MessageError("Enter a domain like district.org.", 400);

  await getSql()`delete from allowed_email_domains where domain = ${domain}`;
  return { domain };
}

// ---------------------------------------------------------- alternate contacts

type ContactInput = { email: string; name: string; note?: string; relationship?: string; studentEmail: string };

function cleanContact(input: ContactInput) {
  const name = input.name.trim().slice(0, 100);
  const email = input.email.trim().toLowerCase();

  if (!name) throw new MessageError("Enter the parent or guardian's name.", 400);
  if (!isValidEmail(email)) throw new MessageError("Enter a valid email address.", 400);

  return { email, name, note: (input.note ?? "").trim().slice(0, 500), relationship: (input.relationship ?? "").trim().slice(0, 50) };
}

async function loadStudentByEmail(email: string) {
  const sql = getSql();
  const [row] = await sql<PersonRow[]>`
    select ${personSelect(sql)} from app_users u where lower(u.email) = ${email.trim().toLowerCase()} and u.status = 'active'
  `;
  const person = row ? toPerson(row) : null;

  if (!person || person.role !== "Student") throw new MessageError("Choose a student.", 400);
  return person;
}

/** A teacher sends a parent or guardian's email to the admins to add to the student's profile. */
export async function requestAlternateContact(user: AuthenticatedUser, input: ContactInput) {
  requireDatabase();

  if (!isStaff(user)) throw new MessageError("Only teachers can request alternate contacts.", 403);

  const contact = cleanContact(input);
  const student = await loadStudentByEmail(input.studentEmail);

  if (!isAdmin(user) && !student.classNames.some((name) => user.classNames.includes(name))) {
    throw new MessageError("You can only request contacts for students in your classes.", 403);
  }

  const requestId = id("contact-request");

  await getSql()`
    insert into alternate_contact_requests (
      id, student_user_id, requested_by_user_id, contact_name, relationship, contact_email, note, status, created_at
    )
    values (${requestId}, ${student.id}, ${user.id}, ${contact.name}, ${contact.relationship}, ${contact.email},
      ${contact.note}, 'pending', ${new Date()})
  `;

  return { requestId, studentName: student.name };
}

export async function listContactRequests(user: AuthenticatedUser) {
  requireDatabase();

  if (!isStaff(user)) throw new MessageError("Only teachers and admins can see contact requests.", 403);

  const rows = await getSql()<
    Array<{
      contact_email: string; contact_name: string; created_at: Date; decided_at: Date | null; decision_note: string;
      id: string; note: string; relationship: string; requested_by: string; status: string; student_email: string; student_name: string;
    }>
  >`
    select r.id, r.contact_name, r.contact_email, r.relationship, r.note, r.status, r.created_at, r.decided_at, r.decision_note,
      s.first_name || ' ' || s.last_name as student_name, s.email as student_email,
      t.first_name || ' ' || t.last_name as requested_by
    from alternate_contact_requests r
    join app_users s on s.id = r.student_user_id
    join app_users t on t.id = r.requested_by_user_id
    where ${isAdmin(user)} or r.requested_by_user_id = ${user.id}
    order by (r.status = 'pending') desc, r.created_at desc
    limit 100
  `;

  return rows.map((row) => ({
    contactEmail: row.contact_email,
    contactName: row.contact_name,
    createdAt: new Date(row.created_at).toISOString(),
    decidedAt: row.decided_at ? new Date(row.decided_at).toISOString() : null,
    decisionNote: row.decision_note,
    id: row.id,
    note: row.note,
    relationship: row.relationship,
    requestedBy: row.requested_by.trim(),
    status: row.status,
    studentEmail: row.student_email,
    studentName: row.student_name.trim(),
  }));
}

async function insertContact(adminUser: AuthenticatedUser, studentId: string, contact: ReturnType<typeof cleanContact>, requestId: string | null) {
  const sql = getSql();
  const [duplicate] = await sql<Array<{ id: string }>>`
    select id from student_alternate_contacts
    where student_user_id = ${studentId} and lower(contact_email) = ${contact.email} and removed_at is null
  `;

  if (duplicate) return duplicate.id;

  const contactId = id("alt-contact");
  await sql`
    insert into student_alternate_contacts (id, student_user_id, contact_name, relationship, contact_email, added_by_user_id, request_id, created_at)
    values (${contactId}, ${studentId}, ${contact.name}, ${contact.relationship}, ${contact.email}, ${adminUser.id}, ${requestId}, ${new Date()})
  `;
  return contactId;
}

/** Admin approves (adds the contact to the student's profile) or denies a request. */
export async function decideContactRequest(adminUser: AuthenticatedUser, requestId: string, decision: "approve" | "deny", note: string) {
  requireDatabase();

  if (!isAdmin(adminUser)) throw new MessageError("Only admins can decide contact requests.", 403);

  const sql = getSql();
  const [request] = await sql<
    Array<{ contact_email: string; contact_name: string; relationship: string; status: string; student_user_id: string }>
  >`select student_user_id, contact_name, contact_email, relationship, status from alternate_contact_requests where id = ${requestId}`;

  if (!request) throw new MessageError("That request wasn't found.", 404);
  if (request.status !== "pending") throw new MessageError("That request was already decided.", 409);

  if (decision === "approve") {
    await insertContact(
      adminUser,
      request.student_user_id,
      { email: request.contact_email, name: request.contact_name, note: "", relationship: request.relationship },
      requestId
    );
  }

  await sql`
    update alternate_contact_requests set status = ${decision === "approve" ? "approved" : "denied"},
      decided_by_user_id = ${actingId(adminUser)}, decided_at = ${new Date()}, decision_note = ${note.trim().slice(0, 500)}
    where id = ${requestId}
  `;

  return { studentUserId: request.student_user_id };
}

/** An admin adds a contact directly (no request needed). */
export async function addAlternateContact(adminUser: AuthenticatedUser, input: ContactInput) {
  requireDatabase();

  if (!isAdmin(adminUser)) throw new MessageError("Only admins can add alternate contacts.", 403);

  const student = await loadStudentByEmail(input.studentEmail);
  const contactId = await insertContact(adminUser, student.id, cleanContact(input), null);

  return { contactId, studentName: student.name };
}

export async function removeAlternateContact(adminUser: AuthenticatedUser, contactId: string) {
  requireDatabase();

  if (!isAdmin(adminUser)) throw new MessageError("Only admins can remove alternate contacts.", 403);

  const removed = await getSql()`
    update student_alternate_contacts set removed_at = ${new Date()}, removed_by_user_id = ${adminUser.id}
    where id = ${contactId} and removed_at is null returning id
  `;

  if (removed.length === 0) throw new MessageError("That contact was already removed.", 404);
}

/** Admins see all contacts; teachers see their students'; a student sees their own. */
export async function listAlternateContacts(user: AuthenticatedUser) {
  requireDatabase();

  const sql = getSql();
  const classes = isAdmin(user) ? [] : user.classNames;
  const rows = await sql<
    Array<{ contact_email: string; contact_name: string; id: string; relationship: string; student_email: string; student_id: string; student_name: string }>
  >`
    select c.id, c.student_user_id as student_id, c.contact_name, c.contact_email, c.relationship,
      s.email as student_email, s.first_name || ' ' || s.last_name as student_name
    from student_alternate_contacts c join app_users s on s.id = c.student_user_id
    where c.removed_at is null and (
      ${isAdmin(user)}
      or c.student_user_id = ${user.id}
      or (${user.role === "Teacher"} and exists (
        select 1 from role_assignments ra where ra.user_id = c.student_user_id and ra.role = 'Student' and ra.scope = any(${classes})
      ))
    )
    order by s.last_name, s.first_name, c.contact_name
    limit 500
  `;

  return rows.map((row) => ({
    contactEmail: row.contact_email,
    contactName: row.contact_name,
    id: row.id,
    relationship: row.relationship,
    studentEmail: row.student_email,
    studentName: row.student_name.trim(),
  }));
}

// -------------------------------------------------------------------- cleanup

/**
 * Permanently deletes messages older than 90 days that nobody kept and that
 * have no unresolved flag, then empty old one-to-one conversations.
 */
export async function runMessageCleanup(now = new Date()) {
  requireDatabase();

  const sql = getSql();
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  let deletedMessages = 0;

  for (let round = 0; round < 40; round += 1) {
    const batch = await sql<Array<{ id: string }>>`
      select m.id from messages m
      where m.created_at < ${cutoff}
        and not exists (select 1 from message_keeps k where k.message_id = m.id)
        and not exists (select 1 from message_flags f where f.message_id = m.id and f.status <> 'resolved')
      limit 2000
    `;

    if (batch.length === 0) break;

    const ids = batch.map((row) => row.id);

    await sql.begin(async (tx) => {
      await tx`delete from message_flag_forwards where flag_id in (select id from message_flags where message_id = any(${ids}))`;
      await tx`delete from message_flags where message_id = any(${ids})`;
      await tx`delete from messages where id = any(${ids})`;
    });
    deletedMessages += ids.length;
  }

  const emptied = await sql.begin(async (tx) => {
    const empty = await tx<Array<{ id: string }>>`
      select c.id from conversations c
      where c.kind = 'direct' and c.created_at < ${cutoff}
        and not exists (select 1 from messages m where m.conversation_id = c.id)
    `;
    const ids = empty.map((row) => row.id);

    if (ids.length) {
      await tx`delete from conversation_participants where conversation_id = any(${ids})`;
      await tx`delete from conversations where id = any(${ids})`;
    }

    return ids.length;
  });

  return { deletedConversations: emptied, deletedMessages };
}

let lastCleanupCheck = 0;

/**
 * Runs the cleanup at most once a day, on whichever instance asks first. (A
 * database row decides, so several instances don't all run it.)
 */
export async function maybeRunDailyCleanup() {
  const nowMs = Date.now();

  if (!hasProductionDatabase() || nowMs - lastCleanupCheck < 60 * 60 * 1000) return null;
  lastCleanupCheck = nowMs;

  try {
    const sql = getSql();
    const now = new Date();
    const claimed = await sql<Array<{ name: string }>>`
      insert into maintenance_runs (name, last_run_at) values ('message_cleanup', ${now})
      on conflict (name) do update set last_run_at = excluded.last_run_at
        where maintenance_runs.last_run_at < ${new Date(nowMs - 23 * 60 * 60 * 1000)}
      returning name
    `;

    if (claimed.length === 0) return null;

    const result = await runMessageCleanup(now);
    await sql`update maintenance_runs set details = ${JSON.stringify(result)} where name = 'message_cleanup'`;
    return result;
  } catch (error) {
    console.error("Message cleanup failed.", error);
    return null;
  }
}

export function messageErrorResponse(error: unknown) {
  if (error instanceof MessageError) {
    return Response.json({ message: error.message, ok: false }, { status: error.status });
  }

  console.error("Message request failed.", error);
  return Response.json({ message: "The message request could not be completed.", ok: false }, { status: 500 });
}
