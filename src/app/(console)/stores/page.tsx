import Link from "next/link";
import { Suspense } from "react";
import { get, type Meta, type StoreReport } from "@/lib/api";
import { cn } from "@/lib/utils";
import { storeLabel } from "@/lib/format";
import { access, attempt } from "@/lib/page";
import { NoAccess } from "@/components/no-access";
import { ErrorState, Loading, PageHeader, Section } from "@/components/kit";
import { AddLocationForm } from "../settings/forms";

export const metadata = { title: "Stores and buildings" };

export default function StoresPage() {
  return (
    <>
      <PageHeader title="Stores and buildings" description="Every inspection and piece of equipment belongs to one building at one store." />
      <Suspense fallback={<Loading rows={10} />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  if (!(await access())) return <NoAccess />;
  const result = await attempt(async () => {
    const [meta, reports] = await Promise.all([
      get<Meta>("/console/meta"),
      get<{ stores: StoreReport[] }>("/console/reports"),
    ]);
    return { meta, reports: reports.stores };
  });
  if (result.error !== null) return <ErrorState message={result.error} />;
  const { meta, reports } = result.data;

  return (
    <div className="space-y-5">
      <section className="panel divide-y divide-line" aria-label="Stores">
        {meta.stores.map((s) => {
          const r = reports.find((x) => x.store_code === s.short_code);
          const buildings = meta.locations.filter((l) => l.store_code === s.short_code);
          return (
            <div key={s.id} className="grid gap-4 px-5 py-4 md:grid-cols-[1.1fr_1.6fr_auto] md:items-center">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-ink text-[11px] font-semibold text-white">{s.short_code}</span>
                <div className="min-w-0">
                  <Link href={`/?store=${s.short_code}`} className="block text-[14px] font-semibold hover:text-brand">{storeLabel(s.name)}</Link>
                  <span className="block truncate text-xs text-graphite">{s.name}</span>
                </div>
              </div>
              <ul className="space-y-0.5 text-[13px]">
                {buildings.map((b) => (
                  <li key={b.id} className="truncate">
                    {b.building}
                    {b.address && <span className="text-graphite">, {b.address}</span>}
                  </li>
                ))}
              </ul>
              <dl className="flex gap-6 text-right">
                {([["Open", r?.open ?? 0, ""], ["Overdue", r?.overdue ?? 0, "text-overdue"], ["To verify", r?.awaiting_verification ?? 0, "text-awaiting"]] as const).map(([label, n, tone]) => (
                  <div key={label}>
                    <dt className="text-xs text-graphite">{label}</dt>
                    <dd className={cn("num text-[18px] font-semibold", n ? tone : "text-faint")}>{n}</dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </section>
      <Section title="Add a building">
        <AddLocationForm meta={meta} />
      </Section>
    </div>
  );
}
