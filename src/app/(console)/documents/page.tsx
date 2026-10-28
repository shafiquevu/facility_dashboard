import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { get, type DocumentRow } from "@/lib/api";
import { cn } from "@/lib/utils";
import { dateTime, storeLabel, words } from "@/lib/format";
import { access, attempt, one, withStore, type SearchParams } from "@/lib/page";
import { NoAccess } from "@/components/no-access";
import { Empty, ErrorState, Loading, PageHeader, Section, TableShell, Td, Th } from "@/components/kit";
import { workOrderHref } from "@/components/work-order-table";

export const metadata = { title: "Documents" };

export default function DocumentsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Documents" description="Every report, photo, certificate and proof on file. Each link opens the file for a few minutes." />
      <Suspense fallback={<Loading rows={10} />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

const SOURCES: Record<string, string> = {
  inspection: "Inspections",
  work_request: "Repairs",
  recommendation: "Recommendations",
  insurance: "Insurance",
};

async function Content({ searchParams }: { searchParams: SearchParams }) {
  if (!(await access())) return <NoAccess />;
  const params = await searchParams;
  const store = one(params.store);
  const source = one(params.source);
  const result = await attempt(() => get<{ documents: DocumentRow[] }>("/console/documents", { store }));
  if (result.error !== null) return <ErrorState message={result.error} />;
  const all = result.data.documents;
  const docs = source ? all.filter((d) => d.source === source) : all;

  return (
    <Section flush>
      <nav className="flex gap-0.5 overflow-x-auto px-4 py-3" aria-label="Filter by kind">
        {[["", "All"], ...Object.entries(SOURCES)].map(([key, label]) => (
          <Link
            key={key || "all"}
            href={withStore(key ? `/documents?source=${key}` : "/documents", store)}
            className={cn("flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap", source === key ? "bg-ink text-white" : "text-graphite hover:bg-surface-sunk hover:text-ink")}
          >
            {label}
            <span className={cn("num text-[11px]", source === key ? "text-white/70" : "text-faint")}>
              {key ? all.filter((d) => d.source === key).length : all.length}
            </span>
          </Link>
        ))}
      </nav>
      {docs.length ? (
        <TableShell minWidth={820}>
          <thead className="border-y border-line bg-surface-sunk">
            <tr><Th className="pl-5">Document</Th><Th>For</Th><Th>Store</Th><Th>Uploaded</Th><Th className="pr-5" /></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {docs.map((d, i) => (
              <tr key={i} className="hover:bg-surface-sunk/60">
                <Td className="pl-5">
                  <span className="flex items-center gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-sunk text-graphite"><FileText className="size-4" /></span>
                    <span>
                      <span className="block font-medium">{words(d.kind)}</span>
                      <span className="block text-xs text-graphite">{SOURCES[d.source] ?? words(d.source)}</span>
                    </span>
                  </span>
                </Td>
                <Td className="max-w-72">
                  {d.wo_kind && d.wo_id ? (
                    <Link href={workOrderHref({ kind: d.wo_kind, id: d.wo_id })} className="hover:text-brand">
                      <span className="block truncate">{d.subject}</span>
                      {d.number && <span className="num block text-xs text-graphite">{d.number}</span>}
                    </Link>
                  ) : <span className="block truncate">{d.subject}</span>}
                </Td>
                <Td>{d.store ? storeLabel(d.store) : <span className="text-faint">All stores</span>}</Td>
                <Td className="text-xs whitespace-nowrap">{d.uploaded_by ?? "Unknown"}<span className="block text-graphite">{dateTime(d.uploaded_at)}</span></Td>
                <Td className="pr-5 text-right">
                  {d.url && (
                    <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                      Open <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      ) : (
        <div className="px-5 pb-5">
          <Empty title="No documents on file yet">
            To add a past report, open the inspection from{" "}
            <Link href="/recurring" className="font-medium text-brand hover:underline">Recurring maintenance</Link> or{" "}
            <Link href="/approvals" className="font-medium text-brand hover:underline">Approvals</Link> and use
            Inspection history: enter the date and attach the PDF. Reports also arrive through completion links.
          </Empty>
        </div>
      )}
    </Section>
  );
}
