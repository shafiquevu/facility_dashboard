"use client";

import { useState } from "react";
import type { Meta } from "@/lib/api";
import { cn } from "@/lib/utils";
import { createWorkOrder } from "../../actions";
import { ActionForm, Submit } from "@/components/action-form";
import { Field, FrequencySelect, LocationSelect, PersonSelect, Select, TextArea, TextInput, VendorSelect } from "@/components/fields";

export function NewWorkOrderForm({ meta, store, type: initial }: { meta: Meta; store: string; type: "item" | "request" }) {
  const [type, setType] = useState(initial);
  const assets = store ? meta.assets.filter((a) => a.store_code === store) : meta.assets;

  return (
    <div className="panel max-w-3xl">
      <div className="grid grid-cols-2 border-b border-line" role="radiogroup" aria-label="Kind of work order">
        {([
          ["request", "One-off repair", "Something broke, or needs doing once."],
          ["item", "Recurring inspection", "Repeats on a schedule and sends its own reminders."],
        ] as const).map(([key, label, note]) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={type === key}
            onClick={() => setType(key)}
            className={cn(
              "border-b-2 px-5 py-4 text-left transition-colors first:rounded-tl-xl last:rounded-tr-xl",
              type === key ? "border-brand bg-surface" : "border-transparent bg-surface-sunk/60 hover:bg-surface-sunk",
            )}
          >
            <span className={cn("block text-[14px] font-semibold", type === key ? "text-ink" : "text-graphite")}>{label}</span>
            <span className="mt-0.5 block text-xs text-graphite">{note}</span>
          </button>
        ))}
      </div>

      <ActionForm action={createWorkOrder} key={type} className="grid gap-x-4 gap-y-5 p-5 sm:grid-cols-2">
        <input type="hidden" name="type" value={type} />
        <Field label="Store and building" htmlFor="location_id" className="sm:col-span-2">
          <LocationSelect meta={meta} store={store} />
        </Field>

        {type === "request" ? (
          <>
            <Field label="What needs doing" htmlFor="issue" className="sm:col-span-2">
              <TextArea id="issue" name="issue" required rows={3} placeholder="Service bay door 3 will not close" />
            </Field>
            <Field label="Urgency" htmlFor="urgency" hint="Leave the due date blank and it is set for you: urgent next day, soon 14 days, routine 30.">
              <Select id="urgency" name="urgency" defaultValue="routine">
                <option value="routine">Routine</option>
                <option value="soon">Soon</option>
                <option value="urgent">Urgent</option>
              </Select>
            </Field>
            <Field label="Due date" htmlFor="due">
              <TextInput id="due" name="due" type="date" />
            </Field>
          </>
        ) : (
          <>
            <Field label="Name" htmlFor="name">
              <TextInput id="name" name="name" required placeholder="Backflow test, wash bay" />
            </Field>
            <Field label="Type" htmlFor="category_key" hint="Roof, elevator, backflow, fire alarm and sprinkler are critical: they escalate to Kelly and Chris on day one.">
              <Select id="category_key" name="category_key" defaultValue="other">
                {meta.categories.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}{c.critical ? " (critical)" : ""}</option>
                ))}
              </Select>
            </Field>
            <Field label="Repeats" htmlFor="frequency">
              <FrequencySelect meta={meta} id="frequency" name="frequency" />
            </Field>
            <Field label="Next due" htmlFor="next_due" hint="Or give the date it was last done and this is worked out.">
              <TextInput id="next_due" name="next_due" type="date" />
            </Field>
            <Field label="Last done" htmlFor="last_completed">
              <TextInput id="last_completed" name="last_completed" type="date" />
            </Field>
            <Field label="Owner" htmlFor="owner_id" hint="Accountable for it. Reminders and escalations start here.">
              <PersonSelect meta={meta} id="owner_id" name="owner_id" />
            </Field>
          </>
        )}

        <Field label="Assigned to" htmlFor="assignee_id">
          <PersonSelect meta={meta} id="assignee_id" name="assignee_id" empty="Nobody yet" />
        </Field>
        <Field label="Vendor" htmlFor="vendor_id">
          <VendorSelect meta={meta} id="vendor_id" />
        </Field>
        <Field label="Equipment" htmlFor="asset_id">
          <Select id="asset_id" name="asset_id" defaultValue="">
            <option value="">Not linked to equipment</option>
            {assets.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </Select>
        </Field>
        {type === "request" && (
          <Field label="Notes" htmlFor="notes">
            <TextInput id="notes" name="notes" />
          </Field>
        )}
        <div className="flex items-center gap-3 border-t border-line pt-5 sm:col-span-2">
          <Submit>{type === "request" ? "Create work order" : "Add inspection"}</Submit>
          <span className="text-xs text-graphite">Recorded in the audit trail under your name.</span>
        </div>
      </ActionForm>
    </div>
  );
}
