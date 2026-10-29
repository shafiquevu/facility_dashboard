import { Suspense } from "react";
import { Chip, Loading, Section } from "@/components/kit";
import { CannotLoad, PublicPage, hangar, load } from "@/components/public-page";
import { day, money, words } from "@/lib/format";
import { DecisionForm } from "./decision-form";

// The approve / defer / decline page for a finding from an inspection. Signed
// link only: the decision closes the finding in the record an insurer reads.

export const metadata = { title: "Decide a finding", robots: { index: false } };

type View = {
  item: string; store: string; finding: string; vendor_proposal: string | null; cost: string | null;
  warranty_implication: boolean; decision: string | null; decided_by: string | null;
  decided_on: string | null; reason: string | null; review_date: string | null; raised_on: string;
  warranty_docs: number;
};

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default function DecisionPage({ params, searchParams }: Props) {
  return (
    <PublicPage>
      <Suspense fallback={<Loading rows={4} />}>
        <Content params={params} searchParams={searchParams} />
      </Suspense>
    </PublicPage>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 border-t border-line py-2.5 text-[14px] first:border-t-0">
      <span className="text-graphite">{label}</span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}

async function Content({ params, searchParams }: Props) {
  const { id } = await params;
  const t = (await searchParams).t;
  const query = `?t=${encodeURIComponent(typeof t === "string" ? t : "")}`;
  const path = `/public/r/${encodeURIComponent(id)}${query}`;
  const result = await load<View>(path);
  if (!result) return <CannotLoad />;
  if (!("data" in result)) {
    return <CannotLoad title="This link cannot be opened">It is not valid, or it has expired. Ask Kelly for a new link.</CannotLoad>;
  }
  const v = result.data;
  return (
    <div className="space-y-4">
      <Section>
        <div className="flex flex-wrap items-center gap-2 pt-5">
          {v.decision ? <Chip tone="verified">Decided</Chip> : <Chip tone="soon">Needs a decision</Chip>}
          {v.warranty_implication && <Chip tone="awaiting">Warranty</Chip>}
        </div>
        <h1 className="display mt-3 mb-3 text-[22px] font-semibold text-ink">{v.finding}</h1>
        <Row label="Inspection" value={v.item} />
        <Row label="Store" value={v.store} />
        <Row label="Raised" value={day(v.raised_on)} />
        <Row label="Estimated cost" value={v.cost ? money(v.cost) : null} />
        <Row label="Vendor proposes" value={v.vendor_proposal} />
        {v.warranty_implication && <Row label="Warranty documents" value={v.warranty_docs ? `${v.warranty_docs} on file` : "None yet"} />}
      </Section>
      <Section title={v.decision ? "Decision" : "Your decision"}>
        {v.decision ? (
          <p className="text-[14px] text-ink">
            {words(v.decision)} by {v.decided_by} on {day(v.decided_on)}: {v.reason}
            {v.review_date ? `. Back on ${day(v.review_date)}.` : ""}
          </p>
        ) : (
          <DecisionForm action={`${hangar()}/public/r/${encodeURIComponent(id)}${query}`} />
        )}
      </Section>
    </div>
  );
}
