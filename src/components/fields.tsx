import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { Meta } from "@/lib/api";
import { cn } from "@/lib/utils";
import { locationLabel, words } from "@/lib/format";

// Native inputs and selects, styled to the system: they work with server
// actions and FormData as-is, and the browser's own pickers on phones.
export const control =
  "h-9 w-full min-w-0 rounded-md border border-input bg-surface px-3 text-[13px] text-ink shadow-none outline-none transition-colors placeholder:text-faint focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15 disabled:opacity-60";

export function Field({ label, htmlFor, children, hint, className }: {
  label: string; htmlFor: string; children: ReactNode; hint?: string; className?: string;
}) {
  return (
    <div className={cn("min-w-0 space-y-1.5", className)}>
      <label className="block text-[13px] font-medium text-ink" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="text-xs text-graphite">{hint}</p>}
    </div>
  );
}

export function TextInput(props: React.ComponentProps<"input">) {
  return <input {...props} className={cn(control, props.type === "file" && "py-1.5 file:mr-3 file:rounded file:border-0 file:bg-surface-sunk file:px-2 file:py-0.5 file:text-[12px] file:font-medium", props.className)} />;
}

export function TextArea(props: React.ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(control, "h-auto min-h-20 py-2", props.className)} />;
}

export function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative min-w-0", className)}>
      <select {...props} className={cn(control, "appearance-none pr-8")} />
      <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-faint" aria-hidden="true" />
    </div>
  );
}

export function LocationSelect({ meta, id = "location_id", value, store, required = true }: {
  meta: Meta; id?: string; value?: string | null; store?: string; required?: boolean;
}) {
  const locations = store ? meta.locations.filter((l) => l.store_code === store) : meta.locations;
  return (
    <Select id={id} name="location_id" defaultValue={value ?? ""} required={required}>
      <option value="">Choose a store and building</option>
      {locations.map((l) => (
        <option key={l.id} value={l.id}>{locationLabel(l.store, l.building)}</option>
      ))}
    </Select>
  );
}

export function PersonSelect({ meta, id, name, value, empty = "Nobody", required }: {
  meta: Meta; id: string; name: string; value?: string | null; empty?: string; required?: boolean;
}) {
  return (
    <Select id={id} name={name} defaultValue={value ?? ""} required={required} aria-label={empty}>
      <option value="">{empty}</option>
      {meta.people.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </Select>
  );
}

export function VendorSelect({ meta, id, value }: { meta: Meta; id: string; value?: string | null }) {
  return (
    <Select id={id} name="vendor_id" defaultValue={value ?? ""}>
      <option value="">No vendor</option>
      {meta.vendors.map((v) => (
        <option key={v.id} value={v.id}>{v.name}{v.approved ? "" : " (not approved)"}</option>
      ))}
    </Select>
  );
}

export function FrequencySelect({ meta, id, name, value, empty }: { meta: Meta; id: string; name: string; value?: string | null; empty?: string }) {
  return (
    <Select id={id} name={name} defaultValue={value ?? (empty === undefined ? "annual" : "")}>
      {empty !== undefined && <option value="">{empty}</option>}
      {meta.frequencies.map((f) => (
        <option key={f} value={f}>{words(f)}</option>
      ))}
    </Select>
  );
}
