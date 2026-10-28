import "server-only";
import { cache } from "react";

// Everything the console shows comes from the hangar service (D:\work\facility,
// console.py). The connector key never leaves the server.

export type WorkOrderState = "unassigned" | "in_progress" | "awaiting_verification" | "complete";
export type Priority = "high" | "medium" | "low";

export type WorkOrder = {
  kind: "item" | "request";
  id: string;
  number: string;
  title: string;
  category: string;
  store: string;
  store_code: string;
  building: string;
  location_id: string;
  vendor: string | null;
  vendor_id: string | null;
  assigned_to: string | null;
  assigned_to_id: string | null;
  due: string | null;
  status: string;
  result: string;
  critical: boolean;
  urgency: string | null;
  frequency: string | null;
  asset: string | null;
  asset_id: string | null;
  closed_at: string | null;
  created_at: string;
  state: WorkOrderState;
  priority: Priority;
  overdue: boolean;
  due_today: boolean;
  days_until_due: number | null;
};

export type Document = { id: string; kind: string; url: string | null; uploaded_by: string | null; uploaded_at: string };
export type HistoryEntry = { occurred_at: string; verb: string; actor: string | null; detail: Record<string, unknown> };
export type RecommendationRow = {
  id: string; finding: string; vendor_proposal: string | null; cost: string | null;
  warranty_implication: boolean; decision: string | null; decided_by: string | null;
  decided_on: string | null; reason: string | null; review_date: string | null; raised_on: string;
};

export type InspectionRecord = {
  id: string; completed_on: string; result: string; vendor: string | null; notes: string | null;
  recorded_by: string; created_at: string;
  documents: { kind: string; uploaded_by: string | null; uploaded_at: string; url: string | null }[];
};

export type WorkOrderDetail = WorkOrder & {
  documents: Document[];
  records?: InspectionRecord[];
  assignee_id?: string | null;
  live?: boolean;
  history: HistoryEntry[];
  recommendations: RecommendationRow[];
  proof_link: string | null;
  failure_reason?: string | null;
  approved_by?: string | null;
  approved_on?: string | null;
  last_completed?: string | null;
  reviewer?: string | null;
  required_documents?: string[];
  submitted_by?: string;
  submitted_on?: string;
  notes?: string | null;
  started_at?: string | null;
};

export type CoiStatus = "valid" | "expiring" | "expired" | "missing";
export type ComplianceVendor = {
  id: string; name: string; contact: string | null; phone: string | null; email: string | null;
  services: string[]; approved: boolean; approved_by: string | null; approved_on: string | null;
  cover_until: string | null; uploaded_at: string | null; stores: string[]; store_codes: string[];
  item_count: number; coi_status: CoiStatus; coi_url: string | null; cleared: boolean;
};

export type AssetStatus = "overdue" | "due_soon" | "on_track" | "no_schedule";
export type Asset = {
  id: string; name: string; category: string | null; make: string | null; model: string | null;
  serial_number: string | null; installed_on: string | null; service_interval: string | null;
  notes: string | null; location_id: string; building: string; store: string; store_code: string;
  assigned_to: string | null; assigned_to_id: string | null; last_service: string | null;
  next_service: string | null; open_work_orders: number; service_status: AssetStatus;
};

export type ActivityEvent = {
  id: number; occurred_at: string; subject_type: string; subject_id: string; verb: string;
  actor: string | null; detail: Record<string, unknown>; subject: string | null;
  number: string | null; store: string | null; store_code: string | null;
};

export type CalendarEvent = {
  date: string; kind: "item" | "request" | "asset"; id: string; number: string | null;
  title: string; store: string; category: string; critical: boolean; state: string; overdue: boolean;
};

export type Kpis = {
  open_work_orders: number; unassigned: number; due_today: number; overdue: number;
  critical_overdue: number; expiring_cois: number; expired_cois: number; pending_approvals: number;
  upcoming_inspections: number;
};

export type Counts = Record<"all" | WorkOrderState, number>;

export type GridState = "overdue" | "due_soon" | "awaiting" | "ok" | "no_date";
export type Matrix = {
  categories: { key: string; label: string; critical: boolean }[];
  stores: { code: string; name: string }[];
  cells: { store_code: string; category: string; count: number; state: GridState; next_due: string | null; overdue: number; undated: number }[];
};
export type Gap = { key: string; count: number; label: string; href: string; why: string };

