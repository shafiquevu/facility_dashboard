"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// A public page's form (no login): posts from the browser straight to hangar,
// so a large file is not cut off by Vercel's request limit, then shows hangar's
// answer in place of the form: `done` with {number} filled in, or hangar's
// own message.
export function PublicForm({ action, submit, done, children }: {
  action: string;
  submit: string;
  done?: string;
  children: ReactNode;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch(action, { method: "POST", body: new FormData(event.currentTarget) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof body.detail === "string" ? body.detail : "That did not go through. Try again.");
        return;
      }
      setResult(body);
    } catch {
      setError("That did not go through. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="flex items-start gap-3 py-2">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-verified" />
        <p className="text-[14px] text-graphite">{done ? done.replace("{number}", String(result.number ?? "")) : String(result.message ?? "Done.")}</p>
      </div>
    );
  }
  return (
    <form onSubmit={send} className="grid gap-4">
      {children}
      {error && <p role="alert" className="rounded-md bg-overdue-tint px-3 py-2 text-[13px] text-overdue">{error}</p>}
      <div>
        <Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} {submit}</Button>
      </div>
    </form>
  );
}
