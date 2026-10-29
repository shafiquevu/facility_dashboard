import { Suspense } from "react";
import { Loading, Section } from "@/components/kit";
import { Field, Select, TextInput } from "@/components/fields";
import { PublicForm } from "@/components/public-form";
import { CannotLoad, PublicPage, hangar, load } from "@/components/public-page";
import { words } from "@/lib/format";

// A store proposes something for the maintenance schedule. Nothing reminds
// anyone until Kelly approves it.

export const metadata = { title: "Add to the schedule", robots: { index: false } };

type Options = {
  locations: { id: string; label: string }[];
  categories: { key: string; label: string }[];
  frequencies: string[];
};

export default function AddItemPage() {
  return (
    <PublicPage>
      <Suspense fallback={<Loading rows={4} />}>
        <Content />
      </Suspense>
    </PublicPage>
  );
}

async function Content() {
  const result = await load<Options>("/public/forms/add-item");
  if (!result || !("data" in result)) return <CannotLoad />;
  const { locations, categories, frequencies } = result.data;
  return (
    <Section>
      <h1 className="display mt-5 text-[22px] font-semibold text-ink">Add something to the maintenance schedule</h1>
      <p className="mt-1 mb-5 text-[14px] text-graphite">
        For a recurring inspection or service that isn&apos;t on the list yet. Kelly reviews it; once she approves it, reminders start on their own.
      </p>
      <PublicForm
        action={`${hangar()}/public/forms/add-item`}
        submit="Send to Kelly"
        done="Sent to Kelly to review as {number}. Once she approves it, reminders start automatically."
      >
        <Field label="Which building?" htmlFor="location_id">
          <Select id="location_id" name="location_id" required defaultValue="">
            <option value="">Choose the store and building</option>
            {locations.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </Select>
        </Field>
        <Field label="What kind of item?" htmlFor="category_key">
          <Select id="category_key" name="category_key" required defaultValue="">
            <option value="">Choose one</option>
            {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </Select>
        </Field>
        <Field label="Name it" htmlFor="name" hint="So it can be found later, for example Backflow test, wash bay.">
          <TextInput id="name" name="name" required />
        </Field>
        <Field label="How often?" htmlFor="frequency">
          <Select id="frequency" name="frequency" defaultValue="annual">
            {frequencies.map((f) => <option key={f} value={f}>{words(f)}</option>)}
          </Select>
        </Field>
        <Field label="When was it last done? (optional)" htmlFor="last_completed">
          <TextInput id="last_completed" name="last_completed" type="date" />
        </Field>
        <Field label="Who usually does it? (optional)" htmlFor="vendor">
          <TextInput id="vendor" name="vendor" placeholder="The vendor's name" />
        </Field>
        <Field label="Your name" htmlFor="submitted_by">
          <TextInput id="submitted_by" name="submitted_by" required autoComplete="name" />
        </Field>
      </PublicForm>
    </Section>
  );
}
