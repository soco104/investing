"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { createTraceId, reportClientError } from "@/lib/observability";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void reportClientError({
      message: `${error.message}${error.digest ? ` (${error.digest})` : ""}`,
      route: window.location.pathname,
      severity: "critical",
      source: "frontend",
      traceId: createTraceId(),
    });
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6 text-foreground">
      <div className="max-w-lg rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-normal">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The error has been logged for support review. Try again or contact
          your teacher if it keeps happening.
        </p>
        <Button
          type="button"
          onClick={reset}
          className="mt-5 bg-[#28666e] text-white hover:bg-[#22565d]"
        >
          Try again
        </Button>
      </div>
    </main>
  );
}
