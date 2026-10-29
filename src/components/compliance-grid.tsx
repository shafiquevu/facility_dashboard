import Link from "next/link";
import type { GridState, Matrix } from "@/lib/api";
import { cn } from "@/lib/utils";
import { shortDay, storeLabel } from "@/lib/format";

// Stores down the side, inspection types across the top. Each cell is the
// worst state of the inspections in it, so a building with one overdue
// backflow test reads red however many other things are fine.

const CELL: Record<GridState, string> = {
  overdue: "bg-overdue-tint text-overdue ring-overdue/25",
  due_soon: "bg-soon-tint text-soon ring-soon/25",
  awaiting: "bg-awaiting-tint text-awaiting ring-awaiting/25",
  ok: "bg-verified-tint text-verified ring-verified/20",
  no_date: "hatch bg-surface text-graphite ring-line-strong",
};

const LEGEND: [GridState, string][] = [
  ["overdue", "Overdue"],
  ["due_soon", "Due within 60 days"],
  ["awaiting", "Proof in, to verify"],
  ["ok", "On schedule"],
  ["no_date", "No due date on file"],
];

function cellText(c: Matrix["cells"][number]): { main: string; sub: string } {
  if (c.state === "overdue") return { main: c.overdue > 1 ? `${c.overdue} overdue` : "Overdue", sub: c.next_due ? `since ${shortDay(c.next_due)}` : "" };
  if (c.state === "no_date") return { main: "No date", sub: c.count > 1 ? `${c.count} items` : "" };
  if (c.state === "awaiting") return { main: "To verify", sub: "" };
  return { main: c.next_due ? shortDay(c.next_due) : "Done", sub: c.undated ? `${c.undated} undated` : c.count > 1 ? `${c.count} items` : "" };
}

export function ComplianceGrid({ matrix, store }: { matrix: Matrix; store: string }) {
  if (!matrix.cells.length) {
    return <p className="px-5 pb-5 text-[13px] text-graphite">No inspections are on file yet. Import the facility workbook or add an inspection to see the grid.</p>;
  }
  const at = new Map(matrix.cells.map((c) => [`${c.store_code}|${c.category}`, c]));
  return (
    <div>
      <div className="overflow-x-auto px-5">
        <table className="w-full border-separate border-spacing-1" style={{ minWidth: 150 + matrix.categories.length * 92 }}>
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-36 bg-surface" />
              {matrix.categories.map((c) => (
                <th key={c.key} scope="col" className="px-1 pb-1 text-left align-bottom text-xs font-medium text-graphite">
                  {c.label.replace(/ (inspection|test|service|change|system test)$/i, "")}
                  {c.critical && <span className="ml-1 text-overdue" title="Critical: escalates to Kelly and Chris on day one">*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.stores.map((s) => (
              <tr key={s.code}>
                {/* Stays in view while the types scroll sideways on a narrow screen. */}
                <th scope="row" className="sticky left-0 z-10 max-w-40 bg-surface pr-2 text-left text-[13px] font-medium whitespace-nowrap text-ink">
                  <Link href={`/?store=${s.code}`} className="block truncate hover:text-brand" title={s.name}>{storeLabel(s.name)}</Link>
                </th>
                {matrix.categories.map((cat) => {
                  const c = at.get(`${s.code}|${cat.key}`);
                  if (!c) return <td key={cat.key} className="h-12 rounded-md bg-surface-sunk/60" aria-label="None on file" />;
                  const { main, sub } = cellText(c);
                  return (
                    <td key={cat.key} className="h-12 p-0">
                      <Link
                        href={c.state === "no_date" ? `/approvals?store=${s.code}` : `/recurring?store=${s.code}&q=${encodeURIComponent(cat.label)}`}
                        className={cn("flex h-full flex-col justify-center rounded-md px-2 ring-1 ring-inset transition-[filter] hover:brightness-95", CELL[c.state])}
                        title={`${storeLabel(s.name)}, ${cat.label}: ${main}${sub ? ` (${sub})` : ""}`}
                      >
                        <span className="num text-[12px] leading-tight font-semibold">{main}</span>
                        {sub && <span className="text-[11px] leading-tight opacity-80">{sub}</span>}
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 border-t border-line px-5 py-3">
        {LEGEND.map(([state, label]) => (
          <span key={state} className="inline-flex items-center gap-1.5 text-xs text-graphite">
            <span className={cn("size-3 rounded-[3px] ring-1 ring-inset", CELL[state])} aria-hidden="true" />
            {label}
          </span>
        ))}
        <span className="text-xs text-graphite"><span className="text-overdue">*</span> Critical</span>
        {store && <Link href="/" className="ml-auto text-xs font-medium text-brand hover:underline">Show all stores</Link>}
      </div>
    </div>
  );
}
