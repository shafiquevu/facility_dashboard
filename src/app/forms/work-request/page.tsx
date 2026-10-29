import Image from "next/image";
import { Suspense } from "react";
import { Loading } from "@/components/kit";
import { RequestForm } from "./request-form";

// The store's form for reporting something broken: no login, anyone at a
// store can use it, and Kelly reviews every request. The data and the rules
// stay in hangar; this only shows the form in the app's own design.

export const metadata = { title: "Report a problem", robots: { index: false } };

function hangar(): string {
  return (process.env.FACILITY_MAINTENANCE_URL ?? "").trim().replace(/\/$/, "");
}

export default function WorkRequestPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <Image src="/logo.png" alt="McGrath Facility Maintenance" width={640} height={123} priority className="mb-8 h-auto w-[180px]" />
        <Suspense fallback={<Loading rows={4} />}>
          <Load />
        </Suspense>
      </div>
    </main>
  );
}

async function Load() {
  const path = `${hangar()}/public/forms/work-request`;
  let locations: { id: string; label: string }[] | null = null;
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (response.ok) locations = ((await response.json()) as { locations: { id: string; label: string }[] }).locations;
  } catch {
    locations = null;
  }
  if (!locations) {
    return (
      <section className="panel px-5 py-5">
        <h1 className="display text-[20px] font-semibold text-ink">This form could not be loaded</h1>
        <p className="mt-2 text-[14px] text-graphite">Try again in a minute. If it keeps happening, call Kelly.</p>
      </section>
    );
  }
  return <RequestForm locations={locations} submitUrl={path} />;
}
