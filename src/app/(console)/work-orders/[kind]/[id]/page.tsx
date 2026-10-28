import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ChevronRight, ExternalLink, FileText } from "lucide-react";
import { get, type Meta, type WorkOrderDetail } from "@/lib/api";
import { dateTime, day, dueLabel, money, verb, words } from "@/lib/format";
import { access, attempt } from "@/lib/page";
import { NoAccess } from "@/components/no-access";
import { Chip, Empty, ErrorState, Loading, PriorityLabel, Section, WorkOrderStatus } from "@/components/kit";
import { AssignForm, AttachReportForm, CopyLink, DecisionForm, RecordInspectionForm, RequestUpload, VerifyForm } from "./forms";

export default function WorkOrderPage({ params }: { params: Promise<{ kind: string; id: string }> }) {
  return (
    <Suspense fallback={<Loading rows={12} />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: Promise<{ kind: string; id: string }> }) {
  if (!(await access())) return <NoAccess />;
  const { kind, id } = await params;
  if (kind !== "item" && kind !== "request") notFound();

  const result = await attempt(async () => {
    const [order, meta] = await Promise.all([
      get<WorkOrderDetail>(`/console/work-orders/${kind}/${id}`),
      get<Meta>("/console/meta"),
    ]);
    return { order, meta };
  });
  if (result.error !== null) {
    if (result.error === "not found") notFound();
    return <ErrorState message={result.error} />;
  }
  const { order: o, meta } = result.data;
  const waiting = o.state === "awaiting_verification";
  const facts: [string, React.ReactNode][] = [
    ["Location", <>{o.store}<span className="block text-xs text-graphite">{o.building}</span></>],
    ["Due", <>{day(o.due, "No due date")}{o.state !== "complete" && o.due && <span className={`block text-xs ${o.overdue ? "text-overdue" : "text-graphite"}`}>{dueLabel(o.days_until_due)}</span>}</>],
    ["Assigned to", o.assigned_to ?? <span className="text-faint">Nobody</span>],
    ["Vendor", o.vendor ?? <span className="text-faint">None</span>],
    ["Priority", <PriorityLabel key="p" priority={o.priority} />],
    ["Result", words(o.result)],
    ["Equipment", o.asset ?? <span className="text-faint">None</span>],
    ...(o.kind === "item"
      ? ([
          ["Repeats", words(o.frequency)],
          ["Last completed", day(o.last_completed)],
          ["Verified by", o.approved_by ? <>{o.approved_by}<span className="block text-xs text-graphite">{day(o.approved_on)}</span></> : <span className="text-faint">Not yet</span>],
        ] as [string, React.ReactNode][])
      : ([
          ["Raised by", <>{o.submitted_by ?? "Unknown"}<span className="block text-xs text-graphite">{day(o.submitted_on)}</span></>],
          ["Notes", o.notes ?? <span className="text-faint">None</span>],
        ] as [string, React.ReactNode][])),
  ];

  return (
    <>
      <nav className="mb-3 flex items-center gap-1 text-[13px] text-graphite" aria-label="Breadcrumb">
        <Link href={o.kind === "item" ? (o.live === false ? "/approvals" : "/recurring") : "/work-requests"} className="hover:text-ink">
          {o.kind === "item" ? (o.live === false ? "Approvals" : "Recurring maintenance") : "Work requests"}
        </Link>
        <ChevronRight className="size-3.5 text-faint" />
        <span className="num text-ink">{o.number}</span>
      </nav>

      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="display text-[26px] leading-tight font-semibold">{o.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <WorkOrderStatus state={o.state} overdue={o.overdue} />
            {o.kind === "request" ? <span className="text-[13px] text-graphite">{words(o.urgency)} repair</span>
              : o.category.toLowerCase() !== o.title.toLowerCase() && <span className="text-[13px] text-graphite">{o.category}</span>}
            {o.critical && <Chip tone="overdue">Critical</Chip>}
            {o.live === false && <Chip tone="neutral">Not started yet</Chip>}
          </div>
        </div>
      </header>

      {o.failure_reason && (
        <div role="note" className="mb-5 rounded-xl border border-overdue/25 bg-overdue-tint px-5 py-3 text-[13px] text-overdue">
          <span className="font-semibold">Sent back or failed:</span> {o.failure_reason}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <section className="panel grid grid-cols-2 gap-x-6 gap-y-4 p-5 md:grid-cols-3" aria-label="Details">
            {facts.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <p className="text-xs text-graphite">{label}</p>
                <div className="mt-0.5 text-[13px] font-medium text-ink">{value}</div>
              </div>
            ))}
          </section>

          {o.kind === "item" && (
            <Section
              title="Inspection history"
              description="Past inspections and their reports, kept for reference. Record this year's here, with the PDF."
              flush
            >
              {o.records?.length ? (
                <ul className="divide-y divide-line border-t border-line">
                  {o.records.map((r) => (
                    <li key={r.id} className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="num text-[14px] font-semibold text-ink">{day(r.completed_on)}</span>
                        <Chip tone={r.result === "failed" ? "overdue" : r.result === "passed" ? "verified" : "soon"}>{words(r.result)}</Chip>
                        {r.vendor && <span className="text-[13px] text-graphite">{r.vendor}</span>}
                      </div>
                      {r.notes && <p className="mt-1 text-[13px] whitespace-pre-line text-ink">{r.notes}</p>}
                      <p className="mt-1 text-xs text-faint">Recorded by {r.recorded_by}, {dateTime(r.created_at)}</p>
                      {r.documents.length ? (
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {r.documents.map((d, i) => (
                            <li key={i}>
                              {d.url && (
                                <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[13px] font-medium text-brand hover:bg-surface-sunk">
                                  <FileText className="size-3.5" /> {words(d.kind)} <ExternalLink className="size-3" />
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <AttachReportForm id={o.id} recordId={r.id} />
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 pb-4"><Empty title="No past inspections recorded">Add this year&apos;s below: the date, the result and the PDF report.</Empty></div>
              )}
              <RecordInspectionForm id={o.id} meta={meta} />
            </Section>
          )}

          <Section
            title="Documents"
            description={
              o.kind === "item" && o.required_documents?.length
                ? `Needed to close: ${o.required_documents.map(words).join(", ")}`
                : "Reports, photos and proof of completion"
            }
            flush
          >
            {o.documents.length ? (
              <ul className="divide-y divide-line border-t border-line">
                {o.documents.map((d) => (
                  <li key={d.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-sunk text-graphite"><FileText className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium text-ink">{words(d.kind)}</span>
                      <span className="block text-xs text-graphite">{d.uploaded_by ?? "Unknown"}, {dateTime(d.uploaded_at)}</span>
                    </span>
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                        Open <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-5 pb-5"><Empty title="No documents yet">{o.kind === "item" ? "They arrive through the completion link." : "Upload the proof below once the work is done."}</Empty></div>
            )}
            {o.kind === "request" && o.state !== "complete" && <RequestUpload id={o.id} />}
          </Section>

          {o.kind === "item" && o.recommendations.length > 0 && (
            <Section title="Recommendations" description="Findings raised during the inspection">
              <ul className="space-y-3">
                {o.recommendations.map((r) => (
                  <li key={r.id} className="rounded-lg border border-line p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-medium">{r.finding}</span>
                      {r.warranty_implication && <Chip tone="awaiting">Warranty</Chip>}
                      {r.decision ? (
                        <Chip tone={r.decision === "decline" ? "neutral" : r.decision === "defer" ? "soon" : "verified"}>{{ approve: "Approved", defer: "Deferred", decline: "Declined" }[r.decision] ?? words(r.decision)}</Chip>
                      ) : (
                        <Chip tone="soon">Needs a decision</Chip>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-graphite">
                      Raised {day(r.raised_on)}, estimated {money(r.cost)}{r.vendor_proposal ? `. Vendor proposes: ${r.vendor_proposal}` : ""}
                    </p>
                    {r.decision ? (
                      <p className="mt-2 text-[13px] text-ink">{r.decided_by} on {day(r.decided_on)}: {r.reason}{r.review_date ? `. Back on ${day(r.review_date)}.` : ""}</p>
                    ) : (
                      <DecisionForm id={r.id} />
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Section title="History">
            {o.history.length ? (
              <ol className="relative space-y-4 border-l border-line pl-5">
                {o.history.map((h, i) => (
                  <li key={i} className="relative">
                    <span className="absolute top-1.5 -left-[25px] size-2.5 rounded-full border-2 border-surface bg-brand" aria-hidden="true" />
                    <p className="text-[13px]"><span className="font-medium text-ink">{verb(h.verb)}</span> <span className="text-graphite">by {h.actor ?? "the system"}</span></p>
                    <time className="text-xs text-faint" dateTime={h.occurred_at}>{dateTime(h.occurred_at)}</time>
                  </li>
                ))}
              </ol>
            ) : (
              <Empty title="No history yet" />
            )}
          </Section>
        </div>

        <aside className="space-y-5">
          {waiting && (
            <section className="panel border-awaiting/40 p-5">
              <h2 className="text-[15px] font-semibold">Verify the work</h2>
              <p className="mt-1 mb-4 text-[13px] text-graphite">Proof is in. Check the documents, then sign it off or send it back with a note.</p>
              <VerifyForm kind={o.kind} id={o.id} />
            </section>
          )}
          {o.state !== "complete" && (
            <Section title="Assignment">
              <AssignForm order={o} meta={meta} />
            </Section>
          )}
          {o.proof_link && (
            <Section title="Completion link" description="The page the vendor or manager uses to upload the report. No login needed. Reminders include it automatically.">
              <CopyLink url={o.proof_link} />
            </Section>
          )}
        </aside>
      </div>
    </>
  );
}
