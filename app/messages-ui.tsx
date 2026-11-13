"use client";

import { MessageCircle, Send, ShieldCheck, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// v0.2.10: saved messages. Everything here talks to /api/messages and friends;
// the server decides who can message whom and filters language.

type Msg = {
  actingAdminName: string | null;
  body: string;
  createdAt: string;
  flagStatus: string | null;
  id: string;
  keepCount: number;
  keptByMe: boolean;
  mine: boolean;
  senderName: string;
  senderRole: string;
};

type Conv = {
  className: string | null;
  id: string;
  kind: "direct" | "room";
  messages: Msg[];
  participants: string;
  readOnly: boolean;
  title: string;
  unread: number;
};

type Contact = { classNames: string[]; email: string; name: string; role: string };

type ApiResult = { message?: string; ok?: boolean } & Record<string, unknown>;

async function api(url: string, body?: unknown): Promise<ApiResult> {
  const response = await fetch(url, {
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    method: body === undefined ? "GET" : "POST",
  });
  const result = (await response.json().catch(() => ({}))) as ApiResult;

  if (!response.ok) throw new Error(result.message ?? "That didn't work. Please try again.");
  return result;
}

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { day: "numeric", hour: "numeric", minute: "2-digit", month: "short" });

const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

// ---------------------------------------------------------------- Inbox / rooms

