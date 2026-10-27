import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { type SearchParams } from "@/lib/page";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader } from "@/components/kit";
import { WorkOrderList } from "@/components/work-order-list";

export const metadata = { title: "Recurring maintenance" };

export default function RecurringPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <PageHeader
        title="Recurring maintenance"
        description="Scheduled inspections. Reminders go out 30, 14 and 7 days before the due date, and each one reschedules itself once it is verified."
        actions={
          <Button asChild>
            <Link href="/work-orders/new?type=item"><Plus /> Add inspection</Link>
          </Button>
        }
      />
      <Suspense fallback={<Loading rows={10} />}>
        <WorkOrderList searchParams={searchParams} kind="item" basePath="/recurring" />
      </Suspense>
    </>
  );
}
