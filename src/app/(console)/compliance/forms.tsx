"use client";

import { uploadCoi } from "../actions";
import { ActionForm, Submit } from "@/components/action-form";
import { Field, Select, TextInput } from "@/components/fields";

export function CoiUploadForm({ vendors, stores }: { vendors: { id: string; name: string }[]; stores: { id: string; name: string }[] }) {
  return (
    <ActionForm action={uploadCoi} resetOnSuccess className="grid gap-3 md:grid-cols-[1.3fr_1fr_0.8fr_1.4fr_auto] md:items-end">
      <Field label="Vendor" htmlFor="coi-vendor">
        <Select id="coi-vendor" name="vendor_id" required defaultValue="">
          <option value="">Choose a vendor</option>
          {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </Select>
      </Field>
      <Field label="Covers" htmlFor="coi-store">
        <Select id="coi-store" name="store_id" defaultValue="">
          <option value="">Every store</option>
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </Field>
      <Field label="Expires on" htmlFor="coi-expiration">
        <TextInput id="coi-expiration" name="expiration" type="date" required />
      </Field>
      <Field label="Certificate" htmlFor="coi-file">
        <TextInput id="coi-file" name="file" type="file" required accept=".pdf,image/*" />
      </Field>
      <Submit>Upload certificate</Submit>
    </ActionForm>
  );
}
