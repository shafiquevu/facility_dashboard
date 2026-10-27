"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, Package, Search, Users, Wrench } from "lucide-react";
import {
  Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { searchRecords, type SearchResult } from "@/app/(console)/actions";
import { NAV } from "./nav";

const ICON = { work_order: Wrench, vendor: Users, asset: Package, store: Building2 };
const GROUP = { work_order: "Work orders", vendor: "Vendors", asset: "Equipment", store: "Stores" };

function itemValue(r: SearchResult): string {
  return `${r.type}-${r.id}-${r.title}`;
}

function hrefFor(r: SearchResult): string {
  if (r.type === "work_order") return `/work-orders/${r.kind}/${r.id}`;
  if (r.type === "vendor") return `/vendors#${r.id}`;
  if (r.type === "asset") return `/assets#${r.id}`;
  return `/?store=${r.id}`;
}

export function CommandMenu() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  // Results arrive after the list has rendered, so cmdk would otherwise have
  // nothing highlighted and Enter would do nothing. Highlight the first.
  const [selected, setSelected] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Searches the real records, debounced; under two characters it shows pages.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const timer = setTimeout(() => startTransition(async () => {
      const found = await searchRecords(q);
      setResults(found);
      setSelected(found[0] ? itemValue(found[0]) : "");
    }), 180);
    return () => clearTimeout(timer);
  }, [query]);

  const go = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };
  const searching = query.trim().length >= 2;
  const grouped = (["work_order", "vendor", "asset", "store"] as const)
    .map((type) => ({ type, items: results.filter((r) => r.type === type) }))
    .filter((g) => g.items.length);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-surface px-2.5 text-[13px] text-faint hover:border-line-strong sm:max-w-xs"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">Search work orders, vendors…</span>
        <kbd className="hidden rounded border border-line px-1 font-sans text-[11px] text-graphite sm:inline">Ctrl K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Find a work order, vendor, piece of equipment or store">
        <Command shouldFilter={!searching} value={searching ? selected : undefined} onValueChange={setSelected}>
        <CommandInput placeholder="Search by name, WO number, store or vendor…" value={query} onValueChange={setQuery} />
        <CommandList>
          {searching ? (
            <>
              {!pending && <CommandEmpty>Nothing matches &ldquo;{query.trim()}&rdquo;.</CommandEmpty>}
              {grouped.map(({ type, items }) => {
                const Icon = ICON[type];
                return (
                  <CommandGroup key={type} heading={GROUP[type]}>
                    {items.map((r) => (
                      <CommandItem key={`${r.type}-${r.id}`} value={itemValue(r)} onSelect={() => go(hrefFor(r))}>
                        <Icon className="text-faint" />
                        <span className="min-w-0 flex-1 truncate">{r.title}</span>
                        <span className="truncate text-xs text-graphite">{r.subtitle}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })}
            </>
          ) : (
            NAV.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.items.map(({ href, label, icon: Icon }) => (
                  <CommandItem key={href} value={label} onSelect={() => go(href)}>
                    <Icon className="text-faint" />
                    {label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))
          )}
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
