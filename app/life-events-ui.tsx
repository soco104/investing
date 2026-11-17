"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LifeEventCard } from "@/lib/life-events";

// v0.2.17: life event cards. LifeEventsPanel is the teacher/admin control;
// StudentLifeEvents is what a student sees on their Market page.

const money = (cents: number) => `${cents < 0 ? "-" : ""}$${(Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { day: "numeric", hour: "numeric", minute: "2-digit", month: "short" });
const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

type Hit = { amountCents: number; capped: boolean; cashAfterCents: number; cashBeforeCents: number; email: string; name: string };
type Preview = { card: { kind: string; percentOfStartingCash: number; title: string }; debtAllowed: boolean; gradeLevel: number | null; hits: Hit[] };
type PastEvent = {
  className: string; hitCount: number; id: string; kind: string; percentOfStartingCash: number; playedAt: string;
  playedBy: string; students: string; targetType: string; title: string; totalCents: number; undoneAt: string | null;
};

async function api(body?: Record<string, unknown>, query = "") {
  const response = await fetch(`/api/teacher/life-events${query}`, {
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    method: body ? "POST" : "GET",
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string } & Record<string, unknown>;

  if (!response.ok) throw new Error(result.message ?? "That didn't work. Please try again.");
  return result;
}

export function LifeEventsPanel({ onChanged }: { onChanged: () => void }) {
  const [classes, setClasses] = useState<string[]>([]);
  const [deck, setDeck] = useState<LifeEventCard[]>([]);
  const [events, setEvents] = useState<PastEvent[]>([]);
  const [className, setClassName] = useState("");
  const [cardId, setCardId] = useState("");
  const [custom, setCustom] = useState({ description: "", kind: "expense", percent: "5", title: "" });
  const [targetType, setTargetType] = useState<"class" | "random" | "student">("class");
  const [randomCount, setRandomCount] = useState("3");
  const [studentEmail, setStudentEmail] = useState("");
  const [students, setStudents] = useState<Array<{ email: string; name: string }>>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [seed, setSeed] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((value) => value + 1), []);

  useEffect(() => {
    let cancelled = false;

    api(undefined, className ? `?className=${encodeURIComponent(className)}` : "")
      .then((result) => {
        if (cancelled) return;
        const list = (result.classes as string[]) ?? [];
        setClasses(list);
        setDeck((result.deck as LifeEventCard[]) ?? []);
        setEvents((result.events as PastEvent[]) ?? []);
        setClassName((current) => current || list[0] || "");
      })
      .catch((error: Error) => {
        if (!cancelled) setNotice(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [className, tick]);

  // The class's students, for "One student" (from the teacher market view).
  useEffect(() => {
    if (!className) return;

    let cancelled = false;

    fetch(`/api/teacher/market?className=${encodeURIComponent(className)}`, { credentials: "same-origin" })
      .then(async (response) => {
        const result = (await response.json()) as { students?: Array<{ email: string; name: string }> };
        if (!cancelled) setStudents(result.students ?? []);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [className]);

  const card = deck.find((item) => item.id === cardId) ?? null;

  function choice() {
    if (cardId !== "custom") return { cardId };

    return {
      description: custom.description,
      kind: custom.kind,
      percentOfStartingCash: Number(custom.percent),
      title: custom.title,
    };
  }

  function target() {
    if (targetType === "random") return { count: Number(randomCount), type: "random" };
    if (targetType === "student") return { studentEmail, type: "student" };
    return { type: "class" };
  }

  async function run(action: "preview" | "play") {
    if (!className || !cardId) {
      setNotice("Choose a class and a card first.");
      return;
    }

    setPending(true);
    setNotice("");

    try {
      // The same seed for preview and play, so the random handful matches.
      const useSeed = action === "preview" || !seed ? `${Date.now()}` : seed;

      if (action === "preview") setSeed(useSeed);

      const result = await api({ action, choice: choice(), className, seed: useSeed, target: target() });

      if (action === "preview") {
        setPreview(result as unknown as Preview);
      } else {
        const hits = result.hits as Hit[];
        setPreview(null);
        setSeed("");
        setNotice(`Played "${String((result.card as { title: string }).title)}" for ${hits.length} student${hits.length === 1 ? "" : "s"}. Undo is below if you need it.`);
        refresh();
        onChanged();
      }
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function undo(event: PastEvent) {
    setPending(true);
    setNotice("");
    try {
      await api({ action: "undo", eventId: event.id });
      setNotice(`Undid "${event.title}". Every student's cash is back where it was.`);
      refresh();
      onChanged();
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  const expenses = deck.filter((item) => item.kind === "expense");
  const windfalls = deck.filter((item) => item.kind === "windfall");

  return (
    <section aria-label="Life events" className="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5" data-testid="life-events">
      <div className="mb-4">
        <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold">
          Life events
          <Badge variant="outline" className="rounded-md">Teachers and admins only</Badge>
        </h3>
        <p className="text-sm text-muted-foreground">
          Throw a wrench into students&apos; finances: a surprise bill or a windfall that changes their cash. Amounts are a
          percent of each student&apos;s starting cash. Grades 9-12 can go into debt; younger grades stop at $0.
        </p>
      </div>

      {classes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No classes with teacher market controls yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="life-event-class">Class</Label>
            <select
              id="life-event-class"
              className={selectClass}
              value={className}
              onChange={(event) => {
                setClassName(event.target.value);
                setPreview(null);
              }}
            >
              {classes.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="life-event-card">Card</Label>
            <select
              id="life-event-card"
              className={selectClass}
              value={cardId}
              onChange={(event) => {
                setCardId(event.target.value);
                setPreview(null);
              }}
            >
              <option value="">Choose a card…</option>
              <optgroup label="Expenses">
                {expenses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} (−{item.percentOfStartingCash}%)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Windfalls">
                {windfalls.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} (+{item.percentOfStartingCash}%)
                  </option>
                ))}
              </optgroup>
              <option value="custom">Write my own…</option>
            </select>
          </div>

          {card ? (
            <div className="rounded-md border border-border bg-background p-3 text-sm md:col-span-2" data-testid="card-details">
              <p className="font-medium">{card.title}</p>
              <p className="mt-1">{card.description}</p>
              <p className="mt-1 text-muted-foreground">Ask students: {card.prompt}</p>
            </div>
          ) : null}

          {cardId === "custom" ? (
            <div className="grid gap-3 rounded-md border border-border bg-background p-3 md:col-span-2 md:grid-cols-2">
              <Input aria-label="Event title" placeholder="Title" maxLength={80} value={custom.title} onChange={(event) => setCustom({ ...custom, title: event.target.value })} />
              <div className="flex gap-2">
                <select aria-label="Expense or windfall" className={selectClass} value={custom.kind} onChange={(event) => setCustom({ ...custom, kind: event.target.value })}>
                  <option value="expense">Expense (takes cash)</option>
                  <option value="windfall">Windfall (adds cash)</option>
                </select>
                <Input aria-label="Percent of starting cash" type="number" min={1} max={100} className="w-28" value={custom.percent} onChange={(event) => setCustom({ ...custom, percent: event.target.value })} />
                <span className="self-center text-sm text-muted-foreground">%</span>
              </div>
              <Textarea aria-label="Event description" className="md:col-span-2" rows={2} maxLength={400} placeholder="What happened, in the student's words" value={custom.description} onChange={(event) => setCustom({ ...custom, description: event.target.value })} />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="life-event-target">Who it hits</Label>
            <select
              id="life-event-target"
              className={selectClass}
              value={targetType}
              onChange={(event) => {
                setTargetType(event.target.value as typeof targetType);
                setPreview(null);
              }}
            >
              <option value="class">The whole class</option>
              <option value="random">A random handful</option>
              <option value="student">One student</option>
            </select>
          </div>

          {targetType === "random" ? (
            <div className="space-y-2">
              <Label htmlFor="life-event-count">How many students</Label>
              <Input id="life-event-count" type="number" min={1} max={50} value={randomCount} onChange={(event) => setRandomCount(event.target.value)} />
            </div>
          ) : null}
          {targetType === "student" ? (
            <div className="space-y-2">
              <Label htmlFor="life-event-student">Student</Label>
              <select id="life-event-student" className={selectClass} value={studentEmail} onChange={(event) => setStudentEmail(event.target.value)}>
                <option value="">Choose a student…</option>
                {students.map((student) => (
                  <option key={student.email} value={student.email}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button type="button" variant="outline" disabled={pending || !cardId} onClick={() => void run("preview")}>
              Preview
            </Button>
            <Button
              type="button"
              disabled={pending || !cardId || !preview}
              className="bg-[#28666e] text-white hover:bg-[#22565d]"
              onClick={() => void run("play")}
            >
              Play this card
            </Button>
            {!preview ? <span className="self-center text-xs text-muted-foreground">Preview first to see who is hit and by how much.</span> : null}
          </div>
        </div>
      )}

      {preview ? (
        <div className="mt-4 rounded-md border border-border bg-background p-3 text-sm" data-testid="life-event-preview">
          <p className="font-medium">
            Preview: {preview.card.title} ({preview.card.kind === "expense" ? "−" : "+"}{preview.card.percentOfStartingCash}% of starting cash) for{" "}
            {preview.hits.length} student{preview.hits.length === 1 ? "" : "s"}
            {preview.debtAllowed ? ". This class can go into debt." : ". This class stops at $0."}
          </p>
          <ul className="mt-2 grid gap-1 sm:grid-cols-2">
            {preview.hits.map((hit) => (
              <li key={hit.email} className="flex justify-between gap-3">
                <span>{hit.name}</span>
                <span className={hit.amountCents < 0 ? "text-[#c44536]" : "text-[#1f7a4d]"}>
                  {money(hit.amountCents)}
                  {hit.capped ? " (all they have)" : ""} → {money(hit.cashAfterCents)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {notice ? (
        <p role="status" className="mt-3 rounded-md bg-accent px-3 py-2 text-sm">{notice}</p>
      ) : null}

      <div className="mt-5">
        <h4 className="font-semibold">Played events</h4>
        {events.length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">Nothing played yet{className ? ` for ${className}` : ""}.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm" data-testid="played-events">
            {events.map((event) => (
              <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background p-3">
                <div>
                  <span className="font-medium">{event.title}</span>{" "}
                  <span className="text-muted-foreground">
                    · {event.kind === "expense" ? "−" : "+"}{event.percentOfStartingCash}% · {event.hitCount} student{event.hitCount === 1 ? "" : "s"} ({money(event.totalCents)} total)
                    · {when(event.playedAt)}{event.playedBy ? ` by ${event.playedBy}` : ""}
                  </span>
                  {event.students ? <p className="text-xs text-muted-foreground">{event.students}</p> : null}
                </div>
                {event.undoneAt ? (
                  <Badge variant="outline" className="rounded-md">Undone</Badge>
                ) : (
                  <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => void undo(event)}>
                    Undo
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export type StudentLifeEvent = {
  amountCents: number;
  capped: boolean;
  description: string;
  id: string;
  kind: string;
  playedAt: string;
  prompt: string;
  title: string;
  undone: boolean;
};

/** What a student sees: the life events that hit this portfolio. */
export function StudentLifeEvents({ events }: { events: StudentLifeEvent[] }) {
  const live = events.filter((event) => !event.undone);

  if (live.length === 0) return null;

  return (
    <section aria-label="Life events" className="rounded-lg border border-[#e0a100]/40 bg-[#fff3da] p-4 shadow-sm sm:p-5" data-testid="student-life-events">
      <h3 className="text-lg font-semibold">Life happens</h3>
      <p className="text-sm text-[#7a4b00]">Your teacher played these events on your finances.</p>
      <ul className="mt-3 space-y-3">
        {live.slice(0, 5).map((event) => (
          <li key={event.id} className="rounded-md border border-[#e0a100]/30 bg-card p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">{event.title}</span>
              <span className={`font-semibold ${event.amountCents < 0 ? "text-[#c44536]" : "text-[#1f7a4d]"}`}>
                {money(event.amountCents)}
                {event.capped ? " (all you had)" : ""}
              </span>
            </div>
            <p className="mt-1">{event.description}</p>
            {event.prompt ? <p className="mt-1 text-muted-foreground">Think about: {event.prompt}</p> : null}
            <p className="mt-1 text-xs text-muted-foreground">{when(event.playedAt)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
