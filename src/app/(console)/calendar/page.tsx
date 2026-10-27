import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { get, type CalendarEvent } from "@/lib/api";
import { cn } from "@/lib/utils";
import { storeLabel } from "@/lib/format";
import { access, attempt, one, withStore, type SearchParams } from "@/lib/page";
import { Button } from "@/components/ui/button";
import { NoAccess } from "@/components/no-access";
import { ErrorState, Loading, PageHeader } from "@/components/kit";
import { workOrderHref } from "@/components/work-order-table";

export const metadata = { title: "Calendar" };

export default function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<><PageHeader title="Calendar" /><Loading rows={12} /></>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

const iso = (d: Date) => d.toISOString().slice(0, 10);

function chip(e: CalendarEvent) {
  if (e.overdue) return "bg-overdue-tint text-overdue";
  if (e.kind === "asset") return "bg-awaiting-tint text-awaiting";
  if (e.critical) return "bg-soon-tint text-soon";
  return "bg-brand-tint text-brand";
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  if (!(await access())) return <NoAccess />;
  const params = await searchParams;
  const store = one(params.store);
  const monthParam = one(params.month);
  await connection(); // "today" is read per request, never baked into a prerender
  const now = new Date();
  const [y, m] = /^\d{4}-\d{2}$/.test(monthParam)
    ? monthParam.split("-").map(Number)
    : [now.getUTCFullYear(), now.getUTCMonth() + 1];

  const first = new Date(Date.UTC(y, m - 1, 1));
  const gridStart = new Date(first);
  gridStart.setUTCDate(1 - ((first.getUTCDay() + 6) % 7)); // the Monday on or before the 1st
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setUTCDate(gridStart.getUTCDate() + i);
    return d;
  });

  const result = await attempt(() =>
    get<{ events: CalendarEvent[] }>("/console/calendar", { start: iso(days[0]), end: iso(days[41]), store }),
  );
  if (result.error !== null) return <><PageHeader title="Calendar" /><ErrorState message={result.error} /></>;
  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of result.data.events) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);
  const inMonth = result.data.events.filter((e) => Number(e.date.slice(5, 7)) === m).length;

  const monthHref = (offset: number) => {
    const d = new Date(Date.UTC(y, m - 1 + offset, 1));
    return withStore(`/calendar?month=${iso(d).slice(0, 7)}`, store);
  };
  const today = iso(now);
  const title = first.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <>
      <PageHeader
        title={title}
        description={`${inMonth} open item${inMonth === 1 ? "" : "s"} due this month, by due date`}
        actions={
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" asChild><Link href={monthHref(-1)} aria-label="Previous month"><ChevronLeft /></Link></Button>
            <Button variant="outline" asChild><Link href={withStore("/calendar", store)}>This month</Link></Button>
            <Button variant="outline" size="icon" asChild><Link href={monthHref(1)} aria-label="Next month"><ChevronRight /></Link></Button>
          </div>
        }
      />
      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <div className="grid min-w-[860px] grid-cols-7">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
              <div key={d} className="border-b border-line bg-surface-sunk px-3 py-2 text-xs font-medium text-graphite">{d}</div>
            ))}
            {days.map((d, i) => {
              const key = iso(d);
              const events = byDay.get(key) ?? [];
              const thisMonth = d.getUTCMonth() === m - 1;
              return (
                <div key={key} className={cn("min-h-30 border-b border-line p-2", i % 7 !== 6 && "border-r", !thisMonth && "bg-surface-sunk/50")}>
                  <div className={cn("num mb-1.5 inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold", key === today ? "bg-brand text-white" : thisMonth ? "text-ink" : "text-faint")}>
                    {d.getUTCDate()}
                  </div>
                  <ul className="space-y-1">
                    {events.slice(0, 4).map((e) => (
                      <li key={`${e.kind}-${e.id}`}>
                        <Link
                          href={e.kind === "asset" ? withStore("/assets", store) : workOrderHref({ kind: e.kind, id: e.id })}
                          title={`${e.title}, ${storeLabel(e.store)}`}
                          className={cn("block truncate rounded px-1.5 py-0.5 text-[11px] font-medium hover:brightness-95", chip(e))}
                        >
                          {e.title}
                        </Link>
                      </li>
                    ))}
                    {events.length > 4 && <li className="px-1.5 text-[11px] text-graphite">{events.length - 4} more</li>}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap gap-5 px-5 py-3 text-xs text-graphite">
          {[["bg-brand", "Work order"], ["bg-soon", "Critical inspection"], ["bg-awaiting", "Equipment service"], ["bg-overdue", "Overdue"]].map(([dot, label]) => (
            <span key={label} className="inline-flex items-center gap-1.5"><span className={cn("size-2 rounded-full", dot)} />{label}</span>
          ))}
        </div>
      </section>
    </>
  );
}
