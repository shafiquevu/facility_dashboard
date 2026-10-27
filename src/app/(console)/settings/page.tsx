import { Suspense } from "react";
import { get, type Meta } from "@/lib/api";
import { storeLabel } from "@/lib/format";
import { access, attempt } from "@/lib/page";
import { NoAccess } from "@/components/no-access";
import { ErrorState, Loading, PageHeader, Section, Status, TableShell, Td, Th } from "@/components/kit";
import { AddPersonForm, AddStoreForm } from "./forms";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="The people work can be assigned to, and the stores on the system." />
      <Suspense fallback={<Loading rows={10} />}>
        <Content />
      </Suspense>
    </>
  );
}

async function Content() {
  if (!(await access())) return <NoAccess />;
  const result = await attempt(() => get<Meta>("/console/meta"));
  if (result.error !== null) return <ErrorState message={result.error} />;
  const meta = result.data;
  return (
    <div className="space-y-5">
      <Section
        title={<>People<span className="num ml-1.5 text-graphite">{meta.people.length}</span></>}
        description="Anyone who can own, be assigned or review work. Each needs an email or a mobile, or reminders could never reach them."
        flush
      >
        <TableShell minWidth={680}>
          <thead className="border-y border-line bg-surface-sunk">
            <tr><Th className="pl-5">Name</Th><Th>Email</Th><Th>Mobile</Th><Th>Store</Th><Th className="pr-5">Reachable</Th></tr>
          </thead>
          <tbody className="divide-y divide-line">
            {meta.people.map((p) => {
              const store = meta.stores.find((s) => s.short_code === p.store_code);
              const placeholder = p.email?.endsWith(".invalid");
              return (
                <tr key={p.id}>
                  <Td className="pl-5 font-medium">{p.name}</Td>
                  <Td className={placeholder ? "text-faint" : ""}>{placeholder ? "Placeholder address" : (p.email ?? "None")}</Td>
                  <Td>{p.phone ?? <span className="text-faint">None</span>}</Td>
                  <Td>{store ? storeLabel(store.name) : "All stores"}</Td>
                  <Td className="pr-5">{placeholder && !p.phone ? <Status tone="overdue">Needs real details</Status> : <Status tone="verified">Yes</Status>}</Td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
        <div className="border-t border-line px-5 py-5">
          <AddPersonForm meta={meta} />
        </div>
      </Section>
      <Section title="Add a store" description="A new dealership. Its first building is created with it; add more under Stores and buildings.">
        <AddStoreForm />
      </Section>
    </div>
  );
}
