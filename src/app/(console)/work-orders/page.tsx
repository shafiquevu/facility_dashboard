import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { one, withStore, type SearchParams } from "@/lib/page";
import { Button } from "@/components/ui/button";
import { Loading, PageHeader } from "@/components/kit";
import { WorkOrderList } from "@/components/work-order-list";

export const metadata = { title: "Work orders" };

export default function WorkOrdersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <Suspense fallback={<PageHeader title="Work orders" />}>
        <Header searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={<Loading rows={12} />}>
        <WorkOrderList searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Header({ searchParams }: { searchParams: SearchParams }) {
  const store = one((await searchParams).store);
  return (
    <PageHeader
      title="Work orders"
      description="Recurring inspections and one-off repairs in one list. Select a row to assign, verify or see its history."
      actions={
        <Button asChild>
          <Link href={withStore("/work-orders/new", store)}><Plus /> New work order</Link>
        </Button>
      }
    />
  );
}
