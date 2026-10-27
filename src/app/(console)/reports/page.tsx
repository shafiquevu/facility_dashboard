import Link from "next/link";
import { Suspense } from "react";
import { Download } from "lucide-react";
import { get, type StoreReport } from "@/lib/api";
import { cn } from "@/lib/utils";
import { day, money, storeLabel } from "@/lib/format";
import { access, attempt } from "@/lib/page";
import { Button } from "@/components/ui/button";
import { NoAccess } from "@/components/no-access";
import { Empty, ErrorState, Loading, PageHeader, Section, TableShell, Td, Th } from "@/components/kit";

export const metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Where each store stands, and the evidence file for the insurance renewal."
        actions={
          <Button asChild>
            <a href="/api/export"><Download /> Download renewal export</a>
          </Button>
        }
      />
      <Suspense fallback={<Loading rows={10} />}>
        <Content />
      </Suspense>
    </>
  );
}

type Reports = {
  today: string;
  stores: StoreReport[];
  pending_decisions: { store: string; item: string; finding: string; cost: string | null; days_waiting: number; warranty_implication: boolean }[];
};

const COLUMNS: [keyof StoreReport, string, "overdue" | "verified" | null][] = [
  ["open", "Open", null],
  ["overdue", "Overdue", "overdue"],
  ["critical_overdue", "Critical overdue", "overdue"],
  ["unassigned", "Unassigned", null],
  ["awaiting_verification", "To verify", null],
  ["completed_30_days", "Done, last 30 days", "verified"],
  ["no_due_date", "No due date", null],
  ["no_vendor", "No vendor", null],
];

async function Content() {
  if (!(await access())) return <NoAccess />;
  const result = await attempt(() => get<Reports>("/console/reports"));
  if (result.error !== null) return <ErrorState message={result.error} />;
  const r = result.data;
  const total = (k: keyof StoreReport) => r.stores.reduce((n, s) => n + Number(s[k]), 0);
  const worst = Math.max(1, ...r.stores.map((s) => s.open));

  return (
    <div className="space-y-5">
      <Section title="By store" description={`Live work orders as of ${day(r.today)}. The bar shows open work, the red part how much of it is overdue.`} flush>
        {r.stores.length ? (
          <TableShell minWidth={980}>
            <thead className="border-y border-line bg-surface-sunk">
              <tr>
                <Th className="pl-5">Store</Th>
                <Th className="w-44" />
                {COLUMNS.map(([, label]) => <Th key={label} className="text-right">{label}</Th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {r.stores.map((s) => (
                <tr key={s.store} className="hover:bg-surface-sunk/60">
                  <Td className="pl-5 font-medium"><Link href={`/?store=${s.store_code}`} className="hover:text-brand">{storeLabel(s.store)}</Link></Td>
                  <Td>
                    <span className="flex h-2 overflow-hidden rounded-full bg-surface-sunk" aria-hidden="true">
                      <span className="bg-overdue" style={{ width: `${(s.overdue / worst) * 100}%` }} />
                      <span className="bg-line-strong" style={{ width: `${((s.open - s.overdue) / worst) * 100}%` }} />
                    </span>
                  </Td>
                  {COLUMNS.map(([k, label, tone]) => (
                    <Td key={label} className={cn("num text-right", Number(s[k]) === 0 ? "text-faint" : tone === "overdue" ? "font-semibold text-overdue" : tone === "verified" ? "text-verified" : "")}>{s[k]}</Td>
                  ))}
                </tr>
              ))}
              <tr className="bg-surface-sunk font-semibold">
                <Td className="pl-5">All stores</Td>
                <Td />
                {COLUMNS.map(([k, label]) => <Td key={label} className="num text-right">{total(k)}</Td>)}
              </tr>
            </tbody>
          </TableShell>
        ) : (
          <div className="px-5 pb-5"><Empty title="No work orders yet" /></div>
        )}
      </Section>

      <Section title="Recommendations waiting on a decision" flush>
        {r.pending_decisions.length ? (
          <TableShell minWidth={720}>
            <thead className="border-y border-line bg-surface-sunk">
              <tr><Th className="pl-5">Store</Th><Th>Inspection</Th><Th>Finding</Th><Th className="text-right">Estimate</Th><Th className="pr-5 text-right">Days waiting</Th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {r.pending_decisions.map((d, i) => (
                <tr key={i}>
                  <Td className="pl-5">{storeLabel(d.store)}</Td>
                  <Td>{d.item}</Td>
                  <Td>{d.finding}{d.warranty_implication ? <span className="text-awaiting"> (warranty)</span> : ""}</Td>
                  <Td className="num text-right">{money(d.cost)}</Td>
                  <Td className={cn("num pr-5 text-right", d.days_waiting > 7 && "font-semibold text-overdue")}>{d.days_waiting}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        ) : (
          <div className="px-5 pb-5"><Empty title="Nothing waiting on a decision" /></div>
        )}
      </Section>
      <p className="text-xs text-graphite">The renewal export has one row per inspection, with links to its evidence, and opens in Excel.</p>
    </div>
  );
}
