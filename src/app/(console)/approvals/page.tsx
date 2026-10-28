import Link from "next/link";
import { Suspense } from "react";
import { get, type Approvals, type Meta } from "@/lib/api";
import { day, locationLabel, money, words } from "@/lib/format";
import { access, attempt, one, type SearchParams } from "@/lib/page";
import { NoAccess } from "@/components/no-access";
import { Chip, Empty, ErrorState, Loading, PageHeader, Section } from "@/components/kit";
import { WorkOrderTable } from "@/components/work-order-table";
import { DecisionForm } from "../work-orders/[kind]/[id]/forms";
import { ProposedItemForms, VendorApproveForm } from "./forms";

export const metadata = { title: "Approvals" };

export default function ApprovalsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="Approvals" description="Everything that is waiting on a McGrath decision or sign-off." />
      <Suspense fallback={<Loading rows={10} />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

function Count({ n }: { n: number }) {
  return <span className="num ml-1.5 text-graphite">{n}</span>;
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  if (!(await access())) return <NoAccess />;
  const store = one((await searchParams).store);
  const result = await attempt(() => Promise.all([
    get<Approvals>("/console/approvals", { store }),
    get<Meta>("/console/meta"),
  ]));
  if (result.error !== null) return <ErrorState message={result.error} />;
  const [a, meta] = result.data;
  const imported = a.proposed_items.filter((p) => p.source === "import");
  const proposed = a.proposed_items.filter((p) => p.source !== "import");

  return (
    <div className="space-y-5">
      <Section title={<>Work to verify<Count n={a.verify.length} /></>} description="Proof is in. Open each one, check the documents, and sign it off or send it back." flush>
        <WorkOrderTable orders={a.verify} empty={<Empty title="Nothing to verify">Proof that arrives through a completion link lands here.</Empty>} />
      </Section>

      <Section title={<>Recommendations to decide<Count n={a.decisions.length} /></>} description="Each decision needs a reason, and is kept as the record.">
        {a.decisions.length ? (
          <ul className="space-y-3">
            {a.decisions.map((d) => (
              <li key={d.id} className="rounded-lg border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[14px] font-medium">{d.finding}</span>
                  {d.warranty_implication && <Chip tone="awaiting">Warranty, {d.warranty_docs} document{d.warranty_docs === 1 ? "" : "s"}</Chip>}
                  <Chip tone={d.days_waiting > 7 ? "overdue" : "soon"}>Waiting {d.days_waiting} day{d.days_waiting === 1 ? "" : "s"}</Chip>
                </div>
                <p className="mt-1 text-xs text-graphite">
                  {d.item}, {locationLabel(d.store, d.building)}. Estimated {money(d.cost)}, raised {day(d.raised_on)}{d.approver ? `, for ${d.approver}` : ""}.
                </p>
                <DecisionForm id={d.id} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="No recommendations waiting" />
        )}
      </Section>

      <Section
        title={<>Inspections waiting for a due date<Count n={imported.length} /></>}
        description="Imported from the facility workbook. Set the date each inspection is due and who is responsible, then start it: they are reminded 30, 14 and 7 days before the due date and on the day. Nothing is sent until then."
        flush
      >
        {imported.length ? (
          <ul className="divide-y divide-line border-t border-line">
            {imported.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <Link href={`/work-orders/item/${p.id}`} className="text-[13px] font-medium hover:text-brand">{p.item}</Link>
                  <p className="text-xs text-graphite">
                    {locationLabel(p.store, p.building)}. {words(p.frequency)}, {p.vendor ?? "no vendor"}{p.last_completed ? `, last done ${day(p.last_completed)}` : ""}
                  </p>
                </div>
                <ProposedItemForms id={p.id} nextDue={p.next_due} imported meta={meta} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 pb-5"><Empty title="Every imported inspection has a date" /></div>
        )}
      </Section>

      <Section title={<>Added by stores<Count n={proposed.length} /></>} description="Proposed through the store form. Nothing reminds anyone until it is approved with a due date." flush>
        {proposed.length ? (
          <ul className="divide-y divide-line border-t border-line">
            {proposed.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <Link href={`/work-orders/item/${p.id}`} className="text-[13px] font-medium hover:text-brand">{p.item}</Link>
                  <p className="text-xs text-graphite">
                    {p.category}, {words(p.frequency)}. {locationLabel(p.store, p.building)}. Proposed by {p.proposed_by ?? "a store"} on {day(p.created_at.slice(0, 10))}
                  </p>
                </div>
                <ProposedItemForms id={p.id} nextDue={p.next_due} imported={false} meta={meta} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 pb-5"><Empty title="No store proposals waiting" /></div>
        )}
      </Section>

      <Section title={<>Vendors not yet approved<Count n={a.unapproved_vendors.length} /></>} description="A vendor is cleared to work once it is approved and has a current certificate." flush>
        {a.unapproved_vendors.length ? (
          <ul className="divide-y divide-line border-t border-line">
            {a.unapproved_vendors.map((v) => (
              <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <Link href={`/vendors#${v.id}`} className="text-[13px] font-medium hover:text-brand">{v.name}</Link>
                  <p className="text-xs text-graphite">
                    {v.services.join(", ") || "No services listed"}. {v.phone ?? "No phone"}. Certificate {v.cover_until ? `until ${day(v.cover_until)}` : "not on file"}.
                  </p>
                </div>
                <VendorApproveForm id={v.id} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-5 pb-5"><Empty title="Every vendor is approved" /></div>
        )}
      </Section>
    </div>
  );
}
