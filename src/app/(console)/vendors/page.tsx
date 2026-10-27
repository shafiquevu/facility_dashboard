import { Suspense } from "react";
import { Mail, Phone } from "lucide-react";
import { get, type ComplianceVendor } from "@/lib/api";
import { day, storeLabel } from "@/lib/format";
import { access, attempt, one, type SearchParams } from "@/lib/page";
import { NoAccess } from "@/components/no-access";
import { CoiStatusLabel, Empty, ErrorState, Loading, PageHeader, Section, Status, TableShell, Td, Th } from "@/components/kit";
import { AddVendorForm, ApprovalToggle } from "./forms";

export const metadata = { title: "Vendors" };

export default function VendorsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Vendors" description="Contractors and inspectors: how to reach them, what they cover, and whether they are cleared to work." />
      <Suspense fallback={<Loading rows={10} />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  if (!(await access())) return <NoAccess />;
  const store = one((await searchParams).store);
  const result = await attempt(() => get<{ vendors: ComplianceVendor[] }>("/console/compliance", { store }));
  if (result.error !== null) return <ErrorState message={result.error} />;
  const vendors = [...result.data.vendors].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-5">
      <Section flush title={<>Directory<span className="num ml-1.5 text-graphite">{vendors.length}</span></>}>
        {vendors.length ? (
          <TableShell minWidth={960}>
            <thead className="border-y border-line bg-surface-sunk">
              <tr><Th className="pl-5">Vendor</Th><Th>Contact</Th><Th>Stores</Th><Th>Inspections</Th><Th>Insurance</Th><Th>Approval</Th><Th className="pr-5" /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {vendors.map((v) => (
                <tr key={v.id} id={v.id} className="scroll-mt-24 target:bg-brand-tint hover:bg-surface-sunk/60">
                  <Td className="pl-5">
                    <span className="font-medium">{v.name}</span>
                    <span className="block text-xs text-graphite">{v.services.join(", ") || "No services listed"}</span>
                  </Td>
                  <Td className="text-xs">
                    {v.contact && <span className="block text-ink">{v.contact}</span>}
                    {v.phone ? <a href={`tel:${v.phone}`} className="flex items-center gap-1.5 text-graphite hover:text-brand"><Phone className="size-3" />{v.phone}</a> : <span className="block text-overdue">No phone</span>}
                    {v.email ? <a href={`mailto:${v.email}`} className="flex items-center gap-1.5 text-graphite hover:text-brand"><Mail className="size-3" />{v.email}</a> : <span className="block text-faint">No email</span>}
                  </Td>
                  <Td className="max-w-52 text-xs text-graphite">{v.stores.map(storeLabel).join(", ") || "None linked"}</Td>
                  <Td className="num">{v.item_count}</Td>
                  <Td>
                    <CoiStatusLabel status={v.coi_status} />
                    {v.cover_until && <span className="num block text-xs text-graphite">until {day(v.cover_until)}</span>}
                  </Td>
                  <Td>{v.approved ? <Status tone="verified">Approved</Status> : <Status tone="neutral">Not approved</Status>}</Td>
                  <Td className="pr-5 text-right"><ApprovalToggle id={v.id} approved={v.approved} /></Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <div className="px-5 pb-5"><Empty title="No vendors yet">Add the first one below, or import the vendor workbook.</Empty></div>
        )}
      </Section>
      <Section title="Add a vendor">
        <AddVendorForm />
      </Section>
    </div>
  );
}
