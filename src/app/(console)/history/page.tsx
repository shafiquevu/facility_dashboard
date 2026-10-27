import Link from "next/link";
import { Suspense } from "react";
import { get, type ActivityEvent } from "@/lib/api";
import { cn } from "@/lib/utils";
import { dateTime, storeLabel, subjectLabel, verb } from "@/lib/format";
import { access, attempt, one, withStore, type SearchParams } from "@/lib/page";
import { Button } from "@/components/ui/button";
import { NoAccess } from "@/components/no-access";
import { Empty, ErrorState, Loading, PageHeader, Section, TableShell, Td, Th } from "@/components/kit";
import { workOrderHref } from "@/components/work-order-table";

export const metadata = { title: "Audit trail" };

export default function HistoryPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Audit trail" description="Who did what, and when. Entries cannot be edited or deleted, by anyone." />
      <Suspense fallback={<Loading rows={12} />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const TYPES = [
  ["", "Everything"],
  ["facility_item", "Inspections"],
  ["work_request", "Repairs"],
  ["recommendation", "Recommendations"],
  ["certificate_of_insurance", "Insurance"],
  ["vendor", "Vendors"],
  ["asset", "Equipment"],
] as const;

function linkFor(e: ActivityEvent): string | null {
  if (e.subject_type === "facility_item") return workOrderHref({ kind: "item", id: e.subject_id });
  if (e.subject_type === "work_request") return workOrderHref({ kind: "request", id: e.subject_id });
  if (e.subject_type === "asset") return `/assets#${e.subject_id}`;
  if (e.subject_type === "vendor") return `/vendors#${e.subject_id}`;
  if (e.subject_type === "certificate_of_insurance") return "/compliance";
  return null;
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  if (!(await access())) return <NoAccess />;
  const params = await searchParams;
  const store = one(params.store);
  const type = one(params.type);
  const before = one(params.before);
  const result = await attempt(() =>
    get<{ events: ActivityEvent[]; next_before: number | null }>("/console/activity", { store, subject_type: type, before, limit: "50" }),
  );
  if (result.error !== null) return <ErrorState message={result.error} />;
  const { events, next_before } = result.data;
  const href = (next: Record<string, string>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ type, ...next })) if (v) q.set(k, v);
    return withStore(`/history${q.size ? `?${q}` : ""}`, store);
  };

  return (
    <Section flush>
      <nav className="flex gap-0.5 overflow-x-auto px-4 py-3" aria-label="Filter by record">
        {TYPES.map(([key, label]) => (
          <Link
            key={key || "all"}
            href={href({ type: key })}
            className={cn("flex h-7 items-center rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap", type === key ? "bg-ink text-white" : "text-graphite hover:bg-surface-sunk hover:text-ink")}
          >
            {label}
          </Link>
        ))}
      </nav>
      {events.length ? (
        <TableShell minWidth={820}>
          <thead className="border-y border-line bg-surface-sunk">
            <tr><Th className="pl-5">When</Th><Th>Who</Th><Th>What</Th><Th>Record</Th><Th className="pr-5">Store</Th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {events.map((e) => {
              const to = linkFor(e);
              return (
                <tr key={e.id} className="hover:bg-surface-sunk/60">
                  <Td className="num pl-5 text-xs whitespace-nowrap text-graphite">{dateTime(e.occurred_at)}</Td>
                  <Td className="font-medium whitespace-nowrap">{e.actor ?? "System"}</Td>
                  <Td>{verb(e.verb)}</Td>
                  <Td className="max-w-96">
                    <span className="block text-xs text-graphite">{subjectLabel(e.subject_type)}{e.number ? ` ${e.number}` : ""}</span>
                    {to ? <Link href={to} className="block truncate hover:text-brand">{e.subject ?? "Unnamed"}</Link> : <span className="block truncate">{e.subject ?? "Unnamed"}</span>}
                  </Td>
                  <Td className="pr-5 text-xs whitespace-nowrap">{e.store ? storeLabel(e.store) : <span className="text-faint">All stores</span>}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      ) : (
        <div className="px-5 pb-5"><Empty title="Nothing recorded in this view yet" /></div>
      )}
      {(before || next_before) && (
        <div className="flex gap-2 border-t border-line px-5 py-3">
          {before && <Button variant="outline" size="sm" asChild><Link href={href({ before: "" })}>Newest</Link></Button>}
          {next_before && <Button variant="outline" size="sm" asChild><Link href={href({ before: String(next_before) })}>Older entries</Link></Button>}
        </div>
      )}
    </Section>
  );
}
