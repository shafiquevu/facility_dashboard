"use client";

import type { ComplianceVendor, Store } from "@/lib/api";
import { addVendor, addVendorStore, approveVendor, approveVendorStore, editVendor } from "../actions";
import { ActionForm, Submit } from "@/components/action-form";
import { Field, Select, TextInput } from "@/components/fields";

function StoreSelect({ stores, id, required }: { stores: Store[]; id: string; required?: boolean }) {
  return (
    <Select id={id} name="store_id" required={required} defaultValue="">
      <option value="">{required ? "Choose a store" : "No store yet"}</option>
      {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
    </Select>
  );
}

// Kelly (29 Oct): a store that wants an established vendor picks it here. It
// then needs that store's COI and an approval, like a new vendor.
export function AddVendorToStoreForm({ vendors, stores }: { vendors: { id: string; name: string }[]; stores: Store[] }) {
  return (
    <ActionForm action={addVendorStore} resetOnSuccess className="grid gap-4 md:grid-cols-[1.4fr_1fr_auto] md:items-end">
      <Field label="Established vendor" htmlFor="vs-vendor">
        <Select id="vs-vendor" name="vendor_id" required defaultValue="">
          <option value="">Choose a vendor</option>
          {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
        </Select>
      </Field>
      <Field label="For store" htmlFor="vs-store"><StoreSelect stores={stores} id="vs-store" required /></Field>
      <Submit>Add to store</Submit>
    </ActionForm>
  );
}

export function AddVendorForm({ stores }: { stores: Store[] }) {
  return (
    <ActionForm action={addVendor} resetOnSuccess className="grid gap-4 md:grid-cols-3">
      <Field label="Vendor name" htmlFor="v-name"><TextInput id="v-name" name="name" required /></Field>
      <Field label="Contact person" htmlFor="v-contact"><TextInput id="v-contact" name="contact" /></Field>
      <Field label="Services" htmlFor="v-services" hint="Separate with commas: HVAC, Plumbing"><TextInput id="v-services" name="services" /></Field>
      <Field label="Phone" htmlFor="v-phone"><TextInput id="v-phone" name="phone" type="tel" /></Field>
      <Field label="Email" htmlFor="v-email"><TextInput id="v-email" name="email" type="email" /></Field>
      <Field label="For store" htmlFor="v-store" hint="The store that will use it first."><StoreSelect stores={stores} id="v-store" /></Field>
      <div><Submit>Add vendor</Submit></div>
    </ActionForm>
  );
}

export function EditVendorForm({ vendor }: { vendor: ComplianceVendor }) {
  const id = vendor.id;
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-[13px] font-medium text-brand hover:underline">Edit</summary>
      <ActionForm action={editVendor} className="mt-3 grid gap-3 rounded-lg border border-line bg-surface p-4 text-left md:grid-cols-2">
        <input type="hidden" name="id" value={id} />
        <Field label="Name" htmlFor={`e-name-${id}`}><TextInput id={`e-name-${id}`} name="name" required defaultValue={vendor.name} /></Field>
        <Field label="Contact person" htmlFor={`e-contact-${id}`}><TextInput id={`e-contact-${id}`} name="contact" defaultValue={vendor.contact ?? ""} /></Field>
        <Field label="Phone" htmlFor={`e-phone-${id}`}><TextInput id={`e-phone-${id}`} name="phone" type="tel" defaultValue={vendor.phone ?? ""} /></Field>
        <Field label="Email" htmlFor={`e-email-${id}`}><TextInput id={`e-email-${id}`} name="email" type="email" defaultValue={vendor.email ?? ""} /></Field>
        <Field label="Services" htmlFor={`e-services-${id}`} className="md:col-span-2"><TextInput id={`e-services-${id}`} name="services" defaultValue={vendor.services.join(", ")} /></Field>
        <div className="md:col-span-2"><Submit variant="outline" size="sm">Save vendor</Submit></div>
      </ActionForm>
    </details>
  );
}

// Approve a vendor for one store. Hangar refuses it without a current COI
// covering that store, and the form says why.
export function StoreApproval({ vendorId, storeId, approved }: { vendorId: string; storeId: string; approved: boolean }) {
  return (
    <ActionForm action={approveVendorStore}>
      <input type="hidden" name="vendor_id" value={vendorId} />
      <input type="hidden" name="store_id" value={storeId} />
      <input type="hidden" name="approved" value={approved ? "false" : "true"} />
      <Submit variant={approved ? "ghost" : "outline"} size="sm">{approved ? "Remove approval" : "Approve"}</Submit>
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
