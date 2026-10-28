import Image from "next/image";
import { Suspense } from "react";
import { Loading } from "@/components/kit";
import { LinkPage } from "./link-page";
import type { LinkView } from "./types";

// The page a vendor or store manager opens from a reminder: no login, the
// signed token in the link is the permission. The data and the rules stay in
// hangar; this only shows them in the app's own design.

export const metadata = { title: "Upload proof", robots: { index: false } };

function hangar(): string {
  return (process.env.FACILITY_MAINTENANCE_URL ?? "").trim().replace(/\/$/, "");
}

export default function CompletionLink({ params, searchParams }: PageProps<"/i/[id]">) {
  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <Image src="/logo.png" alt="McGrath Facility Maintenance" width={640} height={123} priority className="mb-8 h-auto w-[180px]" />
        <Suspense fallback={<Loading rows={4} />}>
          <Load params={params} searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Load({ params, searchParams }: Pick<PageProps<"/i/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  const t = (await searchParams).t;
  const token = typeof t === "string" ? t : "";
  const path = `${hangar()}/public/i/${encodeURIComponent(id)}`;
  const query = `?t=${encodeURIComponent(token)}`;

  let view: LinkView | null = null;
  let problem = "This link is not valid.";
  try {
    const response = await fetch(path + query, { cache: "no-store" });
    if (response.ok) view = (await response.json()) as LinkView;
    else if (response.status === 403) problem = ((await response.json()) as { detail?: string }).detail ?? problem;
    else problem = "This page could not be loaded. Try again in a minute.";
  } catch {
    problem = "This page could not be loaded. Try again in a minute.";
  }

  if (!view) {
    return (
      <section className="panel px-5 py-5">
        <h1 className="display text-[20px] font-semibold text-ink">This link cannot be opened</h1>
        <p className="mt-2 text-[14px] text-graphite">{problem}</p>
        <p className="mt-2 text-[14px] text-graphite">Ask Kelly for a new link.</p>
      </section>
    );
  }
  return <LinkPage initial={view} uploadUrl={`${path}/upload${query}`} />;
}
