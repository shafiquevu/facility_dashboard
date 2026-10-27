import Link from "next/link";
import type { WorkOrder } from "@/lib/api";
import { cn } from "@/lib/utils";
import { day, dueLabel, storeLabel } from "@/lib/format";
import { Empty, PriorityLabel, SortHeader, TableShell, Td, Th, WorkOrderStatus } from "./kit";

export function workOrderHref(o: Pick<WorkOrder, "kind" | "id">) {
  return `/work-orders/${o.kind}/${o.id}`;
}

export function DueCell({ o }: { o: Pick<WorkOrder, "due" | "days_until_due" | "overdue" | "state"> }) {
  if (!o.due) return <span className="text-faint">No date</span>;
  const soon = o.days_until_due !== null && o.days_until_due >= 0 && o.days_until_due <= 7 && o.state !== "complete";
  return (
    <span className="whitespace-nowrap">
      <span className={cn("num", o.overdue ? "font-semibold text-overdue" : "text-ink")}>{day(o.due)}</span>
      {o.state !== "complete" && (o.overdue || soon) && (
        <span className={cn("block text-xs", o.overdue ? "text-overdue" : "text-soon")}>{dueLabel(o.days_until_due)}</span>
      )}
    </span>
  );
}

type Sorting = { sort: string; dir: string; href: (next: Record<string, string>) => string };

export function WorkOrderTable({
  orders,
  sorting,
  empty,
}: {
  orders: WorkOrder[];
  sorting?: Sorting;
  empty?: React.ReactNode;
}) {
  if (!orders.length) return <div className="px-5 pb-5">{empty ?? <Empty title="No work orders here" />}</div>;
  const head = (label: string, field: string, className?: string) =>
    sorting ? <SortHeader label={label} field={field} className={className} {...sorting} /> : <Th className={className}>{label}</Th>;
  return (
    <TableShell minWidth={900}>
      <thead className="border-y border-line bg-surface-sunk">
        <tr>
          {head("Work order", "number", "pl-5")}
          {head("Location", "store")}
          {head("Vendor", "vendor")}
          {head("Assigned to", "assigned_to")}
          {head("Priority", "priority")}
          {head("Status", "state")}
          {head("Due", "due", "pr-5")}
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {orders.map((o) => (
          <tr key={`${o.kind}-${o.id}`} className="group relative hover:bg-surface-sunk/70">
            <Td className="max-w-[340px] pl-5">
              <Link href={workOrderHref(o)} className="block after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand focus-visible:after:ring-inset">
                <span className="block truncate font-medium text-ink group-hover:text-brand">{o.title}</span>
                <span className="mt-0.5 flex items-center gap-2 text-xs text-graphite">
                  <span className="num shrink-0 whitespace-nowrap">{o.number}</span>
                  {(() => {
                    // The category often repeats the title ("Backflow Test" / "Backflow test").
                    const cat = o.category.toLowerCase() === o.title.toLowerCase() ? "" : o.category;
                    const extra = [cat, o.asset].filter(Boolean).join(", ");
                    return extra ? <span className="truncate">{extra}</span> : null;
                  })()}
                  {o.critical && <span className="font-medium text-overdue">Critical</span>}
                </span>
              </Link>
            </Td>
            <Td>
              <span className="block whitespace-nowrap">{storeLabel(o.store)}</span>
              <span className="block text-xs text-graphite">{o.building}</span>
            </Td>
            <Td className="max-w-[180px] truncate">{o.vendor ?? <span className="text-faint">None</span>}</Td>
            <Td className="whitespace-nowrap">{o.assigned_to ?? <span className="text-faint">Nobody</span>}</Td>
            <Td><PriorityLabel priority={o.priority} /></Td>
            <Td><WorkOrderStatus state={o.state} overdue={o.overdue} /></Td>
            <Td className="pr-5"><DueCell o={o} /></Td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  );
}
