import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { get, type CoiStatus, type ComplianceVendor, type Meta } from "@/lib/api";
import { cn } from "@/lib/utils";
import { day, storeLabel } from "@/lib/format";
import { access, attempt, one, withStore, type SearchParams } from "@/lib/page";
import { NoAccess } from "@/components/no-access";
import { CoiStatusLabel, Empty, ErrorState, Loading, PageHeader, Section, Status, TableShell, Td, Th } from "@/components/kit";
import { CoiUploadForm } from "./forms";

export const metadata = { title: "Insurance" };

export default function CompliancePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Vendor insurance"
        description="Certificates of insurance. A vendor is cleared to work only when it is approved and its certificate is current."
      />
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
  const status = one(params.status) as CoiStatus | "";
  const result = await attempt(async () => {
    const [compliance, meta] = await Promise.all([
      get<{ vendors: ComplianceVendor[]; counts: Record<CoiStatus, number> }>("/console/compliance", { store }),
      get<Meta>("/console/meta"),
    ]);
    return { ...compliance, stores: meta.stores };
  });
  if (result.error !== null) return <ErrorState message={result.error} />;
  const { vendors, counts, stores } = result.data;
  const shown = status ? vendors.filter((v) => v.coi_status === status) : vendors;
  const cleared = vendors.filter((v) => v.cleared).length;

  const filters: [CoiStatus | "", string, number, string][] = [
    ["", "All vendors", vendors.length, "text-ink"],
    ["expired", "Expired", counts.expired, "text-overdue"],
    ["expiring", "Expiring in 30 days", counts.expiring, "text-soon"],
    ["missing", "No certificate", counts.missing, "text-graphite"],
    ["valid", "Current", counts.valid, "text-verified"],
  ];

  return (
    <div className="space-y-5">
      <section className="panel flex flex-wrap items-stretch divide-x divide-line" aria-label="Filter by certificate status">
        {filters.map(([key, label, n, tone]) => (
          <Link
            key={key || "all"}
            href={withStore(key ? `/compliance?status=${key}` : "/compliance", store)}
            aria-current={status === key ? "true" : undefined}
            className={cn("min-w-36 flex-1 px-5 py-4 hover:bg-surface-sunk/70", status === key && "bg-surface-sunk shadow-[inset_0_-2px_0_var(--brand)]")}
          >
            <span className="block text-[13px] text-graphite">{label}</span>
            <span className={cn("num mt-1 block text-[26px] leading-none font-semibold", n ? tone : "text-faint")}>{n}</span>
          </Link>
        ))}
        <div className="min-w-44 flex-1 bg-surface-sunk/50 px-5 py-4">
          <span className="block text-[13px] text-graphite">Cleared to work</span>
          <span className="num mt-1 block text-[26px] leading-none font-semibold">{cleared}<span className="text-[15px] text-faint"> of {vendors.length}</span></span>
        </div>
      </section>

      <Section title="Upload a certificate" description="Choose the store it covers: COIs are usually issued per location. A renewal is added as a new certificate; the old one stays on file as the record of past cover. Approve the vendor for that store on the Vendors page.">
        <CoiUploadForm vendors={[...vendors].sort((a, b) => a.name.localeCompare(b.name)).map((v) => ({ id: v.id, name: v.name }))} stores={stores} />
      </Section>

      <Section flush>
        {shown.length ? (
          <TableShell minWidth={900}>
            <thead className="border-b border-line bg-surface-sunk">
              <tr>
                <Th className="pl-5">Vendor</Th><Th>Stores</Th><Th>Certificate expires</Th><Th>Status</Th><Th>Approved</Th><Th>Cleared</Th><Th className="pr-5">File</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((v) => (
                <tr key={v.id} className="hover:bg-surface-sunk/60">
                  <Td className="pl-5">
                    <Link href={`/vendors#${v.id}`} className="font-medium hover:text-brand">{v.name}</Link>
                    <span className="block text-xs text-graphite">{v.services.join(", ") || "No services listed"}</span>
                  </Td>
                  <Td className="max-w-56 text-xs text-graphite">{v.stores.map(storeLabel).join(", ") || "None linked"}</Td>
                  <Td className={cn("num whitespace-nowrap", v.coi_status === "expired" && "font-semibold text-overdue")}>{day(v.cover_until)}</Td>
                  <Td><CoiStatusLabel status={v.coi_status} /></Td>
                  <Td className="text-xs whitespace-nowrap">{v.approved ? <>{v.approved_by}<span className="block text-graphite">{day(v.approved_on)}</span></> : <span className="text-faint">Not approved</span>}</Td>
                  <Td>{v.cleared ? <Status tone="verified">Cleared</Status> : <Status tone="overdue">Not cleared</Status>}</Td>
                  <Td className="pr-5">
                    {v.coi_url ? (
                      <a href={v.coi_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                        Open <ExternalLink className="size-3.5" />
                      </a>
                    ) : <span className="text-faint">None</span>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <div className="p-5"><Empty title="No vendors in this view" /></div>
        )}
      </Section>
    </div>
  );
}
