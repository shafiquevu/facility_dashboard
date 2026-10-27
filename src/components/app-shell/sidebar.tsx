"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { ArrowLeft, Check, ChevronsUpDown, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { storeLabel } from "@/lib/format";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { NAV, STORE_SCOPED, type Counts } from "./nav";

type Store = { short_code: string; name: string };

function useStore() {
  const params = useSearchParams();
  return params.get("store") ?? "";
}

function Logo() {
  return (
    <Link href="/" className="block px-2.5 pt-1 pb-2" aria-label="McGrath Facility Maintenance, overview">
      <Image src="/logo.png" alt="McGrath Facility Maintenance" width={640} height={123} priority className="h-auto w-[140px]" />
    </Link>
  );
}

function StoreSwitcher({ stores }: { stores: Store[] }) {
  const store = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const current = stores.find((s) => s.short_code === store);
  const go = (code: string) => {
    const base = STORE_SCOPED.has(pathname) ? pathname : "/";
    router.push(code ? `${base}?store=${code}` : base);
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2.5 rounded-lg border border-line bg-surface px-2.5 py-2 text-left hover:border-line-strong">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-ink text-[11px] font-semibold text-white">
          {current ? current.short_code : "All"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold text-ink">{current ? storeLabel(current.name) : "All stores"}</span>
          <span className="block truncate text-xs text-graphite">{current ? current.name : `${stores.length} dealerships`}</span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-faint" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs font-normal text-graphite">Show</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => go("")}>
          All stores {!store && <Check className="ml-auto size-4" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {stores.map((s) => (
          <DropdownMenuItem key={s.short_code} onSelect={() => go(s.short_code)}>
            <span className="w-9 text-xs text-graphite">{s.short_code}</span>
            {storeLabel(s.name)}
            {store === s.short_code && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Links({ counts, onNavigate }: { counts: Counts | null; onNavigate?: () => void }) {
  const pathname = usePathname();
  const store = useStore();
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4" aria-label="Facility Maintenance">
      {NAV.map((group) => (
        <div key={group.label}>
          <p className="px-2.5 pb-1.5 text-xs font-medium text-faint">{group.label}</p>
          <ul className="space-y-px">
            {group.items.map(({ href, label, icon: Icon, count, alert }) => {
              const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
              const n = count && counts ? counts[count] : 0;
              const to = store && STORE_SCOPED.has(href) ? `${href}?store=${store}` : href;
              return (
                <li key={href}>
                  <Link
                    href={to}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium transition-colors",
                      active ? "bg-surface text-ink shadow-[0_0_0_1px_var(--line)]" : "text-graphite hover:bg-sidebar-accent hover:text-ink",
                    )}
                  >
                    <Icon className={cn("size-4 shrink-0", active ? "text-brand" : "text-faint group-hover:text-graphite")} strokeWidth={1.9} />
                    <span className="flex-1 truncate">{label}</span>
                    {n > 0 && (
                      <span className={cn("num min-w-5 rounded px-1 text-center text-[11px] font-semibold", alert ? "bg-overdue-tint text-overdue" : "text-faint")}>
                        {n}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Panel({ stores, counts, footer, onNavigate }: { stores: Store[]; counts: Counts | null; footer: ReactNode; onNavigate?: () => void }) {
  const mainDashboard = process.env.NEXT_PUBLIC_MAIN_DASHBOARD_URL || "https://dashboard.gomcgrath.com";
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-4 px-3 pt-6">
        <Logo />
        <StoreSwitcher stores={stores} />
      </div>
      <Links counts={counts} onNavigate={onNavigate} />
      <div className="space-y-1 border-t border-line px-3 py-3">
        <a href={mainDashboard} className="flex h-8 items-center gap-2.5 rounded-md px-2.5 text-[13px] font-medium text-graphite hover:bg-sidebar-accent hover:text-ink">
          <ArrowLeft className="size-4 text-faint" /> Back to dashboard
        </a>
        {footer}
      </div>
    </div>
  );
}

export function Sidebar({ stores, counts, footer }: { stores: Store[]; counts: Counts | null; footer: ReactNode }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-sidebar lg:block">
      <Panel stores={stores} counts={counts} footer={footer} />
    </aside>
  );
}

export function MobileSidebar({ stores, counts, footer }: { stores: Store[]; counts: Counts | null; footer: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="flex size-8 items-center justify-center rounded-md border border-line bg-surface text-graphite lg:hidden" aria-label="Open menu">
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 bg-sidebar p-0">
        <SheetTitle className="sr-only">Menu</SheetTitle>
        <Panel stores={stores} counts={counts} footer={footer} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
