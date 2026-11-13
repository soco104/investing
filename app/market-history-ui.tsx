"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// v0.2.13: market rewind. A view-only look back at a class's prices over a
// chosen timeframe, with the teacher's changes and clock events marked.

type Point = { at: string; price: number };
type Series = { name: string; points: Point[]; ticker: string };
type HistoryEvent = { at: string; detail: string; kind: "clock" | "change" | "undo"; label: string };
type History = { events: HistoryEvent[]; from: string; historyStart: string; series: Series[]; to: string };

type Preset = "hour" | "today" | "week" | "month" | "custom";

const presets: Array<{ id: Exclude<Preset, "custom">; label: string }> = [
  { id: "hour", label: "Last hour" },
  { id: "today", label: "Today" },
  { id: "week", label: "Past 7 days" },
  { id: "month", label: "Past 30 days" },
];

const HOUR = 60 * 60 * 1000;
const lineColors = ["#28666e", "#c44536", "#7a4b00", "#5b3f8c", "#1f7a4d", "#3a5fa8", "#8a3025", "#4b5563"];
// Lines differ by dash pattern as well as color, so color isn't the only cue.
const lineDashes = ["", "7 4", "2 3", "10 3 2 3", "", "7 4", "2 3", "10 3 2 3"];
const selectClass = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function presetRange(preset: Exclude<Preset, "custom">) {
  const now = Date.now();

  if (preset === "hour") return { from: now - HOUR, to: now };
  if (preset === "week") return { from: now - 7 * 24 * HOUR, to: now };
  if (preset === "month") return { from: now - 30 * 24 * HOUR, to: now };

  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  return { from: midnight.getTime(), to: now };
}

// <input type="datetime-local"> wants local time as YYYY-MM-DDTHH:mm.
function toLocalInput(ms: number) {
  const date = new Date(ms);
  const pad = (value: number) => String(value).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const timeText = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { day: "numeric", hour: "numeric", minute: "2-digit", month: "short" });
