"use client";

import { useRef, useState, type FormEvent } from "react";
import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, Section, type Tone } from "@/components/kit";
import { Field, Select, TextArea, TextInput } from "@/components/fields";
import { day, locationLabel, words } from "@/lib/format";
import type { LinkView } from "./types";

const TONE: Record<LinkView["colour"], Tone> = { red: "overdue", yellow: "soon", green: "verified" };

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-t border-line py-2.5 text-[14px] first:border-t-0">
      <span className="text-graphite">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

// The upload goes from the browser straight to hangar, so a large scanned
// report is not cut off by Vercel's request limit.
export function LinkPage({ initial, uploadUrl }: { initial: LinkView; uploadUrl: string }) {
  const [view, setView] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  const closed = view.status === "verified_complete";
  const submitted = view.status === "proof_submitted" || view.status === "awaiting_document";
  const kinds = view.outstanding.length ? view.outstanding : ["completion_document"];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const file = data.get("file");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("The report must be a PDF. Scan or save it as a PDF and upload that.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(uploadUrl, { method: "POST", body: data });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(typeof body.detail === "string" ? body.detail : "The upload did not go through. Try again.");
        return;
      }
      setView(body as LinkView);
      form.current?.reset();
    } catch {
      setError("The upload did not go through. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {view.message && (
        <p role="status" className="flex items-start gap-2 rounded-lg bg-verified-tint px-4 py-3 text-[14px] text-verified">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> {view.message}
        </p>
      )}

      <Section>
        <div className="flex flex-wrap items-center gap-2 pt-5">
          <Chip tone={TONE[view.colour]}>{words(view.status)}</Chip>
          {view.critical && <Chip tone="overdue">Critical</Chip>}
        </div>
        <h1 className="display mt-3 mb-3 text-[22px] font-semibold text-ink">{view.item}</h1>
        <Row label="Location" value={view.building ? locationLabel(view.store, view.building) : view.store} />
        <Row label="Address" value={view.address} />
        <Row label="Due" value={day(view.due)} />
        <Row label="Repeats" value={words(view.frequency)} />
        <Row label="Accountable owner" value={view.owner} />
        <Row label="Currently with" value={view.with} />
      </Section>

      <Section title="Approved vendor">
        <Row label="Vendor" value={view.vendor ?? "Not assigned yet. Contact Kelly."} />
        <Row label="Phone" value={view.vendor_phone} />
      </Section>

      <Section title="Documents">
        {view.documents.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-4 border-t border-line py-2.5 text-[14px] first:border-t-0">
            <span className="inline-flex items-center gap-2 text-ink"><FileText className="size-4 text-graphite" /> {words(d.kind)}</span>
            <Chip tone="verified">Uploaded</Chip>
          </div>
        ))}
        {view.outstanding.map((k) => (
          <div key={k} className="flex items-center justify-between gap-4 border-t border-line py-2.5 text-[14px] first:border-t-0">
            <span className="text-ink">{words(k)}</span>
            <Chip tone="overdue">Required</Chip>
          </div>
        ))}
        {!view.documents.length && !view.outstanding.length && <p className="text-[14px] text-graphite">Nothing uploaded yet.</p>}
      </Section>

      {closed ? (
        <Section><p className="pt-5 text-[14px] text-graphite">This item is closed and verified. Nothing further is needed.</p></Section>
      ) : (
        <Section
          title={submitted ? "Add another document" : "Upload proof"}
          description={submitted ? "Your submission is with the reviewer. You can still add anything that was missing." : "The inspection or test report, as a PDF."}
        >
          <form ref={form} onSubmit={submit} className="grid gap-4">
            <Field label="What is this document?" htmlFor="kind">
              <Select id="kind" name="kind" defaultValue={kinds[0]}>
                {kinds.map((k) => <option key={k} value={k}>{words(k)}</option>)}
              </Select>
            </Field>
            <Field label="How did the inspection go?" htmlFor="result">
              <Select id="result" name="result" defaultValue="passed">
                <option value="passed">Passed</option>
                <option value="passed_with_recommendations">Passed, with recommendations</option>
                <option value="failed">Failed</option>
              </Select>
            </Field>
            <Field label="The report, as a PDF" htmlFor="file">
              <TextInput id="file" name="file" type="file" accept=".pdf,application/pdf" required />
            </Field>
            <Field label="Your name" htmlFor="by">
              <TextInput id="by" name="by" required autoComplete="name" />
            </Field>
            <Field label="Anything the reviewer should know (optional)" htmlFor="notes">
              <TextArea id="notes" name="notes" rows={3} />
            </Field>
            {error && <p role="alert" className="rounded-md bg-overdue-tint px-3 py-2 text-[13px] text-overdue">{error}</p>}
            <div>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin" />} Submit
              </Button>
            </div>
          </form>
        </Section>
      )}
    </div>
  );
}
