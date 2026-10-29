"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/kit";
import { Field, Select, TextArea, TextInput } from "@/components/fields";

// Posts from the browser straight to hangar, so photos are not cut off by
// Vercel's request limit.
export function RequestForm({ locations, submitUrl }: { locations: { id: string; label: string }[]; submitUrl: string }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ number: string; refused: number } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch(submitUrl, { method: "POST", body: new FormData(event.currentTarget) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof body.detail === "string" ? body.detail : "That did not go through. Try again.");
        return;
      }
      setDone({ number: body.number, refused: body.photos_refused ?? 0 });
    } catch {
      setError("That did not go through. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <Section>
        <div className="flex items-start gap-3 pt-5">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-verified" />
          <div>
            <h1 className="display text-[20px] font-semibold text-ink">Thank you</h1>
            <p className="mt-1 text-[14px] text-graphite">
              Your request is logged as <span className="num font-medium text-ink">{done.number}</span>. An owner will be assigned and you will hear back once it has been picked up.
            </p>
            {done.refused > 0 && (
              <p className="mt-2 text-[13px] text-soon">{done.refused} photo{done.refused > 1 ? "s" : ""} could not be added (too large or not an image). The request itself went through.</p>
            )}
            <Button variant="outline" className="mt-4" onClick={() => setDone(null)}>Report something else</Button>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <h1 className="display mt-5 text-[22px] font-semibold text-ink">Report something that needs attention</h1>
      <p className="mt-1 mb-5 text-[14px] text-graphite">
        For anything broken or unsafe that isn&apos;t on the maintenance schedule. It gets an owner and is tracked like a scheduled inspection.
      </p>
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Which building?" htmlFor="location_id">
          <Select id="location_id" name="location_id" required defaultValue="">
            <option value="">Choose the store and building</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </Select>
        </Field>
        <Field label="What is the problem?" htmlFor="issue">
          <TextArea id="issue" name="issue" rows={4} required placeholder="Where it is and what is wrong" />
        </Field>
        <Field label="How urgent?" htmlFor="urgency">
          <Select id="urgency" name="urgency" defaultValue="routine">
            <option value="routine">Routine: can wait for the next visit</option>
            <option value="soon">Soon: within a week or two</option>
            <option value="urgent">Urgent: safety, or it stops us trading</option>
          </Select>
        </Field>
        <Field label="Photos (optional, but they save a site visit)" htmlFor="photos">
          <TextInput id="photos" name="photos" type="file" accept="image/*" multiple />
        </Field>
        <Field label="Your name" htmlFor="submitted_by">
          <TextInput id="submitted_by" name="submitted_by" required autoComplete="name" />
        </Field>
        {error && <p role="alert" className="rounded-md bg-overdue-tint px-3 py-2 text-[13px] text-overdue">{error}</p>}
        <div>
          <Button type="submit" disabled={busy}>{busy && <Loader2 className="size-4 animate-spin" />} Send request</Button>
        </div>
      </form>
    </Section>
  );
}
