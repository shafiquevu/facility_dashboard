import {
  BarChart3, Building2, CalendarDays, ClipboardCheck, ClipboardList, FileText, History, LayoutGrid,
  Package, PlayCircle, RefreshCcw, Settings, ShieldCheck, Users, Wrench, type LucideIcon,
} from "lucide-react";

export type Counts = {
  work_orders: number;
  overdue: number;
  requests: number;
  approvals: number;
  compliance: number;
  assets_due: number;
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  // Which count shows beside it, and whether that count needs attention.
  count?: keyof Counts;
  alert?: boolean;
};

export const NAV: { label: string; items: NavItem[] }[] = [
  {
    label: "Operations",
    items: [
      { href: "/", label: "Overview", icon: LayoutGrid },
      { href: "/work-orders", label: "Work orders", icon: Wrench, count: "work_orders" },
      { href: "/work-requests", label: "Work requests", icon: ClipboardList, count: "requests" },
      { href: "/recurring", label: "Recurring maintenance", icon: RefreshCcw },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    label: "Compliance",
    items: [
      { href: "/approvals", label: "Approvals", icon: ClipboardCheck, count: "approvals", alert: true },
      { href: "/compliance", label: "Insurance (COIs)", icon: ShieldCheck, count: "compliance", alert: true },
      { href: "/documents", label: "Documents", icon: FileText },
    ],
  },
  {
    label: "Directory",
    items: [
      { href: "/assets", label: "Equipment", icon: Package, count: "assets_due" },
      { href: "/vendors", label: "Vendors", icon: Users },
      { href: "/stores", label: "Stores and buildings", icon: Building2 },
    ],
  },
  {
    label: "Records",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/history", label: "Audit trail", icon: History },
      { href: "/videos", label: "How-to videos", icon: PlayCircle },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

// Pages whose content follows the chosen store.
export const STORE_SCOPED = new Set([
  "/", "/work-orders", "/work-requests", "/recurring", "/calendar", "/approvals", "/compliance",
  "/documents", "/assets", "/vendors", "/history",
]);