const money = (value: number) => value.toLocaleString("en-US", { currency: "USD", style: "currency" });
const percentText = (value: number) => `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;

function HistoryChart({ history, percentMode }: { history: History; percentMode: boolean }) {
  const width = 720;
  const height = 280;
  const pad = { bottom: 30, left: 62, right: 14, top: 22 };
  const fromMs = new Date(history.from).getTime();
  const toMs = new Date(history.to).getTime();
  const lines = history.series.map((item) => ({
    ...item,
    values: item.points.map((point) => ({
      t: new Date(point.at).getTime(),
      v: percentMode ? (point.price / item.points[0].price - 1) * 100 : point.price,
    })),
  }));
  const all = lines.flatMap((line) => line.values.map((value) => value.v));
  const low = Math.min(...all);
  const high = Math.max(...all);
  const margin = (high - low || Math.abs(high) * 0.01 || 1) * 0.08;
  const min = low - margin;
  const max = high + margin;
  const x = (t: number) => pad.left + ((t - fromMs) / Math.max(1, toMs - fromMs)) * (width - pad.left - pad.right);
  const y = (v: number) => pad.top + ((max - v) / (max - min)) * (height - pad.top - pad.bottom);
  const axisText = (v: number) => (percentMode ? percentText(v) : money(v));
  const summary = lines
    .map((line) => {
      const first = line.values[0].v;
      const last = line.values[line.values.length - 1].v;
      return percentMode ? `${line.ticker} ${percentText(last)}` : `${line.ticker} from ${money(first)} to ${money(last)}`;
    })
    .join("; ");

  return (
    <svg
      role="img"
      aria-label={`Market history chart. ${summary}. ${history.events.length} marked event${history.events.length === 1 ? "" : "s"}.`}
      viewBox={`0 0 ${width} ${height}`}
      className="h-72 w-full"
      data-testid="history-chart"
    >
      {[0, 1, 2, 3].map((step) => {
        const value = max - ((max - min) * step) / 3;
        return (
          <g key={step}>
            <line x1={pad.left} x2={width - pad.right} y1={y(value)} y2={y(value)} stroke="currentColor" opacity="0.12" />
            <text x={pad.left - 6} y={y(value) + 4} fontSize="11" textAnchor="end" fill="currentColor" opacity="0.7">
              {axisText(value)}
            </text>
          </g>
        );
      })}
      {history.events.map((event, index) => {
        const at = x(new Date(event.at).getTime());
        return (
          <g key={`${event.at}-${index}`}>
            <line x1={at} x2={at} y1={pad.top} y2={height - pad.bottom} stroke="#7a4b00" strokeDasharray="4 3" opacity="0.7" />
            <circle cx={at} cy={pad.top - 9} r="8" fill="#fff3da" stroke="#7a4b00" />
            <text x={at} y={pad.top - 5.5} fontSize="10" textAnchor="middle" fill="#7a4b00" fontWeight="600">
              {index + 1}
            </text>
          </g>
        );
      })}
      {lines.map((line, index) => {
        const color = lineColors[index % lineColors.length];
        const path = line.values
          .map((value, position) => `${position === 0 ? "M" : "L"} ${x(value.t).toFixed(1)} ${y(value.v).toFixed(1)}`)
          .join(" ");

        return (
          <path
            key={line.ticker}
            d={path}
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeDasharray={lineDashes[index % lineDashes.length]}
          />
        );
      })}
      <text x={pad.left} y={height - 8} fontSize="11" fill="currentColor" opacity="0.7">{timeText(history.from)}</text>
      <text x={width - pad.right} y={height - 8} fontSize="11" textAnchor="end" fill="currentColor" opacity="0.7">
        {timeText(history.to)}
      </text>
    </svg>
  );
}

export function MarketHistoryDialog({
  className,
  onClose,
  open,
  symbols,
}: {
  className: string;
  onClose: () => void;
  open: boolean;
  symbols: Array<{ name: string; ticker: string }>;
}) {
  // The popup is only mounted while open, so it always starts on the last hour.
  const [preset, setPreset] = useState<Preset>("hour");
  const [range, setRange] = useState<{ from: number; to: number } | null>(() => presetRange("hour"));
  const [customFrom, setCustomFrom] = useState(() => toLocalInput(presetRange("hour").from));
  const [customTo, setCustomTo] = useState(() => toLocalInput(presetRange("hour").to));
  const [ticker, setTicker] = useState("");
  const [history, setHistory] = useState<History | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function choosePreset(next: Exclude<Preset, "custom">) {
    const picked = presetRange(next);

    setPreset(next);
    setRange(picked);
    setCustomFrom(toLocalInput(picked.from));
    setCustomTo(toLocalInput(picked.to));
  }

  function applyCustom() {
    const from = new Date(customFrom).getTime();
    const to = new Date(customTo).getTime();

    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      setError("Choose a start and an end time.");
      return;
    }

    setPreset("custom");
    setRange({ from, to });
  }

  useEffect(() => {
    if (!open || !range) return;

    let cancelled = false;
    const params = new URLSearchParams({
      className,
      from: new Date(range.from).toISOString(),
      to: new Date(range.to).toISOString(),
    });

    if (ticker) params.set("ticker", ticker);

    queueMicrotask(() => {
      if (!cancelled) setLoading(true);
    });

    fetch(`/api/teacher/market/history?${params.toString()}`, { credentials: "same-origin" })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as History & { message?: string };

        if (cancelled) return;

        if (!response.ok) {
          setError(body.message ?? "The market history couldn't be loaded.");
          setHistory(null);
          return;
        }

        setError("");
        setHistory(body);
      })
      .catch(() => {
        if (!cancelled) setError("The market history couldn't be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [className, open, range, ticker]);

  const percentMode = !ticker;

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : onClose())}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl" data-testid="market-history">
        <DialogHeader>
          <DialogTitle>Market history: {className}</DialogTitle>
          <DialogDescription>
            A look back at what the whole class saw. View-only: nothing here changes prices, trades or portfolios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Timeframe">
            {presets.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={preset === item.id ? "default" : "outline"}
                aria-pressed={preset === item.id}
                onClick={() => choosePreset(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="space-y-1">
              <Label htmlFor="history-from">From</Label>
              <Input id="history-from" type="datetime-local" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="history-to">To</Label>
              <Input id="history-to" type="datetime-local" value={customTo} onChange={(event) => setCustomTo(event.target.value)} />
            </div>
            <Button type="button" variant="outline" onClick={applyCustom}>
              Show this timeframe
            </Button>
          </div>

          <div className="space-y-1">
            <Label htmlFor="history-symbol">Symbol</Label>
            <select id="history-symbol" className={selectClass} value={ticker} onChange={(event) => setTicker(event.target.value)}>
              <option value="">All symbols (compared by percent change)</option>
              {symbols.map((symbol) => (
                <option key={symbol.ticker} value={symbol.ticker}>
                  {symbol.ticker}: {symbol.name}
                </option>
              ))}
            </select>
          </div>

          {error ? <p role="alert" className="text-sm text-[#8a3025]">{error}</p> : null}
          {loading && !history ? <p className="text-sm text-muted-foreground">Loading history…</p> : null}

          {history && history.series.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground" data-testid="history-range">
                Showing {timeText(history.from)} to {timeText(history.to)}. History begins {timeText(history.historyStart)}.
              </p>
              <HistoryChart history={history} percentMode={percentMode} />
              {percentMode ? (
                <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm" aria-label="Chart legend" data-testid="history-legend">
                  {history.series.map((item, index) => (
                    <li key={item.ticker} className="flex items-center gap-2">
                      <svg width="28" height="8" aria-hidden="true">
                        <line
                          x1="0"
                          x2="28"
                          y1="4"
                          y2="4"
                          stroke={lineColors[index % lineColors.length]}
                          strokeWidth="2.5"
                          strokeDasharray={lineDashes[index % lineDashes.length]}
                        />
                      </svg>
                      <span className="font-medium">{item.ticker}</span>
                      <span className="text-muted-foreground">
                        {percentText((item.points[item.points.length - 1].price / item.points[0].price - 1) * 100)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {!percentMode ? (
                <p className="text-sm" data-testid="history-summary">
                  {history.series[0].ticker}: {money(history.series[0].points[0].price)} at the start,{" "}
                  {money(history.series[0].points[history.series[0].points.length - 1].price)} at the end (
                  {percentText(
                    (history.series[0].points[history.series[0].points.length - 1].price / history.series[0].points[0].price - 1) * 100
                  )}
                  ).
                </p>
              ) : null}

              <div>
                <h4 className="font-semibold">What happened</h4>
                {history.events.length === 0 ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    No teacher changes, pauses or speed changes in this timeframe.
                  </p>
                ) : (
                  <ol className="mt-2 space-y-1 text-sm" aria-label="Events in this timeframe">
                    {history.events.map((event, index) => (
                      <li key={`${event.at}-${index}`} className="flex flex-wrap gap-x-2">
                        <span className="font-semibold text-[#7a4b00]">{index + 1}.</span>
                        <span className="text-muted-foreground">{timeText(event.at)}</span>
                        <span className="font-medium">{event.label}</span>
                        <span className="text-muted-foreground">({event.detail})</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
