"use client";

import { useEffect } from "react";

import {
  createTraceId,
  reportClientError,
  reportClientPerformance,
  statusFromDuration,
} from "@/lib/observability";

export function MonitoringClient() {
  useEffect(() => {
    const reportNavigationTiming = () => {
      const navigation = performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming | undefined;

      if (!navigation) {
        return;
      }

      const durationMs = Math.round(navigation.duration);

      void reportClientPerformance({
        durationMs,
        operation: "navigation",
        route: window.location.pathname,
        status: statusFromDuration(durationMs),
        traceId: createTraceId(),
      });
    };

    const handleError = (event: ErrorEvent) => {
      void reportClientError({
        message: event.message,
        route: window.location.pathname,
        severity: "error",
        source: "frontend",
        traceId: createTraceId(),
      });
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      void reportClientError({
        message: String(event.reason ?? "Unhandled promise rejection"),
        route: window.location.pathname,
        severity: "error",
        source: "frontend",
        traceId: createTraceId(),
      });
    };

    reportNavigationTiming();
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  return null;
}
