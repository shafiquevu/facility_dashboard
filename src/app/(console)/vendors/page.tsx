import { Fragment, Suspense } from "react";
import { ExternalLink, Mail, Phone } from "lucide-react";
import { get, type ComplianceVendor, type Meta } from "@/lib/api";
import { day, storeLabel } from "@/lib/format";
import { access, attempt, one, type SearchParams } from "@/lib/page";
import { NoAccess } from "@/components/no-access";
import { CoiStatusLabel, Empty, ErrorState, Loading, PageHeader, Section, Status, TableShell, Td, Th } from "@/components/kit";
import { AddVendorForm, AddVendorToStoreForm, EditVendorForm, StoreApproval } from "./forms";

export const metadata = { title: "Vendors" };

export default function VendorsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Vendors"
        description="Contractors and inspectors, and where each is cleared to work. A vendor is approved store by store, each with that store's certificate of insurance."
      />
      <Suspense fallback={<Loading rows={10} />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  if (!(await access())) return <NoAccess />;
  const store = one((await searchParams).store);
  const result = await attempt(async () => {
    const [compliance, meta] = await Promise.all([
      get<{ vendors: ComplianceVendor[] }>("/console/compliance", { store }),
      get<Meta>("/console/meta"),
    ]);
    return { vendors: compliance.vendors, meta };
  });
  if (result.error !== null) return <ErrorState message={result.error} />;
  const vendors = [...result.data.vendors].sort((a, b) => a.name.localeCompare(b.name));
  const stores = result.data.meta.stores;

  return (
    <div className="space-y-5">
      <Section flush title={<>Directory<span className="num ml-1.5 text-graphite">{vendors.length}</span></>}>
        {vendors.length ? (
          <TableShell minWidth={960}>
            <thead className="border-y border-line bg-surface-sunk">
              <tr><Th className="pl-5">Vendor</Th><Th>Contact</Th><Th>Inspections</Th><Th>Cleared at</Th><Th className="pr-5" /></tr>
            </thead>
            <tbody>
              {vendors.map((v) => (
                <Fragment key={v.id}>
                  <tr id={v.id} className="scroll-mt-24 border-t border-line target:bg-brand-tint">
                    <Td className="pl-5">
                      <span className="font-medium">{v.name}</span>
                      <span className="block text-xs text-graphite">{v.services.join(", ") || "No services listed"}</span>
                    </Td>
                    <Td className="text-xs">
                      {v.contact && <span className="block text-ink">{v.contact}</span>}
                      {v.phone ? <a href={`tel:${v.phone}`} className="flex items-center gap-1.5 text-graphite hover:text-brand"><Phone className="size-3" />{v.phone}</a> : <span className="block text-overdue">No phone</span>}
                      {v.email ? <a href={`mailto:${v.email}`} className="flex items-center gap-1.5 text-graphite hover:text-brand"><Mail className="size-3" />{v.email}</a> : <span className="block text-faint">No email</span>}
                    </Td>
                    <Td className="num">{v.item_count}</Td>
                    <Td className="text-xs">
                      {v.locations.length
                        ? <><span className="num font-medium text-ink">{v.cleared_stores.length}</span><span className="text-graphite"> of {v.locations.length} stores</span></>
                        : <span className="text-faint">No store yet</span>}
                    </Td>
                    <Td className="pr-5 text-right"><EditVendorForm vendor={v} /></Td>
                  </tr>
                  {v.locations.map((l) => (
                    <tr key={l.store_id} className="bg-surface-sunk/40 text-[13px]">
                      <Td className="pl-10 text-graphite">{storeLabel(l.store)}</Td>
                      <Td>
                        <CoiStatusLabel status={l.coi_status} />
                        <span className="block text-xs text-graphite">
                          {l.coi_until ? `until ${day(l.coi_until)}${l.coi_for_this_store ? "" : ", covers every store"}` : "Upload this store's COI on Vendor insurance"}
                        </span>
                        {l.coi_url && (
                          <a href={l.coi_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">Open <ExternalLink className="size-3" /></a>
                        )}
                      </Td>
                      <Td className="text-xs text-graphite">{l.approved ? <>Approved by {l.approved_by}<span className="block">{day(l.approved_on)}</span></> : <>{l.requested_by === "Existing assignment" ? "Already working here" : `Asked by ${l.requested_by}`}</>}</Td>
                      <Td>{l.cleared ? <Status tone="verified">Cleared</Status> : <Status tone="overdue">Not cleared</Status>}</Td>
                      <Td className="pr-5 text-right"><StoreApproval vendorId={v.id} storeId={l.store_id} approved={l.approved} /></Td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <div className="px-5 pb-5"><Empty title="No vendors yet">Add the first one below, or import the vendor workbook.</Empty></div>
        )}
      </Section>
      <Section title="Use an established vendor at a store" description="Pick the vendor and the store. It is listed for that store as not cleared until that store's COI is on file and it is approved.">
        <AddVendorToStoreForm vendors={vendors.map((v) => ({ id: v.id, name: v.name }))} stores={stores} />
      </Section>
      <Section title="Add a new vendor">
        <AddVendorForm stores={stores} />
      </Section>
    </div>
  );
}
