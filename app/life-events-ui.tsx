"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LifeEventCard } from "@/lib/life-events";
import { comboPresets, difficultyLabels, marketTemplates, scalePercent, type Difficulty } from "@/lib/market-templates";
import type { StudentGradeReport } from "@/lib/quest-grading";

import { StatusBadge, StudentGradeReportCard } from "./quest-grading-ui";

// v0.2.17: life event cards. LifeEventsPanel is the teacher/admin control;
// StudentLifeEvents is what a student sees on their Market page.

const money = (cents: number) => `${cents < 0 ? "-" : ""}$${(Math.abs(cents) / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { day: "numeric", hour: "numeric", minute: "2-digit", month: "short" });
const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

type Hit = { amountCents: number; capped: boolean; cashAfterCents: number; cashBeforeCents: number; email: string; name: string };
type Preview = { card: { kind: string; percentOfStartingCash: number; title: string }; debtAllowed: boolean; gradeLevel: number | null; hits: Hit[] };
type PastEvent = {
  className: string;
  debrief: { dueAt: string | null; submitted: number; total: number } | null;
  hitCount: number; id: string; kind: string; percentOfStartingCash: number; playedAt: string;
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
  // Require a debrief (v0.2.18): off by default; due in three days.
  const [requireDebrief, setRequireDebrief] = useState(false);
  const [debriefDue, setDebriefDue] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  });
  const [openDebriefs, setOpenDebriefs] = useState("");
  // v0.2.19: difficulty preset for deck cards, and an optional market event
  // played with the card (a combo).
  const [difficulty, setDifficulty] = useState<Difficulty>("realistic");
  const [comboTemplate, setComboTemplate] = useState("");
  const [comboTicker, setComboTicker] = useState("");
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
    if (cardId !== "custom") return { cardId, difficulty };

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

      const result = await api({
        action,
        choice: choice(),
        className,
        debrief: action === "play" && requireDebrief ? { dueDate: debriefDue } : null,
        marketEvent: action === "play" && comboTemplate ? { difficulty, templateId: comboTemplate, ticker: comboTicker || null } : null,
        seed: useSeed,
        target: target(),
      });

      if (action === "preview") {
        setPreview(result as unknown as Preview);
      } else {
        const hits = result.hits as Hit[];
        setPreview(null);
        setSeed("");
        const debriefs = result.debriefs as { messagesSent: number } | null;
        const market = result.market as { applied: number } | null;
        setNotice(
          `Played "${String((result.card as { title: string }).title)}" for ${hits.length} student${hits.length === 1 ? "" : "s"}.` +
            (debriefs ? ` Debrief messages sent to ${debriefs.messagesSent} student${debriefs.messagesSent === 1 ? "" : "s"}.` : "") +
            (market ? ` The market event moved ${market.applied} symbol${market.applied === 1 ? "" : "s"} (undo it under Active changes).` : "") +
            " Undo is below if you need it."
        );
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

          <div className="flex flex-wrap items-end gap-3 md:col-span-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Surprise me: a random card from the deck.
                const pick = deck[Math.floor(Math.random() * deck.length)];
                if (pick) {
                  setCardId(pick.id);
                  setPreview(null);
                }
              }}
            >
              Surprise me
            </Button>
            <div className="space-y-2">
              <Label htmlFor="life-event-difficulty">Difficulty</Label>
              <select
                id="life-event-difficulty"
                className={selectClass}
                value={difficulty}
                onChange={(event) => {
                  setDifficulty(event.target.value as Difficulty);
                  setPreview(null);
                }}
              >
                {(Object.keys(difficultyLabels) as Difficulty[]).map((key) => (
                  <option key={key} value={key}>
                    {difficultyLabels[key]}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Combo presets">
              {comboPresets.map((combo) => (
                <Button
                  key={combo.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  title={combo.description}
                  onClick={() => {
                    setCardId(combo.cardId);
                    setComboTemplate(combo.templateId);
                    setPreview(null);
                  }}
                >
                  {combo.title}
                </Button>
              ))}
            </div>
          </div>

          {card ? (
            <div className="rounded-md border border-border bg-background p-3 text-sm md:col-span-2" data-testid="card-details">
              <p className="font-medium">
                {card.title} ({card.kind === "expense" ? "−" : "+"}
                {scalePercent(card.percentOfStartingCash, difficulty)}% of starting cash
                {difficulty !== "realistic" ? `, ${difficulty}` : ""})
              </p>
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

          <div className="grid gap-3 rounded-md border border-border bg-background p-3 md:col-span-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="life-event-combo">Also start a market event (combo)</Label>
              <select id="life-event-combo" className={selectClass} value={comboTemplate} onChange={(event) => setComboTemplate(event.target.value)}>
                <option value="">No market event</option>
                {marketTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </div>
            {marketTemplates.find((template) => template.id === comboTemplate)?.needsTicker ? (
              <div className="space-y-2">
                <Label htmlFor="life-event-combo-ticker">Company symbol</Label>
                <Input id="life-event-combo-ticker" placeholder="e.g. QQQ" value={comboTicker} onChange={(event) => setComboTicker(event.target.value.toUpperCase())} />
              </div>
            ) : null}
            {comboTemplate ? (
              <p className="text-xs text-muted-foreground md:col-span-2">
                The market event moves prices for the whole class at the same difficulty. Undo it under Active changes.
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-md border border-border bg-background p-3 md:col-span-2">
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={requireDebrief} onChange={(event) => setRequireDebrief(event.target.checked)} />
              <span>
                <span className="font-medium">Require a debrief report.</span> Each student gets an Inbox message about
                what happened to them and writes a short report you grade (10 points).
              </span>
            </label>
            {requireDebrief ? (
              <div className="flex flex-wrap items-center gap-2">
                <Label htmlFor="life-event-debrief-due">Due date</Label>
                <Input id="life-event-debrief-due" type="date" className="w-44" value={debriefDue} onChange={(event) => setDebriefDue(event.target.value)} />
                <span className="text-xs text-muted-foreground">Leave empty for no due date.</span>
              </div>
            ) : null}
          </div>

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
                <div className="flex flex-wrap gap-2">
                  {event.debrief ? (
                    <Button
                      type="button"
                      size="sm"
                      variant={openDebriefs === event.id ? "default" : "outline"}
                      aria-expanded={openDebriefs === event.id}
                      onClick={() => {
                        setOpenDebriefs(openDebriefs === event.id ? "" : event.id);
                        // Fresh counts, since students may have submitted since.
                        refresh();
                      }}
                    >
                      Debriefs ({event.debrief.submitted} of {event.debrief.total})
                    </Button>
                  ) : null}
                  {event.undoneAt ? (
                    <Badge variant="outline" className="rounded-md">Undone</Badge>
                  ) : (
                    <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => void undo(event)}>
                      Undo
                    </Button>
                  )}
                </div>
                {openDebriefs === event.id ? (
                  <div className="w-full">
                    <DebriefsPanel eventId={event.id} onChanged={refresh} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export type StudentDebrief = {
  canEdit: boolean;
  dueAt: string | null;
  grade: StudentGradeReport | null;
  id: string;
  prompts: string[];
  report: string;
  submittedAt: string | null;
};

export type StudentLifeEvent = {
  amountCents: number;
  capped: boolean;
  debrief?: StudentDebrief | null;
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
            {event.prompt && !event.debrief ? <p className="mt-1 text-muted-foreground">Think about: {event.prompt}</p> : null}
            <p className="mt-1 text-xs text-muted-foreground">{when(event.playedAt)}</p>
            {event.debrief ? <StudentDebriefForm debrief={event.debrief} title={event.title} /> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

// ------------------------------------------------------------ debriefs (v0.2.18)

type DebriefGrade = {
  answerChanged: boolean;
  feedback: string;
  gradedBy: string;
  maxPoints: number;
  scores: Array<{ id: string; points: number }>;
  status: "draft" | "released";
  totalPoints: number;
};

type DebriefView = {
  averagePercent: number | null;
  beforeDue: boolean;
  criteria: Array<{ id: string; label: string; points: number }>;
  draftCount: number;
  dueAt: string | null;
  students: Array<{
    amountCents: number;
    capped: boolean;
    cashAfterCents: number;
    debriefId: string;
    email: string;
    grade: DebriefGrade | null;
    name: string;
    report: string;
    status: "not_submitted" | "submitted" | "graded" | "released";
    submittedAt: string | null;
  }>;
  summary: { capped: number; inDebt: number; submitted: number; total: number };
  title: string;
};

async function debriefApi(body?: Record<string, unknown>, query = "") {
  const response = await fetch(`/api/teacher/life-events/debriefs${query}`, {
    body: body ? JSON.stringify(body) : undefined,
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    method: body ? "POST" : "GET",
  });
  const result = (await response.json().catch(() => ({}))) as { message?: string } & Record<string, unknown>;

  if (!response.ok) throw new Error(result.message ?? "That didn't work. Please try again.");
  return result;
}

/** Teachers: every student's debrief for one event, with grading. */
function DebriefsPanel({ eventId, onChanged }: { eventId: string; onChanged: () => void }) {
  const [view, setView] = useState<DebriefView | null>(null);
  const [notice, setNotice] = useState("");
  const [tick, setTick] = useState(0);
  const reload = () => {
    setTick((value) => value + 1);
    onChanged();
  };

  useEffect(() => {
    let cancelled = false;

    debriefApi(undefined, `?eventId=${encodeURIComponent(eventId)}`)
      .then((result) => {
        if (!cancelled) setView(result as unknown as DebriefView);
      })
      .catch((error: Error) => {
        if (!cancelled) setNotice(error.message);
      });

    return () => {
      cancelled = true;
    };
  }, [eventId, tick]);

  async function releaseAll() {
    setNotice("");
    try {
      const result = await debriefApi({ action: "releaseAll", eventId });
      setNotice(`Released ${String(result.released)} grade${result.released === 1 ? "" : "s"}.`);
      reload();
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  if (!view) return <p className="mt-2 text-sm text-muted-foreground">{notice || "Loading debriefs…"}</p>;

  return (
    <section aria-label="Debriefs" className="mt-3 space-y-3 rounded-md border border-border bg-card p-3" data-testid="debriefs">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-medium">
          {view.summary.submitted} of {view.summary.total} submitted
          {view.dueAt ? ` · due ${new Date(view.dueAt).toLocaleDateString()}` : " · no due date"}
        </span>
        <span className="text-muted-foreground" data-testid="debrief-summary">
          {view.summary.capped} couldn&apos;t cover it in full · {view.summary.inDebt} in debt · class average{" "}
          {view.averagePercent === null ? "not graded yet" : `${view.averagePercent}%`}
        </span>
        {view.draftCount > 0 ? (
          <Button type="button" size="sm" variant="outline" onClick={() => void releaseAll()}>
            Release all graded ({view.draftCount})
          </Button>
        ) : null}
      </div>
      {notice ? <p role="status" className="text-sm">{notice}</p> : null}
      <ul className="space-y-2">
        {view.students.map((student) => (
          <li key={student.debriefId} className="rounded-md border border-border bg-background p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium">{student.name}</span>
              <div className="flex flex-wrap items-center gap-2">
                <span className={student.amountCents < 0 ? "text-[#c44536]" : "text-[#1f7a4d]"}>
                  {money(student.amountCents)} → {money(student.cashAfterCents)}
                </span>
                {student.capped ? <Badge variant="outline" className="rounded-md">Couldn&apos;t cover it</Badge> : null}
                {student.cashAfterCents < 0 ? <Badge variant="outline" className="rounded-md">In debt</Badge> : null}
                <StatusBadge status={student.status} />
              </div>
            </div>
            {student.report ? (
              <p className="mt-2 whitespace-pre-wrap rounded-md bg-card p-2" data-testid="debrief-report">{student.report}</p>
            ) : (
              <p className="mt-2 text-muted-foreground">No debrief yet.</p>
            )}
            <DebriefGradeForm
              beforeDue={view.beforeDue}
              criteria={view.criteria}
              debriefId={student.debriefId}
              grade={student.grade}
              name={student.name}
              onChanged={reload}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function DebriefGradeForm({
  beforeDue,
  criteria,
  debriefId,
  grade,
  name,
  onChanged,
}: {
  beforeDue: boolean;
  criteria: Array<{ id: string; label: string; points: number }>;
  debriefId: string;
  grade: DebriefGrade | null;
  name: string;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [confirmEarly, setConfirmEarly] = useState(false);
  const [notice, setNotice] = useState("");

  function openForm() {
    const saved = new Map(grade?.scores.map((score) => [score.id, score.points]));
    setPoints(Object.fromEntries(criteria.map((rule) => [rule.id, saved.has(rule.id) ? String(saved.get(rule.id)) : ""])));
    setFeedback(grade?.feedback ?? "");
    setConfirmEarly(false);
    setOpen(true);
  }

  async function post(body: Record<string, unknown>, success: string) {
    setNotice("");
    try {
      await debriefApi({ debriefId, ...body });
      setNotice(success);
      setOpen(false);
      onChanged();
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  const total = criteria.reduce((sum, rule) => sum + (Number(points[rule.id]) || 0), 0);

  return (
    <div className="mt-2" aria-label={`Debrief grade for ${name}`} role="group">
      <div className="flex flex-wrap items-center gap-2">
        <span data-testid="debrief-grade">
          {grade
            ? `${grade.totalPoints} of ${grade.maxPoints} points · ${grade.status === "released" ? "released" : "draft, not visible to the student"}`
            : "Not graded yet"}
        </span>
        {grade?.status === "draft" ? (
          <Button type="button" size="sm" onClick={() => void post({ action: "release" }, `Released. ${name} can see it now.`)}>
            Release grade
          </Button>
        ) : null}
        {!open ? (
          <Button type="button" size="sm" variant="outline" onClick={openForm}>
            {grade ? "Change grade" : "Grade"}
          </Button>
        ) : null}
      </div>
      {grade?.answerChanged ? (
        <p className="mt-1 text-xs text-[#7a4b00]">Debrief changed since grading.</p>
      ) : null}
      {open ? (
        <div className="mt-2 space-y-2">
          {criteria.map((rule) => (
            <div key={rule.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <Label htmlFor={`debrief-${debriefId}-${rule.id}`}>{rule.label}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`debrief-${debriefId}-${rule.id}`}
                  type="number"
                  min={0}
                  max={rule.points}
                  className="w-20"
                  value={points[rule.id] ?? ""}
                  onChange={(event) => setPoints((current) => ({ ...current, [rule.id]: event.target.value }))}
                />
                <span className="text-muted-foreground">of {rule.points}</span>
              </div>
            </div>
          ))}
          <p className="font-medium">Total: {total} of 10 points</p>
          <Textarea aria-label={`Feedback for ${name}`} rows={2} maxLength={2000} placeholder="Feedback for the student (optional)" value={feedback} onChange={(event) => setFeedback(event.target.value)} />
          {beforeDue ? (
            <label className="flex items-start gap-2 rounded-md bg-[#fff3da] px-3 py-2 text-[#7a4b00]">
              <input type="checkbox" className="mt-1" checked={confirmEarly} onChange={(event) => setConfirmEarly(event.target.checked)} />
              <span>Grade before the due date. The student can still change their debrief until then.</span>
            </label>
          ) : null}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={beforeDue && !confirmEarly}
              onClick={() =>
                void post(
                  { action: "grade", confirmEarly, feedback, scores: points },
                  grade?.status === "released" ? `Grade changed. ${name} sees the new grade.` : "Saved as a draft. Release it when you're ready."
                )
              }
            >
              Save grade
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      {notice ? <p role="status" className="mt-1 text-sm">{notice}</p> : null}
    </div>
  );
}

/** The student's debrief for one event: write it until the due date, then see the grade. */
function StudentDebriefForm({ debrief, title }: { debrief: StudentDebrief; title: string }) {
  const [report, setReport] = useState(debrief.report);
  const [submitted, setSubmitted] = useState(Boolean(debrief.submittedAt));
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    setNotice("");
    try {
      const response = await fetch("/api/life-events/debrief", {
        body: JSON.stringify({ debriefId: debrief.id, report }),
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) throw new Error(result.message ?? "Your debrief couldn't be saved.");
      setNotice(submitted ? "Your changes are saved." : "Submitted! Your teacher can read it now.");
      setSubmitted(true);
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 space-y-2 rounded-md border border-border bg-background p-3" data-testid="student-debrief" aria-label={`Debrief: ${title}`} role="group">
      <p className="font-medium">
        Debrief {debrief.dueAt ? `due ${new Date(debrief.dueAt).toLocaleDateString()}` : "(no due date)"}
        {submitted ? " · submitted" : ""}
      </p>
      <ol className="list-decimal space-y-1 pl-5">
        {debrief.prompts.map((prompt) => (
          <li key={prompt}>{prompt}</li>
        ))}
      </ol>
      {debrief.grade ? <StudentGradeReportCard report={debrief.grade} /> : null}
      {debrief.canEdit ? (
        <>
          <Textarea aria-label="Your debrief" rows={5} maxLength={4000} value={report} onChange={(event) => setReport(event.target.value)} />
          <Button type="button" size="sm" disabled={pending || !report.trim()} onClick={() => void save()}>
            {submitted ? "Save changes" : "Submit debrief"}
          </Button>
        </>
      ) : (
        <p className="whitespace-pre-wrap">{report || "The due date passed before a debrief was written."}</p>
      )}
      {notice ? <p role="status">{notice}</p> : null}
    </div>
  );
}
