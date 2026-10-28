import Link from "next/link";
import { Suspense } from "react";
import { ChevronDown } from "lucide-react";
import { get, type Asset, type Meta } from "@/lib/api";
import { day, words } from "@/lib/format";
import { access, attempt, one, withStore, type SearchParams } from "@/lib/page";
import { NoAccess } from "@/components/no-access";
import { AssetStatusLabel, Empty, ErrorState, Loading, PageHeader, Section } from "@/components/kit";
import { AssetForm, ServiceForm } from "./forms";

export const metadata = { title: "Equipment" };

export default function AssetsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Equipment" description="Compressors, lifts, generators, paint booths: anything with a serial number and a service history." />
      <Suspense fallback={<Loading rows={10} />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  if (!(await access())) return <NoAccess />;
  const params = await searchParams;
  const store = one(params.store);
  const result = await attempt(async () => {
    const [assets, meta] = await Promise.all([
      get<{ assets: Asset[] }>("/console/assets", { store }),
      get<Meta>("/console/meta"),
    ]);
    return { assets: assets.assets, meta };
  });
  if (result.error !== null) return <ErrorState message={result.error} />;
  const { assets, meta } = result.data;

  return (
    <div className="space-y-5">
      <Section flush title={<>On file<span className="num ml-1.5 text-graphite">{assets.length}</span></>}>
        {assets.length ? (
          <ul className="divide-y divide-line border-t border-line">
            {assets.map((a) => (
              <li key={a.id} id={a.id} className="scroll-mt-24">
                <details className="group">
                  <summary className="grid cursor-pointer list-none grid-cols-2 items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-surface-sunk/60 md:grid-cols-[1.5fr_1fr_1fr_0.8fr_0.8fr_150px_16px] [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium">{a.name}</span>
                      <span className="block truncate text-xs text-graphite">{[a.category, a.make, a.model].filter(Boolean).join(", ") || "No details"}</span>
                    </span>
                    <span className="text-[13px]">{a.store}<span className="block text-xs text-graphite">{a.building}</span></span>
                    <span className="text-[13px] text-graphite">{a.assigned_to ?? "Nobody"}</span>
                    <span className="text-[13px]"><span className="block text-xs text-graphite">Last</span><span className="num">{day(a.last_service)}</span></span>
                    <span className="text-[13px]"><span className="block text-xs text-graphite">Next</span><span className="num">{day(a.next_service)}</span></span>
                    <AssetStatusLabel status={a.service_status} />
                    <ChevronDown className="size-4 text-faint transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="space-y-5 border-t border-line bg-surface-sunk/50 px-5 py-5">
                    <p className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-graphite">
                      <span>Serial {a.serial_number ?? "not recorded"}</span>
                      <span>Installed {day(a.installed_on, "date unknown")}</span>
                      <span>Serviced {a.service_interval ? words(a.service_interval).toLowerCase() : "on no schedule"}</span>
                      <Link href={withStore(`/work-orders?q=${encodeURIComponent(a.name)}`, store)} className="font-medium text-brand hover:underline">
                        {a.open_work_orders} open work order{a.open_work_orders === 1 ? "" : "s"}
                      </Link>
                    </p>
                    <ServiceForm id={a.id} />
                    <details className="rounded-lg border border-line bg-surface">
                      <summary className="cursor-pointer px-4 py-2.5 text-[13px] font-medium text-brand">Edit details</summary>
                      <div className="border-t border-line p-4"><AssetForm meta={meta} asset={a} /></div>
                    </details>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 pb-5">
            <Empty title="No equipment on file yet">
              Add each compressor, lift, generator and paint booth below. Their service dates then show on the calendar and the overview.
            </Empty>
          </div>
        )}
      </Section>

      <Section title="Add equipment">
        <AssetForm meta={meta} store={store} />
      </Section>
    </div>
  );
}
