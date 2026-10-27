import { Suspense } from "react";
import { get, type Meta } from "@/lib/api";
import { access, attempt, one, type SearchParams } from "@/lib/page";
import { NoAccess } from "@/components/no-access";
import { ErrorState, Loading, PageHeader } from "@/components/kit";
import { NewWorkOrderForm } from "./form";

export const metadata = { title: "New work order" };

export default function NewWorkOrderPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader title="New work order" description="A one-off repair, or a new inspection that repeats on a schedule." />
      <Suspense fallback={<Loading rows={8} />}>
        <Content searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Content({ searchParams }: { searchParams: SearchParams }) {
  if (!(await access())) return <NoAccess />;
  const params = await searchParams;
  const result = await attempt(() => get<Meta>("/console/meta"));
  if (result.error !== null) return <ErrorState message={result.error} />;
  return <NewWorkOrderForm meta={result.data} store={one(params.store)} type={one(params.type) === "item" ? "item" : "request"} />;
}
