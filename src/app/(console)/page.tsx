import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { get, type CalendarEvent, type Meta, type Overview } from "@/lib/api";
import { cn } from "@/lib/utils";
import { dateTime, day, locationLabel, storeLabel, subjectLabel, verb } from "@/lib/format";
import { access, attempt, one, withStore, type SearchParams } from "@/lib/page";
import { Button } from "@/components/ui/button";
import { NoAccess } from "@/components/no-access";
import { ComplianceGrid } from "@/components/compliance-grid";
import { AssetStatusLabel, CoiStatusLabel, Empty, ErrorState, Loading, PageHeader, PriorityLabel, Section, TextLink } from "@/components/kit";
import { WorkOrderTable, workOrderHref } from "@/components/work-order-table";

export default function OverviewPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={<><PageHeader title="Overview" /><Loading rows={14} /></>}>
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

function longDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  if (!(await access())) return <NoAccess />;
  const store = one((await searchParams).store);

  const result = await attempt(async () => {
    const [overview, meta] = await Promise.all([
      get<Overview>("/console/overview", { store }),
      get<Meta>("/console/meta"),
    ]);
    return { overview, meta, upcoming: overview.schedule };
  });
  if (result.error !== null) return <><PageHeader title="Overview" /><ErrorState message={result.error} /></>;
  const { overview: o, meta, upcoming } = result.data;
  const k = o.kpis;
  const s = (href: string) => withStore(href, store);
  const storeName = meta.stores.find((x) => x.short_code === store)?.name;
  const notCurrent = o.compliance.filter((v) => v.coi_status !== "valid");

  const stats: { label: string; value: number; note: string; href: string; tone?: "overdue" | "awaiting" }[] = [
    { label: "Open work orders", value: k.open_work_orders, note: `${k.unassigned} with nobody assigned`, href: s("/work-orders") },
    { label: "Overdue", value: k.overdue, note: k.critical_overdue ? `${k.critical_overdue} of them critical` : "none critical", href: s("/work-orders?due=overdue"), tone: k.overdue ? "overdue" : undefined },
    { label: "Due today", value: k.due_today, note: "still open", href: s("/work-orders?due=today") },
    { label: "Waiting on you", value: k.pending_approvals, note: "to verify or decide", href: s("/approvals"), tone: k.pending_approvals ? "awaiting" : undefined },
    { label: "Insurance not current", value: k.expired_cois + k.expiring_cois, note: `${k.expired_cois} expired or missing`, href: s("/compliance"), tone: k.expired_cois ? "overdue" : undefined },
    { label: "Inspections due", value: k.upcoming_inspections, note: "in the next 30 days", href: s("/calendar") },
  ];

  const byDay = new Map<string, CalendarEvent[]>();
  for (const e of upcoming) byDay.set(e.date, [...(byDay.get(e.date) ?? []), e]);

  return (
    <>
      <PageHeader
        title={storeName ? storeLabel(storeName) : "All stores"}
        description={`Facility maintenance as of ${longDay(o.today)}`}
        actions={
          <Button asChild>
            <Link href={s("/work-orders/new")}><Plus /> New work order</Link>
          </Button>
        }
      />

      <div className="space-y-5">
        <section className="panel grid grid-cols-2 divide-line sm:grid-cols-3 xl:grid-cols-6 xl:divide-x" aria-label="Summary">
          {stats.map((st, i) => (
            <Link
              key={st.label}
              href={st.href}
              className={cn("group px-5 py-4 hover:bg-surface-sunk/70", i >= 2 && "border-t border-line sm:border-t-0", i >= 3 && "sm:border-t xl:border-t-0")}
            >
              <span className="block text-[13px] text-graphite group-hover:text-ink">{st.label}</span>
              <span className={cn("num mt-1 block text-[30px] leading-none font-semibold", st.tone === "overdue" ? "text-overdue" : st.tone === "awaiting" ? "text-awaiting" : "text-ink")}>
                {st.value}
              </span>
              <span className="mt-1.5 block text-xs text-graphite">{st.note}</span>
            </Link>
          ))}
        </section>

        <div className="grid gap-5 min-[1800px]:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <Section
            title="Compliance by store"
            description="Every inspection on file, by store and type. Select a cell to see the items behind it."
            flush
          >
            <ComplianceGrid matrix={o.matrix} store={store} />
          </Section>

          <Section title="Needs attention" description="Overdue or due today" actions={<TextLink href={s("/work-orders?due=overdue")}>See all</TextLink>} flush>
            {o.outstanding.length ? (
              <ul className="divide-y divide-line border-t border-line">
                {o.outstanding.map((w) => (
                  <li key={`${w.kind}-${w.id}`}>
                    <Link href={workOrderHref(w)} className="group flex items-start gap-3 px-5 py-3 hover:bg-surface-sunk/70">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-ink group-hover:text-brand">{w.title}</span>
                        <span className="mt-0.5 block truncate text-xs text-graphite">{locationLabel(w.store, w.building)}</span>
                        <span className="mt-1.5 flex items-center gap-3">
                          <PriorityLabel priority={w.priority} />
                          <span className="text-xs text-graphite">{w.vendor ?? "No vendor"}</span>
                        </span>
                      </span>
                      <span className={cn("num shrink-0 text-right text-[13px] font-semibold", w.overdue ? "text-overdue" : "text-soon")}>
                        {w.overdue ? `${-(w.days_until_due ?? 0)}d` : "Today"}
                        <span className="block text-[11px] font-normal">{w.overdue ? "overdue" : "due"}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 pb-5"><Empty title="Nothing overdue">Every open item is inside its due date.</Empty></div>
            )}
          </Section>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="Visits in the next two weeks" actions={<TextLink href={s("/calendar")}>Open calendar</TextLink>}>
            {upcoming.length ? (
              <ol className="relative space-y-4 border-l border-line pl-5">
                {[...byDay.entries()].map(([date, events]) => (
                  <li key={date} className="relative">
                    <span className="absolute top-1 -left-[25px] size-2.5 rounded-full border-2 border-surface bg-line-strong" aria-hidden="true" />
                    <p className="text-xs font-medium text-graphite">{longDay(date)}</p>
                    <ul className="mt-1.5 space-y-1.5">
                      {events.map((e) => (
                        <li key={`${e.kind}-${e.id}`} className="flex items-baseline gap-2 text-[13px]">
                          <span className={cn("size-1.5 shrink-0 translate-y-[-1px] rounded-full", e.overdue ? "bg-overdue" : e.kind === "asset" ? "bg-awaiting" : e.critical ? "bg-soon" : "bg-brand")} aria-hidden="true" />
                          <Link href={e.kind === "asset" ? s("/assets") : workOrderHref({ kind: e.kind, id: e.id })} className="truncate font-medium text-ink hover:text-brand">
                            {e.title}
                          </Link>
                          <span className="truncate text-xs text-graphite">{storeLabel(e.store)}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty title="No visits booked in the next 14 days">Book a visit on an inspection's page and it shows here.</Empty>
            )}
          </Section>

          <Section title="Missing from the records" description="Gaps that stop reminders and escalations from working">
            {o.gaps.length ? (
              <ul className="-my-3 divide-y divide-line">
                {o.gaps.map((g) => (
                  <li key={g.key}>
                    <Link href={s(g.href)} className="group flex items-start gap-4 py-3">
                      <span className="num w-10 shrink-0 text-right text-[22px] leading-none font-semibold text-ink">{g.count}</span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-ink group-hover:text-brand">{g.label}</span>
                        <span className="block text-xs text-graphite">{g.why}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="The records are complete">Every inspection has a date, owner and vendor, and every vendor is reachable and insured.</Empty>
            )}
          </Section>
        </div>

        <Section
          title="Open work orders"
          description="Soonest due first"
          actions={<TextLink href={s("/work-orders")}>See all {o.work_order_counts.all - o.work_order_counts.complete}</TextLink>}
          flush
        >
          <WorkOrderTable orders={o.work_orders} empty={<Empty title="No open work orders" />} />
        </Section>

        <div className="grid gap-5 xl:grid-cols-2">
          <Section title="Vendor insurance" description="Vendors without a current certificate" actions={<TextLink href={s("/compliance")}>See all</TextLink>} flush>
            {notCurrent.length ? (
              <ul className="divide-y divide-line border-t border-line">
                {notCurrent.slice(0, 7).map((v) => (
                  <li key={v.id} className="flex items-center gap-4 px-5 py-2.5">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">{v.name}</span>
                      <span className="block truncate text-xs text-graphite">{v.stores.length ? v.stores.map(storeLabel).join(", ") : "No stores linked"}</span>
                    </span>
                    <span className="num w-24 text-right text-[13px] text-graphite">{day(v.cover_until, "")}</span>
                    <span className="w-28"><CoiStatusLabel status={v.coi_status} /></span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 pb-5"><Empty title="Every vendor is insured" /></div>
            )}
          </Section>

          <Section title="Recent activity" actions={<TextLink href={s("/history")}>Audit trail</TextLink>} flush>
            {o.activity.length ? (
              <ul className="divide-y divide-line border-t border-line">
                {o.activity.map((e) => (
                  <li key={e.id} className="flex items-start gap-3 px-5 py-2.5">
                    <span className="min-w-0 flex-1 text-[13px]">
                      <span className="font-medium text-ink">{e.actor ?? "System"}</span>{" "}
                      <span className="text-graphite">{verb(e.verb).toLowerCase()}</span>{" "}
                      <span className="text-ink">{e.subject ?? subjectLabel(e.subject_type)}</span>
                    </span>
                    <time className="shrink-0 text-xs text-faint" dateTime={e.occurred_at}>{dateTime(e.occurred_at)}</time>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 pb-5"><Empty title="No activity yet" /></div>
            )}
          </Section>
        </div>

        {o.assets.length > 0 && (
          <Section title="Equipment" actions={<TextLink href={s("/assets")}>See all</TextLink>} flush>
            <ul className="grid divide-y divide-line border-t border-line md:grid-cols-2 md:divide-y-0">
              {o.assets.map((a) => (
                <li key={a.id} className="flex items-center gap-3 border-line px-5 py-2.5 md:border-b">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{a.name}</span>
                    <span className="block truncate text-xs text-graphite">{storeLabel(a.store)}, next service {day(a.next_service, "not set")}</span>
                  </span>
                  <AssetStatusLabel status={a.service_status} />
                </li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </>
  );
}
