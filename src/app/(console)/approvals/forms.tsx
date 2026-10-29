"use client";

import { approveProposedItem, approveVendor, rejectProposedItem } from "../actions";
import { ActionForm, Submit } from "@/components/action-form";
import { PersonSelect, TextInput, VendorSelect } from "@/components/fields";
import type { Meta } from "@/lib/api";

export function ProposedItemForms({ id, nextDue, imported, meta }: {
  id: string; nextDue: string | null; imported: boolean; meta: Meta;
}) {
  return (
    <div className="flex flex-wrap items-start gap-2 lg:flex-nowrap lg:justify-end">
      <ActionForm action={approveProposedItem} className="flex flex-wrap items-start gap-2 lg:flex-nowrap">
        <input type="hidden" name="id" value={id} />
        <TextInput name="next_due" type="date" defaultValue={nextDue ?? ""} required aria-label="Due date" title="The date the inspection is due" className="w-40" />
        {/* Reminders go to this person 60, 30, 14 and 7 days before the due date and on it; empty means the service manager. */}
        <div className="w-44"><PersonSelect meta={meta} id={`owner-${id}`} name="owner_id" empty="The service manager" /></div>
        <div className="w-44"><VendorSelect meta={meta} id={`vendor-${id}`} /></div>
        <Submit variant="outline">{imported ? "Set date and start" : "Approve"}</Submit>
      </ActionForm>
      <ActionForm action={rejectProposedItem}>
        <input type="hidden" name="id" value={id} />
        <Submit variant="ghost">{imported ? "Remove" : "Reject"}</Submit>
      </ActionForm>
    </div>
  );
}

export function VendorApproveForm({ id }: { id: string }) {
  return (
    <ActionForm action={approveVendor}>
      <input type="hidden" name="id" value={id} />
      <Submit variant="outline">Approve vendor</Submit>
    </ActionForm>
  );
}
