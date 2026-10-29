import Image from "next/image";
import type { ReactNode } from "react";

// The frame of a public page (no login): the logo and one column, as on the
// completion link.
export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-xl">
        <Image src="/logo.png" alt="McGrath Facility Maintenance" width={640} height={123} priority className="mb-8 h-auto w-[180px]" />
        {children}
      </div>
    </main>
  );
}

export function hangar(): string {
  return (process.env.FACILITY_MAINTENANCE_URL ?? "").trim().replace(/\/$/, "");
}

export function CannotLoad({ title = "This page could not be loaded", children }: { title?: string; children?: ReactNode }) {
  return (
    <section className="panel px-5 py-5">
      <h1 className="display text-[20px] font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-[14px] text-graphite">{children ?? "Try again in a minute. If it keeps happening, call Kelly."}</p>
    </section>
  );
}

// Fetch a public hangar endpoint; null when it cannot be reached.
export async function load<T>(path: string): Promise<{ data: T } | { status: number; detail: string } | null> {
  try {
    const response = await fetch(`${hangar()}${path}`, { cache: "no-store" });
    if (response.ok) return { data: (await response.json()) as T };
    const body = (await response.json().catch(() => ({}))) as { detail?: string };
    return { status: response.status, detail: body.detail ?? "" };
  } catch {
    return null;
  }
}
