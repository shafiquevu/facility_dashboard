"use client";

import { addVendor, approveVendor } from "../actions";
import { ActionForm, Submit } from "@/components/action-form";
import { Field, TextInput } from "@/components/fields";

export function AddVendorForm() {
  return (
    <ActionForm action={addVendor} resetOnSuccess className="grid gap-4 md:grid-cols-3">
      <Field label="Vendor name" htmlFor="v-name"><TextInput id="v-name" name="name" required /></Field>
      <Field label="Contact person" htmlFor="v-contact"><TextInput id="v-contact" name="contact" /></Field>
      <Field label="Services" htmlFor="v-services" hint="Separate with commas: HVAC, Plumbing"><TextInput id="v-services" name="services" /></Field>
      <Field label="Phone" htmlFor="v-phone"><TextInput id="v-phone" name="phone" type="tel" /></Field>
      <Field label="Email" htmlFor="v-email"><TextInput id="v-email" name="email" type="email" /></Field>
      <div className="flex items-end"><Submit>Add vendor</Submit></div>
    </ActionForm>
  );
}

export function ApprovalToggle({ id, approved }: { id: string; approved: boolean }) {
  return (
    <ActionForm action={approveVendor}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="approved" value={approved ? "false" : "true"} />
      <Submit variant={approved ? "ghost" : "outline"} size="sm">{approved ? "Remove approval" : "Approve"}</Submit>
    </ActionForm>
  );
}
