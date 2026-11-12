"use client";

import { CheckCircle2, KeyRound, Landmark } from "lucide-react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_VERSION } from "@/lib/version";

const MIN_PASSWORD_LENGTH = 10;

const subscribeToNothing = () => () => {};

// Reads ?token= from the address bar. null while rendering on the server.
function useResetToken() {
  return useSyncExternalStore(
    subscribeToNothing,
    () => new URLSearchParams(window.location.search).get("token") ?? "",
    () => null
  );
}

export default function ResetPasswordPage() {
  const token = useResetToken();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setNotice("");

    if (password.length < MIN_PASSWORD_LENGTH) {
      setNotice(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (password !== confirm) {
      setNotice("The two passwords don't match.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        body: JSON.stringify({ newPassword: password, token }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as { message?: string; ok?: boolean };

      if (!response.ok || !result.ok) {
        setNotice(
          result.message ??
            "The password could not be changed. Ask your administrator for a new reset link."
        );
        return;
      }

      setDone(true);
      setPassword("");
      setConfirm("");
    } catch {
      setNotice("The reset service is unavailable. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Landmark className="size-6" aria-hidden="true" />
          </div>
          <p className="text-xl font-semibold">FutureFund Classroom</p>
        </div>

        <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="size-5 text-primary" aria-hidden="true" />
            <h1 className="text-lg font-semibold">Set a new password</h1>
          </div>

          {done ? (
            <div className="space-y-4">
              <p className="flex items-start gap-2 text-sm">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                Your password has been changed. You&apos;ve been signed out of
                other devices.
              </p>
              <Button asChild className="w-full">
                <Link href="/">Go to sign in</Link>
              </Button>
            </div>
          ) : token === null ? null : !token ? (
            <p className="text-sm text-muted-foreground">
              This link is missing its reset code. Open the link from your email
              again, or ask your administrator for a new one.
            </p>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  At least {MIN_PASSWORD_LENGTH} characters.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm new password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                />
              </div>

              {notice ? (
                <p className="rounded-md bg-accent p-3 text-sm text-accent-foreground">
                  {notice}
                </p>
              ) : null}

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Saving…" : "Set new password"}
              </Button>
            </form>
          )}
        </section>
      </div>
      <footer className="absolute inset-x-0 bottom-0 py-3 text-center text-[11px] text-muted-foreground/60">
        v{APP_VERSION}
      </footer>
    </main>
  );
}
