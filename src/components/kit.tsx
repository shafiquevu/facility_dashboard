import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { AssetStatus, CoiStatus, Priority, WorkOrderState } from "@/lib/api";

// ─── Status ──────────────────────────────────────────────────────────────────
// Four meanings, four colours, used for nothing else anywhere in the app.

export type Tone = "overdue" | "soon" | "verified" | "awaiting" | "neutral" | "brand";

const DOT: Record<Tone, string> = {
  overdue: "bg-overdue",
  soon: "bg-soon",
  verified: "bg-verified",
  awaiting: "bg-awaiting",
  neutral: "bg-faint",
  brand: "bg-brand",
};
const TEXT: Record<Tone, string> = {
  overdue: "text-overdue",
  soon: "text-soon",
  verified: "text-verified",
  awaiting: "text-awaiting",
  neutral: "text-graphite",
  brand: "text-brand",
};
const CHIP: Record<Tone, string> = {
  overdue: "bg-overdue-tint text-overdue",
  soon: "bg-soon-tint text-soon",
  verified: "bg-verified-tint text-verified",
  awaiting: "bg-awaiting-tint text-awaiting",
  neutral: "bg-surface-sunk text-graphite ring-1 ring-inset ring-line",
  brand: "bg-brand-tint text-brand",
};

export function Status({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap", TEXT[tone], className)}>
      <span className={cn("size-1.5 shrink-0 rounded-full", DOT[tone])} aria-hidden="true" />
      {children}
    </span>
  );
}

export function Chip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex h-5 items-center rounded-md px-1.5 text-xs font-medium whitespace-nowrap", CHIP[tone])}>
      {children}
    </span>
  );
}

export function WorkOrderStatus({ state, overdue }: { state: WorkOrderState; overdue?: boolean }) {
  if (overdue && state !== "complete") return <Status tone="overdue">Overdue</Status>;
  const map: Record<WorkOrderState, [Tone, string]> = {
    unassigned: ["neutral", "Unassigned"],
    in_progress: ["brand", "In progress"],
    awaiting_verification: ["awaiting", "To verify"],
    complete: ["verified", "Complete"],
  };
  const [tone, label] = map[state];
  return <Status tone={tone}>{label}</Status>;
}

export function CoiStatusLabel({ status }: { status: CoiStatus }) {
  const map: Record<CoiStatus, [Tone, string]> = {
    valid: ["verified", "Insured"],
    expiring: ["soon", "Expiring"],
    expired: ["overdue", "Expired"],
    missing: ["neutral", "No certificate"],
  };
  const [tone, label] = map[status];
  return <Status tone={tone}>{label}</Status>;
}

export function AssetStatusLabel({ status }: { status: AssetStatus }) {
  const map: Record<AssetStatus, [Tone, string]> = {
    overdue: ["overdue", "Service overdue"],
    due_soon: ["soon", "Service due"],
    on_track: ["verified", "On schedule"],
    no_schedule: ["neutral", "No schedule"],
  };
  const [tone, label] = map[status];
  return <Status tone={tone}>{label}</Status>;
}

export function PriorityLabel({ priority }: { priority: Priority }) {
  const bars = { high: 3, medium: 2, low: 1 }[priority];
  const tone = { high: "text-overdue", medium: "text-soon", low: "text-faint" }[priority];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-medium capitalize", tone)} title={`${priority} priority`}>
      <span className="flex items-end gap-px" aria-hidden="true">
        {[1, 2, 3].map((b) => (
          <span key={b} className={cn("w-[3px] rounded-[1px]", b <= bars ? "bg-current" : "bg-line-strong")} style={{ height: 4 + b * 3 }} />
        ))}
      </span>
      {priority}
    </span>
  );
}

// ─── Layout ──────────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="display text-[26px] leading-tight font-semibold text-ink">{title}</h1>
          {description && <p className="mt-1 max-w-[70ch] text-[14px] text-graphite">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </header>
  );
}

export function Section({
  title,
  description,
  actions,
  children,
  className,
  flush = false,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section className={cn("panel min-w-0 overflow-hidden", className)}>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-graphite">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(!flush && "px-5 pb-5")}>{children}</div>
    </section>
  );
}

export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="text-[13px] font-medium text-brand hover:underline">
      {children}
    </Link>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-line-strong px-6 py-10 text-center">
      <p className="text-[14px] font-medium text-ink">{title}</p>
      {children && <p className="mt-1 max-w-sm text-[13px] text-graphite">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-overdue/30 bg-overdue-tint px-5 py-4">
      <p className="font-medium text-overdue">The maintenance service did not answer</p>
      <p className="mt-1 text-[13px] text-ink">{message}</p>
    </div>
  );
}

export function Loading({ rows = 8 }: { rows?: number }) {
  return (
    <div className="panel p-5" aria-busy="true" aria-label="Loading">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-surface-sunk" style={{ width: `${92 - (i % 4) * 14}%` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Tables ──────────────────────────────────────────────────────────────────
// Sorting lives in the URL (?sort=due&dir=desc), so a sorted view can be
// shared and the server does the work.

export function SortHeader({
  label,
  field,
  sort,
  dir,
  href,
  className,
}: {
  label: string;
  field: string;
  sort: string;
  dir: string;
  href: (next: Record<string, string>) => string;
  className?: string;
}) {
  const active = sort === field;
  const next = active && dir === "asc" ? "desc" : "asc";
  return (
    <th className={cn("h-9 px-3 text-left text-xs font-medium whitespace-nowrap text-graphite", className)} aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <Link href={href({ sort: field, dir: next })} className={cn("inline-flex items-center gap-1 hover:text-ink", active && "text-ink")}>
        {label}
        <span className={cn("text-[10px]", active ? "opacity-100" : "opacity-0")} aria-hidden="true">{dir === "asc" ? "▲" : "▼"}</span>
      </Link>
    </th>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("h-9 px-3 text-left text-xs font-medium whitespace-nowrap text-graphite", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("px-3 py-2.5 align-middle text-[13px] text-ink", className)}>{children}</td>;
}

export function TableShell({ children, minWidth = 760 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}
