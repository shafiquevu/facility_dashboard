import Link from "next/link";
import { ClipboardCheck, LogOut } from "lucide-react";
import { getUser } from "@/lib/auth";
import { get, type Meta } from "@/lib/api";
import { signOut } from "@/app/login/actions";
import type { Counts } from "./nav";
import { MobileSidebar, Sidebar } from "./sidebar";

async function shellData() {
  const [meta, counts] = await Promise.all([
    get<Meta>("/console/meta").catch(() => null),
    get<Counts>("/console/counts").catch(() => null),
  ]);
  return { stores: meta?.stores ?? [], counts };
}

async function UserRow() {
  const user = await getUser();
  if (!user) return null;
  const initials = user.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-2.5 px-1.5 pt-1">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-tint text-[11px] font-semibold text-brand">{initials}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium text-ink">{user.name}</span>
        <span className="block truncate text-xs text-graphite capitalize">{user.role}</span>
      </span>
      <form action={signOut}>
        <button type="submit" className="flex size-7 items-center justify-center rounded-md text-faint hover:bg-sidebar-accent hover:text-ink" aria-label="Sign out" title="Sign out">
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}

export async function DesktopSidebar() {
  const { stores, counts } = await shellData();
  return <Sidebar stores={stores} counts={counts} footer={<UserRow />} />;
}

export async function MobileMenu() {
  const { stores, counts } = await shellData();
  return <MobileSidebar stores={stores} counts={counts} footer={<UserRow />} />;
}

export async function ApprovalsLink() {
  const counts = await get<Counts>("/console/counts").catch(() => null);
  const n = counts?.approvals ?? 0;
  return (
    <Link href="/approvals" aria-label={`${n} waiting on you`} className="flex h-8 items-center gap-2 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap text-graphite hover:bg-surface hover:text-ink">
      <span className="hidden sm:inline">Waiting on you</span>
      <ClipboardCheck className="size-4 sm:hidden" />
      <span className={`num rounded px-1.5 text-[12px] font-semibold ${n ? "bg-overdue-tint text-overdue" : "bg-surface-sunk text-faint"}`}>{n}</span>
    </Link>
  );
}
