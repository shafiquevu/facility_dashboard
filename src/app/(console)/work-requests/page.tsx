import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink, Plus } from "lucide-react";
import { type SearchParams } from "@/lib/page";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader } from "@/components/kit";
import { WorkOrderList } from "@/components/work-order-list";

export const metadata = { title: "Work requests" };

export default function WorkRequestsPage({ searchParams }: { searchParams: SearchParams }) {
  const base = process.env.FACILITY_MAINTENANCE_URL?.replace(/\/$/, "");
  return (
    <>
      <PageHeader
        title="Work requests"
        description="One-off repairs, reported by a store through the request form or raised here."
        actions={
          <>
            {base && (
              <Button variant="outline" asChild>
                <a href={`${base}/forms/work-request`} target="_blank" rel="noreferrer">Store request form <ExternalLink /></a>
              </Button>
            )}
            <Button asChild>
              <Link href="/work-orders/new"><Plus /> New request</Link>
            </Button>
          </>
        }
      />
      <Suspense fallback={<Loading rows={10} />}>
        <WorkOrderList searchParams={searchParams} kind="request" basePath="/work-requests" />
      </Suspense>
    </>
  );
}
