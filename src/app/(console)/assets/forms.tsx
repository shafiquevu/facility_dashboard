"use client";

import type { Asset, Meta } from "@/lib/api";
import { logAssetService, saveAsset } from "../actions";
import { ActionForm, Submit } from "@/components/action-form";
import { Field, FrequencySelect, LocationSelect, PersonSelect, TextInput } from "@/components/fields";

export function AssetForm({ meta, asset, store }: { meta: Meta; asset?: Asset; store?: string }) {
  const p = asset?.id ?? "new";
  return (
    <ActionForm action={saveAsset} resetOnSuccess={!asset} className="grid gap-4 md:grid-cols-3">
      {asset && <input type="hidden" name="id" value={asset.id} />}
      <Field label="Name" htmlFor={`${p}-name`}><TextInput id={`${p}-name`} name="name" required defaultValue={asset?.name} placeholder="Air compressor, service bay 2" /></Field>
      <Field label="Store and building" htmlFor={`${p}-loc`} className="md:col-span-2"><LocationSelect meta={meta} id={`${p}-loc`} value={asset?.location_id} store={asset ? undefined : store} /></Field>
      <Field label="Type" htmlFor={`${p}-cat`}><TextInput id={`${p}-cat`} name="category" defaultValue={asset?.category ?? ""} placeholder="Compressor, lift, generator" /></Field>
      <Field label="Make" htmlFor={`${p}-make`}><TextInput id={`${p}-make`} name="make" defaultValue={asset?.make ?? ""} /></Field>
      <Field label="Model" htmlFor={`${p}-model`}><TextInput id={`${p}-model`} name="model" defaultValue={asset?.model ?? ""} /></Field>
      <Field label="Serial number" htmlFor={`${p}-serial`}><TextInput id={`${p}-serial`} name="serial_number" defaultValue={asset?.serial_number ?? ""} /></Field>
      <Field label="Installed" htmlFor={`${p}-installed`}><TextInput id={`${p}-installed`} name="installed_on" type="date" defaultValue={asset?.installed_on ?? ""} /></Field>
      <Field label="Looked after by" htmlFor={`${p}-who`}><PersonSelect meta={meta} id={`${p}-who`} name="assigned_to_id" value={asset?.assigned_to_id} /></Field>
      <Field label="Serviced every" htmlFor={`${p}-interval`}><FrequencySelect meta={meta} id={`${p}-interval`} name="service_interval" value={asset?.service_interval} empty="No schedule" /></Field>
      <Field label="Last service" htmlFor={`${p}-last`}><TextInput id={`${p}-last`} name="last_service" type="date" defaultValue={asset?.last_service ?? ""} /></Field>
      <Field label="Next service" htmlFor={`${p}-next`} hint="Blank: worked out from the last service and the interval."><TextInput id={`${p}-next`} name="next_service" type="date" defaultValue={asset?.next_service ?? ""} /></Field>
      <Field label="Notes" htmlFor={`${p}-notes`} className="md:col-span-3"><TextInput id={`${p}-notes`} name="notes" defaultValue={asset?.notes ?? ""} /></Field>
      <div className="flex flex-wrap gap-2 md:col-span-3">
        <Submit>{asset ? "Save changes" : "Add equipment"}</Submit>
        {asset && <Submit variant="ghost" name="intent" value="retire">Retire this equipment</Submit>}
      </div>
    </ActionForm>
  );
}

export function ServiceForm({ id }: { id: string }) {
  return (
    <ActionForm action={logAssetService} className="grid gap-3 md:grid-cols-[160px_160px_1fr_auto] md:items-end">
      <input type="hidden" name="id" value={id} />
      <Field label="Serviced on" htmlFor={`${id}-on`} hint="Blank means today."><TextInput id={`${id}-on`} name="on" type="date" /></Field>
      <Field label="Next service" htmlFor={`${id}-nx`} hint="Blank: from the interval."><TextInput id={`${id}-nx`} name="next_service" type="date" /></Field>
      <Field label="What was done" htmlFor={`${id}-note`}><TextInput id={`${id}-note`} name="note" /></Field>
      <Submit variant="outline">Log service</Submit>
    </ActionForm>
  );
}