export function MessagesPanel({
  classNames,
  kind,
  onUnread,
  role,
  startWithEmail,
  onStartHandled,
}: {
  classNames: string[];
  kind: "direct" | "room";
  onStartHandled?: () => void;
  onUnread?: (count: number) => void;
  role: string;
  startWithEmail?: string;
}) {
  const staff = role === "Teacher" || role === "Admin";
  const [view, setView] = useState<"mine" | "oversight">("mine");
  const [conversations, setConversations] = useState<Conv[] | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState("");
  const [warning, setWarning] = useState("");
  const [notice, setNotice] = useState("");
  const [contacts, setContacts] = useState<Contact[] | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [contactsError, setContactsError] = useState("");
  const [recipient, setRecipient] = useState("");
  const [roomClass, setRoomClass] = useState(classNames[0] ?? "");
  const [roomTitle, setRoomTitle] = useState("");
  const [flagging, setFlagging] = useState("");
  const [flagReason, setFlagReason] = useState("");
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;
    const query = kind === "room" ? "rooms" : view;

    api(`/api/messages?view=${query}`)
      .then((result) => {
        if (cancelled) return;
        const list = (result.conversations as Conv[]) ?? [];
        setConversations(list);
        setSelectedId((current) => (list.some((item) => item.id === current) ? current : list[0]?.id ?? ""));
        if (view === "mine" || kind === "room") {
          onUnread?.(list.reduce((total, item) => total + item.unread, 0));
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setConversations([]);
          setNotice(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [kind, onUnread, tick, view]);

  // Poll for new messages every 30 seconds.
  useEffect(() => {
    const timer = window.setInterval(refresh, 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const selected = conversations?.find((item) => item.id === selectedId) ?? null;
  const selectedUnread = selected?.unread ?? 0;

  useEffect(() => {
    if (!selectedId || selectedUnread === 0 || view === "oversight") return;
    api("/api/messages", { action: "read", conversationId: selectedId }).then(refresh, () => undefined);
  }, [refresh, selectedId, selectedUnread, view]);

  const loadContacts = useCallback(async () => {
    if (contacts) return contacts;
    const result = await api("/api/messages?view=contacts");
    const list = (result.contacts as Contact[]) ?? [];
    setContacts(list);
    return list;
  }, [contacts]);

  const startConversation = useCallback(
    async (email: string) => {
      setNotice("");
      try {
        const result = await api("/api/messages", { action: "start", recipientEmail: email });
        setView("mine");
        setSelectedId(String(result.conversationId));
        setPickerOpen(false);
        setRecipient("");
        refresh();
      } catch (error) {
        setNotice((error as Error).message);
      }
    },
    [refresh]
  );

  // "Message" buttons elsewhere in the app hand us an email to start with.
  useEffect(() => {
    if (kind !== "direct" || !startWithEmail) return;
    onStartHandled?.();
    queueMicrotask(() => void startConversation(startWithEmail));
  }, [kind, onStartHandled, startConversation, startWithEmail]);

  async function send() {
    if (!selected || !draft.trim()) return;
    setWarning("");
    try {
      const result = await api("/api/messages", { action: "send", body: draft, conversationId: selected.id });
      setDraft("");
      if (result.flagged) setNotice("Sent. Because of what it mentions, your teacher was also notified.");
      refresh();
    } catch (error) {
      setWarning((error as Error).message);
    }
  }

  async function toggleKeep(message: Msg) {
    try {
      await api("/api/messages", { action: "keep", keep: !message.keptByMe, messageId: message.id });
      refresh();
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  async function submitFlag(messageId: string) {
    try {
      await api("/api/messages", { action: "flag", messageId, reason: flagReason });
      setFlagging("");
      setFlagReason("");
      setNotice("Flagged. Your teacher will review it.");
      refresh();
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  async function createRoom() {
    try {
      await api("/api/messages", { action: "createRoom", className: roomClass, title: roomTitle });
      setRoomTitle("");
      setNotice("Room created.");
      refresh();
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  // Students first for staff; teachers first for students.
  const groupOrder = staff ? ["Student", "Teacher", "Admin"] : ["Teacher", "Student", "Admin"];
  const grouped = (contacts ?? []).reduce<Record<string, Contact[]>>((groups, contact) => {
    (groups[contact.role] ??= []).push(contact);
    return groups;
  }, {});

  return (
    <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]" data-testid={kind === "room" ? "rooms-panel" : "inbox-panel"}>
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">
              {kind === "room" ? "Discussion rooms" : view === "oversight" ? "Student conversations" : "Inbox"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {kind === "room"
                ? "Shared rooms for your classes."
                : view === "oversight"
                  ? "Read-only view of your students' conversations."
                  : "Your saved messages."}
            </p>
          </div>
          <MessageCircle className="size-5 text-muted-foreground" />
        </div>

        {kind === "direct" && staff ? (
          <div className="mb-3 flex gap-2">
            <Button type="button" size="sm" variant={view === "mine" ? "default" : "outline"} onClick={() => setView("mine")}>
              My messages
            </Button>
            <Button type="button" size="sm" variant={view === "oversight" ? "default" : "outline"} onClick={() => setView("oversight")}>
              Student conversations
            </Button>
          </div>
        ) : null}

        {kind === "direct" && view === "mine" ? (
          <div className="mb-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setPickerOpen((open) => !open);
                setContactsError("");
                void loadContacts().catch((error: Error) => setContactsError(error.message));
              }}
            >
              New message
            </Button>
            {pickerOpen ? (
              <div className="mt-3 space-y-2">
                <Label htmlFor="new-message-recipient">Send to</Label>
                <select
                  id="new-message-recipient"
                  className={selectClass}
                  value={recipient}
                  disabled={contacts === null || contacts.length === 0}
                  onChange={(event) => setRecipient(event.target.value)}
                >
                  <option value="">
                    {contacts === null
                      ? contactsError
                        ? "Couldn't load people"
                        : "Loading people…"
                      : contacts.length === 0
                        ? "No one to message yet"
                        : "Choose a person…"}
                  </option>
                  {groupOrder
                    .filter((groupRole) => grouped[groupRole]?.length)
                    .map((groupRole) => (
                      <optgroup key={groupRole} label={`${groupRole}s`}>
                        {grouped[groupRole].map((person) => (
                          <option key={person.email} value={person.email}>
                            {person.name}
                            {person.role === "Student" && person.classNames.length ? ` (${person.classNames.join(", ")})` : ""}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                </select>
                {contactsError ? (
                  <p role="alert" className="text-sm text-[#8a3025]">
                    {contactsError} Close this and choose New message to try again.
                  </p>
                ) : null}
                {contacts?.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {role === "Student"
                      ? "You can message your teachers and classmates once you are in a class."
                      : "There is nobody you can message yet."}
                  </p>
                ) : null}
                <Button type="button" size="sm" disabled={!recipient} onClick={() => void startConversation(recipient)}>
                  Start conversation
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}

        {kind === "room" && staff ? (
          <div className="mb-4 space-y-2 rounded-lg border border-border bg-background p-3">
            <p className="text-sm font-medium">New discussion room</p>
            <select aria-label="Class for new room" className={selectClass} value={roomClass} onChange={(event) => setRoomClass(event.target.value)}>
              {classNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <Input aria-label="Room title" placeholder="Room title" value={roomTitle} onChange={(event) => setRoomTitle(event.target.value)} />
            <Button type="button" size="sm" disabled={!roomTitle.trim() || !roomClass} onClick={() => void createRoom()}>
              Create room
            </Button>
          </div>
        ) : null}

        <div className="space-y-3">
          {conversations === null ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
          {conversations?.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {kind === "room" ? "No discussion rooms yet." : "No conversations yet. Choose New message to start one."}
            </p>
          ) : null}
          {conversations?.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => {
                setSelectedId(conversation.id);
                setWarning("");
              }}
              className={`w-full rounded-lg border p-4 text-left transition ${
                selectedId === conversation.id ? "border-[#28666e] bg-[#e8f0ed]" : "border-border bg-background hover:bg-muted/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{conversation.title}</p>
                  {conversation.className ? <p className="mt-1 text-sm text-muted-foreground">{conversation.className}</p> : null}
                </div>
                {conversation.unread > 0 ? (
                  <span className="rounded-md bg-[#28666e] px-2 py-1 text-xs font-semibold text-white">{conversation.unread} new</span>
                ) : null}
              </div>
              <p className="mt-2 truncate text-sm text-muted-foreground">{conversation.messages.at(-1)?.body ?? "No messages yet."}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-sm">
        {selected ? (
          <>
            <div className="border-b border-border p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selected.title}</h3>
                  {selected.className ? <p className="mt-1 text-sm text-muted-foreground">{selected.className}</p> : null}
                </div>
                <Badge className="rounded-md bg-[#fff3da] text-[#7a4b00] hover:bg-[#fff3da]">
                  {selected.readOnly ? "Read only" : selected.kind === "room" ? "Classroom room" : "Direct message"}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Messages are deleted after 90 days unless someone ticks Keep.
                {selected.kind === "direct" ? " Teachers can read their students&apos; conversations." : ""}
              </p>
            </div>

            <div className="max-h-[430px] space-y-4 overflow-y-auto p-4 sm:p-5">
              {selected.messages.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p> : null}
              {selected.messages.map((message) => (
                <article
                  key={message.id}
                  data-testid="message"
                  className={`max-w-[82%] rounded-lg border p-4 ${message.mine ? "ml-auto border-[#28666e]/20 bg-[#e8f0ed]" : "border-border bg-background"}`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{message.senderName}</span>
                    <Badge variant="outline" className="rounded-md bg-card">{message.senderRole}</Badge>
                    <span className="text-xs text-muted-foreground">{when(message.createdAt)}</span>
                    {message.actingAdminName ? (
                      <Badge variant="outline" className="rounded-md bg-card">Sent by admin {message.actingAdminName}</Badge>
                    ) : null}
                    {message.flagStatus && message.flagStatus !== "resolved" ? (
                      <Badge className="rounded-md bg-[#fff0ed] text-[#8a3025] hover:bg-[#fff0ed]">Flagged</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm leading-6">{message.body}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={message.keptByMe} onChange={() => void toggleKeep(message)} />
                      Keep{message.keepCount > 0 ? ` (${message.keepCount})` : ""}
                    </label>
                    <button type="button" className="underline" onClick={() => setFlagging(flagging === message.id ? "" : message.id)}>
                      Flag
                    </button>
                  </div>
                  {flagging === message.id ? (
                    <div className="mt-2 flex gap-2">
                      <Input aria-label="Why are you flagging this?" placeholder="Why are you flagging this?" value={flagReason} onChange={(event) => setFlagReason(event.target.value)} />
                      <Button type="button" size="sm" onClick={() => void submitFlag(message.id)}>Send flag</Button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>

            {selected.readOnly ? (
              <p className="border-t border-border p-4 text-sm text-muted-foreground sm:p-5">
                You&apos;re viewing this conversation as a teacher or admin. You can flag a message, but not reply.
              </p>
            ) : (
              <div className="border-t border-border p-4 sm:p-5">
                {warning ? (
                  <div role="alert" className="mb-3 flex items-start gap-2 rounded-lg border border-[#c44536]/30 bg-[#fff0ed] p-3 text-sm text-[#8a3025]">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>{warning}</span>
                  </div>
                ) : null}
                <Label htmlFor={`composer-${kind}`}>Message</Label>
                <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                  <Textarea
                    id={`composer-${kind}`}
                    value={draft}
                    maxLength={1000}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      if (warning) setWarning("");
                    }}
                    placeholder="Write a respectful classroom message..."
                    className="min-h-20 resize-none"
                  />
                  <Button type="button" onClick={() => void send()} className="h-full min-h-11 bg-[#28666e] text-white hover:bg-[#22565d]">
                    <Send className="size-4" aria-hidden="true" />
                    Send
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  Messages are text only and checked before sending.
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="p-6 text-sm text-muted-foreground">
            {conversations === null ? "Loading…" : "Choose a conversation to read it."}
          </p>
        )}
        {notice ? <p role="status" className="border-t border-border p-4 text-sm text-[#28666e]">{notice}</p> : null}
      </div>
    </section>
  );
}

// ------------------------------------------------------------- Flagged messages

type Flag = {
  body: string;
  className: string | null;
  context: Array<{ body: string; senderName: string }>;
  createdAt: string;
  flaggedBy: string;
  forwards: Array<{ at: string; to: string }>;
  handledBy: string | null;
  handledNote: string;
  id: string;
  reason: string;
  senderName: string;
  status: string;
};

type AltContact = { contactEmail: string; contactName: string; id: string; relationship: string; studentEmail: string; studentName: string };
type ContactRequest = {
  contactEmail: string; contactName: string; createdAt: string; id: string; relationship: string;
  requestedBy: string; status: string; studentEmail: string; studentName: string;
};

export function FlaggedMessagesPanel({ role }: { role: string }) {
  const isAdminView = role === "Admin";
  const [flags, setFlags] = useState<Flag[] | null>(null);
  const [contacts, setContacts] = useState<AltContact[]>([]);
  const [notice, setNotice] = useState("");
  const [forwardingId, setForwardingId] = useState("");
  const [target, setTarget] = useState<"admins" | "email" | "alternate_contact">("admins");
  const [email, setEmail] = useState("");
  const [contactId, setContactId] = useState("");
  const [note, setNote] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([api("/api/messages/flags"), api("/api/alternate-contacts")])
      .then(([flagResult, contactResult]) => {
        if (cancelled) return;
        setFlags((flagResult.flags as Flag[]) ?? []);
        setContacts((contactResult.contacts as AltContact[]) ?? []);
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setFlags([]);
          setNotice(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  async function act(body: Record<string, unknown>, success: string) {
    setNotice("");
    try {
      await api("/api/messages/flags", body);
      setNotice(success);
      setForwardingId("");
      setEmail("");
      setNote("");
      setTick((value) => value + 1);
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  const open = (flags ?? []).filter((flag) => flag.status !== "resolved");

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5" data-testid="flagged-messages">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Flagged messages</h3>
          <p className="text-sm text-muted-foreground">
            {isAdminView
              ? "Flags teachers forwarded to admins."
              : "Messages flagged in your students' conversations. Review them, then resolve or forward."}
          </p>
        </div>
        <Badge variant="outline" className="rounded-md bg-background">{open.length} open</Badge>
      </div>

      {flags === null ? <p className="text-sm text-muted-foreground">Loading…</p> : null}
      {flags?.length === 0 ? <p className="text-sm text-muted-foreground">Nothing is flagged right now.</p> : null}

      <div className="space-y-3">
        {flags?.map((flag) => (
          <div key={flag.id} data-testid="flag" className="rounded-lg border border-border bg-background p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{flag.senderName}</span>
              {flag.className ? <Badge variant="outline" className="rounded-md bg-card">{flag.className}</Badge> : null}
              <Badge variant="outline" className="rounded-md bg-card capitalize">{flag.status}</Badge>
              <span className="text-xs text-muted-foreground">{when(flag.createdAt)}</span>
            </div>
            {flag.context.map((line, index) => (
              <p key={index} className="mt-2 text-xs text-muted-foreground">{line.senderName}: {line.body}</p>
            ))}
            <p className="mt-2 rounded-md bg-card p-3 text-sm leading-6">{flag.body}</p>
            <p className="mt-2 text-xs text-muted-foreground">Why: {flag.reason} · Flagged by {flag.flaggedBy}</p>
            {flag.forwards.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">Forwarded to: {flag.forwards.map((item) => item.to).join(", ")}</p>
            ) : null}
            {flag.status === "resolved" ? (
              <p className="mt-1 text-xs text-muted-foreground">Resolved by {flag.handledBy}{flag.handledNote ? `: ${flag.handledNote}` : ""}</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void act({ action: "resolve", flagId: flag.id, note }, "Flag resolved.")}>
                  Resolve
                </Button>
                {!isAdminView ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => setForwardingId(forwardingId === flag.id ? "" : flag.id)}>
                    Forward…
                  </Button>
                ) : null}
              </div>
            )}
            {forwardingId === flag.id ? (
              <div className="mt-3 space-y-2 rounded-lg border border-border bg-card p-3">
                <Label htmlFor={`forward-${flag.id}`}>Forward to</Label>
                <select id={`forward-${flag.id}`} className={selectClass} value={target} onChange={(event) => setTarget(event.target.value as typeof target)}>
                  <option value="admins">Admins</option>
                  <option value="alternate_contact">A parent or guardian on file</option>
                  <option value="email">An email address on the allowed list</option>
                </select>
                {target === "email" ? (
                  <Input aria-label="Email address" type="email" placeholder="name@district.org" value={email} onChange={(event) => setEmail(event.target.value)} />
                ) : null}
                {target === "alternate_contact" ? (
                  <select aria-label="Parent or guardian" className={selectClass} value={contactId} onChange={(event) => setContactId(event.target.value)}>
                    <option value="">Choose a contact…</option>
                    {contacts.map((contact) => (
                      <option key={contact.id} value={contact.id}>
                        {contact.contactName} ({contact.relationship || "contact"} of {contact.studentName})
                      </option>
                    ))}
                  </select>
                ) : null}
                <Input aria-label="Note" placeholder="Optional note" value={note} onChange={(event) => setNote(event.target.value)} />
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    void act({ action: "forward", contactId, email, flagId: flag.id, note, to: target }, "Forwarded. The flag stays open until you resolve it.")
                  }
                >
                  Send
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {notice ? <p role="status" className="mt-3 text-sm text-[#28666e]">{notice}</p> : null}
    </section>
  );
}

// -------------------------------------------- Parent contact requests (teacher)

export function ParentContactRequestPanel() {
  const [studentEmail, setStudentEmail] = useState("");
  const [name, setName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [notice, setNotice] = useState("");
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api("/api/alternate-contacts")
      .then((result) => {
        if (!cancelled) setRequests((result.requests as ContactRequest[]) ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [tick]);

  async function submit() {
    setNotice("");
    try {
      const result = await api("/api/alternate-contacts", { action: "request", email, name, note, relationship, studentEmail });
      setNotice(`Sent to the admins to add to ${String(result.studentName)}'s profile.`);
      setName("");
      setEmail("");
      setNote("");
      setRelationship("");
      setTick((value) => value + 1);
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5" data-testid="parent-contact-request">
      <h3 className="text-lg font-semibold">Parent or guardian email</h3>
      <p className="text-sm text-muted-foreground">
        Got a parent&apos;s email? Send it to the admins to add to the student&apos;s profile as an alternate contact.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input aria-label="Student email" placeholder="Student's email" value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)} />
        <Input aria-label="Parent or guardian name" placeholder="Parent or guardian name" value={name} onChange={(event) => setName(event.target.value)} />
        <Input aria-label="Parent or guardian email" type="email" placeholder="Parent or guardian email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input aria-label="Relationship" placeholder="Relationship (e.g. mother)" value={relationship} onChange={(event) => setRelationship(event.target.value)} />
        <Input aria-label="Note for the admins" className="sm:col-span-2" placeholder="Note for the admins (optional)" value={note} onChange={(event) => setNote(event.target.value)} />
      </div>
      <Button type="button" className="mt-3" onClick={() => void submit()}>Send to admins</Button>
      {notice ? <p role="status" className="mt-3 text-sm text-[#28666e]">{notice}</p> : null}
      {requests.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm">
          {requests.slice(0, 8).map((request) => (
            <li key={request.id} className="flex flex-wrap items-center gap-2">
              <span>{request.contactName} for {request.studentName}</span>
              <Badge variant="outline" className="rounded-md capitalize">{request.status}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

// ------------------------------------------------------------ Admin Messaging

export function AdminMessagingPage() {
  const [domains, setDomains] = useState<Array<{ domain: string }>>([]);
  const [newDomain, setNewDomain] = useState("");
  const [requests, setRequests] = useState<ContactRequest[]>([]);
  const [contacts, setContacts] = useState<AltContact[]>([]);
  const [addStudent, setAddStudent] = useState("");
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addRelationship, setAddRelationship] = useState("");
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(0);
  const reload = () => setTick((value) => value + 1);

  useEffect(() => {
    let cancelled = false;

    Promise.all([api("/api/admin/email-domains"), api("/api/alternate-contacts")])
      .then(([domainResult, contactResult]) => {
        if (cancelled) return;
        setDomains((domainResult.domains as Array<{ domain: string }>) ?? []);
        setRequests((contactResult.requests as ContactRequest[]) ?? []);
        setContacts((contactResult.contacts as AltContact[]) ?? []);
      })
      .catch((error: Error) => {
        if (!cancelled) setNotice(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  async function run(url: string, body: Record<string, unknown>, success: string) {
    setNotice("");
    try {
      await api(url, body);
      setNotice(success);
      reload();
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  async function cleanup() {
    setNotice("");
    try {
      const result = await api("/api/admin/message-cleanup", {});
      setNotice(`Cleanup done: ${String(result.deletedMessages)} old message(s) removed.`);
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  const pending = requests.filter((request) => request.status === "pending");

  return (
    <div className="space-y-6" data-testid="admin-messaging">
      <FlaggedMessagesPanel role="Admin" />

      <section className="rounded-lg border border-border bg-background p-4 sm:p-5">
        <h4 className="text-lg font-semibold">Allowed email domains</h4>
        <p className="text-sm text-muted-foreground">
          Teachers can forward a flagged message by email only to addresses on these domains (or to a parent on file).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {domains.length === 0 ? <span className="text-sm text-muted-foreground">No domains yet.</span> : null}
          {domains.map((item) => (
            <Badge key={item.domain} variant="outline" className="gap-2 rounded-md bg-card">
              {item.domain}
              <button type="button" aria-label={`Remove ${item.domain}`} onClick={() => void run("/api/admin/email-domains", { action: "remove", domain: item.domain }, `${item.domain} removed.`)}>×</button>
            </Badge>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input aria-label="Domain to allow" placeholder="district.org" value={newDomain} onChange={(event) => setNewDomain(event.target.value)} />
          <Button type="button" onClick={() => { void run("/api/admin/email-domains", { action: "add", domain: newDomain }, "Domain added."); setNewDomain(""); }}>
            Add domain
          </Button>
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background p-4 sm:p-5">
        <h4 className="text-lg font-semibold">Alternate contact requests</h4>
        <p className="text-sm text-muted-foreground">Teachers send parent or guardian emails here to be added to a student&apos;s profile.</p>
        {pending.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">No pending requests.</p> : null}
        <div className="mt-3 space-y-3">
          {pending.map((request) => (
            <div key={request.id} data-testid="contact-request" className="rounded-lg border border-border bg-card p-3 text-sm">
              <p className="font-medium">{request.contactName} ({request.relationship || "contact"}) · {request.contactEmail}</p>
              <p className="text-muted-foreground">For {request.studentName} · requested by {request.requestedBy}</p>
              <div className="mt-2 flex gap-2">
                <Button type="button" size="sm" onClick={() => void run("/api/alternate-contacts", { action: "approve", requestId: request.id }, "Added to the student's profile.")}>Approve</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => void run("/api/alternate-contacts", { action: "deny", requestId: request.id }, "Request denied.")}>Deny</Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-background p-4 sm:p-5">
        <h4 className="text-lg font-semibold">Alternate contacts on file</h4>
        <ul className="mt-3 space-y-2 text-sm" data-testid="alternate-contacts">
          {contacts.length === 0 ? <li className="text-muted-foreground">None yet.</li> : null}
          {contacts.map((contact) => (
            <li key={contact.id} className="flex flex-wrap items-center justify-between gap-2">
              <span>{contact.studentName}: {contact.contactName} ({contact.relationship || "contact"}) · {contact.contactEmail}</span>
              <Button type="button" size="sm" variant="outline" onClick={() => void run("/api/alternate-contacts", { action: "remove", contactId: contact.id }, "Contact removed.")}>Remove</Button>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input aria-label="Student email for new contact" placeholder="Student's email" value={addStudent} onChange={(event) => setAddStudent(event.target.value)} />
          <Input aria-label="New contact name" placeholder="Contact name" value={addName} onChange={(event) => setAddName(event.target.value)} />
          <Input aria-label="New contact email" type="email" placeholder="Contact email" value={addEmail} onChange={(event) => setAddEmail(event.target.value)} />
          <Input aria-label="New contact relationship" placeholder="Relationship" value={addRelationship} onChange={(event) => setAddRelationship(event.target.value)} />
        </div>
        <Button type="button" className="mt-3" onClick={() => void run("/api/alternate-contacts", { action: "add", email: addEmail, name: addName, relationship: addRelationship, studentEmail: addStudent }, "Contact added.")}>
          Add contact
        </Button>
      </section>

      <section className="rounded-lg border border-border bg-background p-4 sm:p-5">
        <h4 className="text-lg font-semibold">90-day cleanup</h4>
        <p className="text-sm text-muted-foreground">
          Runs by itself once a day. It permanently removes messages older than 90 days that nobody ticked Keep on and that have no open flag.
        </p>
        <Button type="button" variant="outline" className="mt-3" onClick={() => void cleanup()}>Run cleanup now</Button>
      </section>

      {notice ? <p role="status" className="text-sm text-[#28666e]">{notice}</p> : null}
    </div>
  );
}
