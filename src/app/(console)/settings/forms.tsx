"use client";

import type { Meta } from "@/lib/api";
import { storeLabel } from "@/lib/format";
import { addLocation, addPerson, addStore } from "../actions";
import { ActionForm, Submit } from "@/components/action-form";
import { Field, Select, TextInput } from "@/components/fields";

export function AddStoreForm() {
  return (
    <ActionForm action={addStore} resetOnSuccess className="grid gap-4 md:grid-cols-[1.4fr_0.6fr_1fr_1.2fr_auto] md:items-end">
      <Field label="Store name" htmlFor="s-name"><TextInput id="s-name" name="name" required placeholder="McGrath Honda of Elgin" /></Field>
      <Field label="Code" htmlFor="s-code"><TextInput id="s-code" name="short_code" required maxLength={6} placeholder="ELG" className="uppercase" /></Field>
      <Field label="First building" htmlFor="s-building"><TextInput id="s-building" name="building" defaultValue="Main Building" /></Field>
      <Field label="Address" htmlFor="s-address"><TextInput id="s-address" name="address" /></Field>
      <Submit variant="outline">Add store</Submit>
    </ActionForm>
  );
}

export function AddLocationForm({ meta }: { meta: Meta }) {
  return (
    <ActionForm action={addLocation} resetOnSuccess className="grid gap-4 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end">
      <Field label="Store" htmlFor="l-store">
        <Select id="l-store" name="store_id" required defaultValue="">
          <option value="">Choose a store</option>
          {meta.stores.map((s) => <option key={s.id} value={s.id}>{storeLabel(s.name)}</option>)}
        </Select>
      </Field>
      <Field label="Building" htmlFor="l-building"><TextInput id="l-building" name="building" required placeholder="Back Building" /></Field>
      <Field label="Address" htmlFor="l-address"><TextInput id="l-address" name="address" /></Field>
      <Submit variant="outline">Add building</Submit>
    </ActionForm>
  );
}

export function AddPersonForm({ meta }: { meta: Meta }) {
  return (
    <ActionForm action={addPerson} resetOnSuccess className="grid gap-4 md:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] md:items-end">
      <Field label="Name" htmlFor="p-name"><TextInput id="p-name" name="name" required /></Field>
      <Field label="Email" htmlFor="p-email"><TextInput id="p-email" name="email" type="email" /></Field>
      <Field label="Mobile" htmlFor="p-phone"><TextInput id="p-phone" name="phone" type="tel" /></Field>
      <Field label="Store" htmlFor="p-store">
        <Select id="p-store" name="store_id" defaultValue="">
          <option value="">All stores</option>
          {meta.stores.map((s) => <option key={s.id} value={s.id}>{storeLabel(s.name)}</option>)}
        </Select>
      </Field>
      <Submit variant="outline">Add person</Submit>
    </ActionForm>
  );
}
