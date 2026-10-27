import Link from "next/link";
import Form from "next/form";
import { Search } from "lucide-react";
import { get, type Counts, type WorkOrder } from "@/lib/api";
import { cn } from "@/lib/utils";
import { access, attempt, one, type SearchParams } from "@/lib/page";
import { NoAccess } from "@/components/no-access";
import { Empty, ErrorState, Section } from "@/components/kit";
import { WorkOrderTable } from "@/components/work-order-table";

const STATES = [
  ["", "All"],
  ["unassigned", "Unassigned"],
  ["in_progress", "In progress"],
  ["awaiting_verification", "To verify"],
  ["complete", "Complete"],
] as const;

const PRIORITY = { high: 0, medium: 1, low: 2 };
const STATE = { unassigned: 0, in_progress: 1, awaiting_verification: 2, complete: 3 };

function sortOrders(orders: WorkOrder[], sort: string, dir: string): WorkOrder[] {
  const key = (o: WorkOrder): string | number => {
    switch (sort) {
      case "number": return Number(o.number.replace(/\D/g, ""));
      case "store": return `${o.store} ${o.building}`;
      case "vendor": return o.vendor ?? "~";
      case "assigned_to": return o.assigned_to ?? "~";
      case "priority": return PRIORITY[o.priority];
      case "state": return o.overdue && o.state !== "complete" ? -1 : STATE[o.state];
      default: return o.due ?? "9999";
    }
  };
  const sign = dir === "desc" ? -1 : 1;
  return [...orders].sort((a, b) => {
    const x = key(a), y = key(b);
    return (x < y ? -1 : x > y ? 1 : 0) * sign;
  });
}

export async function WorkOrderList({
  searchParams,
  kind,
  basePath = "/work-orders",
}: {
  searchParams: SearchParams;
  kind?: "item" | "request";
  basePath?: string;
}) {
  if (!(await access())) return <NoAccess />;
  const params = await searchParams;
  const store = one(params.store);
  const state = one(params.state);
  const q = one(params.q);
  const due = one(params.due);
  const sort = one(params.sort) || "due";
  const dir = one(params.dir) || "asc";

  const result = await attempt(() => get<{ counts: Counts; work_orders: WorkOrder[] }>("/console/work-orders", { store, q }));
  if (result.error !== null) return <ErrorState message={result.error} />;

  let orders = result.data.work_orders;
  if (kind) orders = orders.filter((o) => o.kind === kind);
  const counts: Record<string, number> = { "": orders.length };
  for (const o of orders) counts[o.state] = (counts[o.state] ?? 0) + 1;
  if (state) orders = orders.filter((o) => o.state === state);
  if (due === "today") orders = orders.filter((o) => o.due_today);
  if (due === "overdue") orders = orders.filter((o) => o.overdue || o.due_today);
  orders = sortOrders(orders, sort, dir);

  const href = (next: Record<string, string>) => {
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries({ store, q, due, state, sort, dir, ...next })) {
      if (v && !(k === "sort" && v === "due") && !(k === "dir" && v === "asc")) query.set(k, v);
    }
    const text = query.toString();
    return text ? `${basePath}?${text}` : basePath;
  };

  return (
    <Section flush>
      <div className="flex flex-wrap items-center gap-3 px-5 py-3">
        <nav className="-ml-1 flex gap-0.5 overflow-x-auto" aria-label="Filter by status">
          {STATES.map(([key, label]) => (
            <Link
              key={key}
              href={href({ state: key })}
              aria-current={state === key ? "true" : undefined}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap",
                state === key ? "bg-ink text-white" : "text-graphite hover:bg-surface-sunk hover:text-ink",
              )}
            >
              {label}
              <span className={cn("num text-[11px]", state === key ? "text-white/70" : "text-faint")}>{counts[key] ?? 0}</span>
            </Link>
          ))}
        </nav>
        <Form action={basePath} className="relative ml-auto w-full sm:w-64">
          {store && <input type="hidden" name="store" value={store} />}
          {state && <input type="hidden" name="state" value={state} />}
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-faint" />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Filter by name, store, vendor"
            aria-label="Filter this list"
            className="h-8 w-full rounded-md border border-input bg-surface pr-2.5 pl-8 text-[13px] outline-none placeholder:text-faint focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15"
          />
        </Form>
      </div>
      {(due || q) && (
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-2 text-[13px] text-graphite">
          {due === "today" && "Due today"}
          {due === "overdue" && "Overdue or due today"}
          {q && <span>{due ? ", " : ""}matching &ldquo;{q}&rdquo;</span>}
          <Link href={href({ due: "", q: "" })} className="font-medium text-brand hover:underline">Clear filter</Link>
        </div>
      )}
      <WorkOrderTable
        orders={orders}
        sorting={{ sort, dir, href }}
        empty={<Empty title="Nothing in this view">Try another status, or clear the filter.</Empty>}
      />
    </Section>
  );
}
