"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ChartRange, StockInfo } from "@/lib/stock-info";

// v0.2.11: the stock info popup behind every symbol on the Market screen.
// The server decides the level (Basic or Full) and sends only that data.

const money = (value: number) => value.toLocaleString("en-US", { currency: "USD", style: "currency" });

const rangeNames: Record<ChartRange, string> = { "1D": "1 day", "1M": "1 month", "1W": "1 week", "1Y": "1 year" };

function PriceChart({ points, ticker }: { points: StockInfo["chart"]; ticker: string }) {
  const width = 560;
  const height = 180;
  const pad = { bottom: 24, left: 8, right: 8, top: 10 };
  const prices = points.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const x = (index: number) => pad.left + (index / Math.max(1, points.length - 1)) * (width - pad.left - pad.right);
  const y = (price: number) => pad.top + ((max - price) / span) * (height - pad.top - pad.bottom);
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(point.price).toFixed(1)}`).join(" ");
  const up = prices[prices.length - 1] >= prices[0];
  const color = up ? "#1f7a4d" : "#c44536";

  return (
    <svg
      role="img"
      aria-label={`${ticker} price chart from ${money(prices[0])} to ${money(prices[prices.length - 1])}`}
      viewBox={`0 0 ${width} ${height}`}
      className="h-44 w-full"
    >
      <path d={`${line} L ${x(points.length - 1)} ${height - pad.bottom} L ${x(0)} ${height - pad.bottom} Z`} fill={color} opacity="0.1" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x={pad.left} y={height - 6} fontSize="11" fill="currentColor" opacity="0.6">{points[0].label}</text>
      <text x={width - pad.right} y={height - 6} fontSize="11" textAnchor="end" fill="currentColor" opacity="0.6">
        {points[points.length - 1].label}
      </text>
    </svg>
  );
}

export function StockInfoDialog({
  className,
  heldText,
  onClose,
  onTrade,
  ticker,
}: {
  className: string | null;
  heldText: string | null; // e.g. "3 shares worth $2,068.26"; null = none held
  onClose: () => void;
  onTrade: ((ticker: string) => void) | null;
  ticker: string | null;
}) {
  const [info, setInfo] = useState<StockInfo | null>(null);
  const [error, setError] = useState("");
  const [range, setRange] = useState<ChartRange | null>(null);

  useEffect(() => {
    if (!ticker) return;

    let cancelled = false;
    const params = new URLSearchParams({ ticker });

    if (className) params.set("className", className);
    if (range) params.set("range", range);

    fetch(`/api/market/info?${params.toString()}`, { credentials: "same-origin" })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as { info?: StockInfo; message?: string };

        if (cancelled) return;
        if (!response.ok || !body.info) {
          setError(body.message ?? "The stock info couldn't be loaded.");
          return;
        }

        setError("");
        setInfo(body.info);
      })
      .catch(() => {
        if (!cancelled) setError("The stock info couldn't be loaded.");
      });

    return () => {
      cancelled = true;
    };
  }, [className, range, ticker]);

  function close() {
    setInfo(null);
    setError("");
    setRange(null);
    onClose();
  }

  const shown = info && info.ticker === ticker ? info : null;
  const up = (shown?.changePercent ?? 0) >= 0;

  return (
    <Dialog open={ticker !== null} onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl" data-testid="stock-info">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {ticker}
            {shown ? <span className="text-base font-normal text-muted-foreground">{shown.name}</span> : null}
          </DialogTitle>
          <DialogDescription>
            {shown ? shown.kind : "Loading stock info…"}
            {shown?.sector ? ` · ${shown.sector}` : ""}
          </DialogDescription>
        </DialogHeader>

        {error ? <p role="alert" className="text-sm text-[#8a3025]">{error}</p> : null}

        {shown ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl font-semibold">{money(shown.price)}</span>
              <span className={`font-semibold ${up ? "text-[#1f7a4d]" : "text-[#c44536]"}`}>
                {up ? "▲" : "▼"} {up ? "+" : ""}
                {shown.changePercent.toFixed(2)}% today
              </span>
              <Badge className="rounded-md bg-[#fff3da] text-[#7a4b00] hover:bg-[#fff3da]">Sample data</Badge>
            </div>

            <div>
              {shown.ranges.length > 1 ? (
                <div className="mb-2 flex gap-2" role="group" aria-label="Chart range">
                  {shown.ranges.map((option) => (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={shown.range === option ? "default" : "outline"}
                      aria-pressed={shown.range === option}
                      onClick={() => setRange(option)}
                    >
                      {rangeNames[option]}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="mb-2 text-sm text-muted-foreground">Price over the past month</p>
              )}
              <PriceChart points={shown.chart} ticker={shown.ticker} />
            </div>

            <div>
              <h4 className="font-semibold">What is this?</h4>
              <p className="mt-1 text-sm leading-6">{shown.description}</p>
            </div>

            {shown.keyFigures ? (
              <div data-testid="stock-key-figures">
                <h4 className="font-semibold">Key figures</h4>
                <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                  {[
                    ["Market cap", shown.keyFigures.marketCap],
                    ["P/E ratio", shown.keyFigures.peRatio],
                    ["Volume", shown.keyFigures.volume],
                    ["52-week high", money(shown.keyFigures.yearHigh)],
                    ["52-week low", money(shown.keyFigures.yearLow)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {shown.headlines ? (
              <div data-testid="stock-headlines">
                <h4 className="font-semibold">News headlines</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {shown.headlines.map((headline) => (
                    <li key={headline}>{headline}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm" data-testid="stock-holding">
                {heldText ? `You own ${heldText}.` : "You don't own any of this yet."}
              </p>
              {onTrade ? (
                <Button
                  type="button"
                  className="bg-[#28666e] text-white hover:bg-[#22565d]"
                  onClick={() => {
                    const symbol = shown.ticker;
                    close();
                    onTrade(symbol);
                  }}
                >
                  Trade {shown.ticker}
                </Button>
              ) : null}
            </div>

            <p className="text-xs text-muted-foreground">
              This is sample information for classroom practice, not real company data or financial advice.
            </p>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
