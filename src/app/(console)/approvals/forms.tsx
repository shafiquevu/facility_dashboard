"use client";

import { approveProposedItem, approveVendor, rejectProposedItem } from "../actions";
import { ActionForm, Submit } from "@/components/action-form";
import { TextInput } from "@/components/fields";

export function ProposedItemForms({ id, nextDue, imported }: { id: string; nextDue: string | null; imported: boolean }) {
  return (
    <div className="flex flex-wrap items-start gap-2">
      <ActionForm action={approveProposedItem} className="flex flex-wrap items-start gap-2">
        <input type="hidden" name="id" value={id} />
        <TextInput name="next_due" type="date" defaultValue={nextDue ?? ""} required aria-label="Next due date" className="w-40" />
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