export type Overview = {
  today: string; kpis: Kpis; outstanding: WorkOrder[]; schedule: CalendarEvent[];
  compliance: ComplianceVendor[]; work_orders: WorkOrder[]; work_order_counts: Counts;
  assets: Asset[]; activity: ActivityEvent[]; matrix: Matrix; gaps: Gap[];
};

export type Store = { id: string; name: string; short_code: string; address?: string | null };
export type Meta = {
  stores: Store[];
  locations: { id: string; store_code: string; store: string; building: string; address: string | null }[];
  people: { id: string; name: string; email: string | null; phone: string | null; role_key: string | null; store_code: string | null }[];
  vendors: { id: string; name: string; approved: boolean }[];
  categories: { key: string; label: string; critical: boolean }[];
  assets: { id: string; name: string; store_code: string }[];
  frequencies: string[];
};

export type Approvals = {
  count: number;
  verify: WorkOrder[];
  decisions: {
    id: string; store: string; store_code: string; building: string; item: string; finding: string;
    cost: string | null; warranty_implication: boolean; approver: string | null; raised_on: string;
    days_waiting: number; warranty_docs: number;
  }[];
  proposed_items: {
    id: string; wo_number: number; item: string; category: string; store: string; store_code: string;
    building: string; frequency: string; last_completed: string | null; next_due: string | null;
    created_at: string; proposed_by: string | null; source: "store_added" | "import"; vendor: string | null;
  }[];
  unapproved_vendors: { id: string; name: string; phone: string | null; email: string | null; services: string[]; cover_until: string | null }[];
};

export type StoreReport = {
  store: string; store_code: string; open: number; overdue: number; critical_overdue: number;
  awaiting_verification: number; unassigned: number; completed_30_days: number;
  no_due_date: number; no_vendor: number;
};

export type DocumentRow = {
  source: string; kind: string; url: string | null; uploaded_by: string | null; uploaded_at: string;
  subject: string; number: string | null; wo_kind: "item" | "request" | null; wo_id: string | null;
  store: string | null; store_code: string | null;
};

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function config() {
  const base = process.env.FACILITY_MAINTENANCE_URL?.trim().replace(/\/$/, "");
  const key = process.env.FACILITY_CONNECTOR_KEY?.trim();
  if (!base || !key) {
    throw new ApiError("Facility Maintenance is not configured: set FACILITY_MAINTENANCE_URL and FACILITY_CONNECTOR_KEY.", 503);
  }
  return { base, key };
}

async function readError(response: Response): Promise<ApiError> {
  let message = `The maintenance service returned HTTP ${response.status}.`;
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") message = body.detail;
  } catch {
    // keep the generic message
  }
  return new ApiError(message, response.status);
}

// One request per URL per page render: the sidebar, the header and the page
// all ask for /console/counts or /console/meta, and React's cache() makes
// that a single call.
const fetchJson = cache(async (url: string): Promise<unknown> => {
  const { key } = config();
  const response = await fetch(url, { headers: { "X-Connector-Key": key }, cache: "no-store" });
  if (!response.ok) throw await readError(response);
  return response.json();
});

export async function get<T>(path: string, params: Record<string, string | undefined> = {}): Promise<T> {
  const { base } = config();
  const url = new URL(base + path);
  for (const [name, value] of Object.entries(params)) if (value) url.searchParams.set(name, value);
  return (await fetchJson(url.toString())) as T;
}

export async function post<T>(path: string, body: Record<string, unknown> | FormData): Promise<T> {
  const { base, key } = config();
  const isForm = body instanceof FormData;
  const response = await fetch(base + path, {
    method: "POST",
    headers: isForm ? { "X-Connector-Key": key } : { "X-Connector-Key": key, "Content-Type": "application/json" },
    body: isForm ? body : JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw await readError(response);
  return response.json() as Promise<T>;
}

// The export streams straight through, so the browser gets the real CSV.
export async function exportCsv(): Promise<Response> {
  const { base, key } = config();
  return fetch(base + "/export.csv", { headers: { "X-Connector-Key": key }, cache: "no-store" });
}
