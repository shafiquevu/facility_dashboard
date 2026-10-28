"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { get, post } from "@/lib/api";
import { requireAllowedUser } from "@/lib/auth";

export type ActionState = { ok?: string; error?: string };

// Every action re-checks the signed-in person, sends their name as the actor
// so the audit trail says who clicked, and turns a refusal from the service
// (a gate that said no) into a message on the form.
async function run(work: (actor: string) => Promise<string | void>): Promise<ActionState> {
  let actor: string;
  try {
    actor = (await requireAllowedUser()).name;
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Not allowed." };
  }
  try {
    const ok = await work(actor);
    refresh();
    return { ok: ok || "Saved." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

function fields(form: FormData, names: string[]): Record<string, string> {
  return Object.fromEntries(names.map((n) => [n, String(form.get(n) ?? "").trim()]));
}

function fileFrom(form: FormData, name = "file"): File | null {
  const file = form.get(name);
  return file instanceof File && file.size > 0 ? file : null;
}

// ── Work orders ─────────────────────────────────────────────────────────────

export async function createWorkOrder(_: ActionState, form: FormData): Promise<ActionState> {
  let created: { kind: string; id: string } | null = null;
  const state = await run(async (actor) => {
    const type = String(form.get("type") ?? "request");
    if (type === "item") {
      created = await post<{ kind: string; id: string; number: string }>("/console/items", {
        actor,
        ...fields(form, ["location_id", "category_key", "name", "frequency", "next_due", "last_completed", "owner_id", "assignee_id", "vendor_id", "asset_id"]),
      });
    } else {
      created = await post<{ kind: string; id: string; number: string }>("/console/work-orders", {
        actor,
        ...fields(form, ["location_id", "issue", "urgency", "due", "assignee_id", "vendor_id", "asset_id", "notes"]),
      });
    }
  });
  if (state.error || !created) return state;
  const { kind, id } = created as { kind: string; id: string };
  redirect(`/work-orders/${kind}/${id}`);
}

export async function assignWorkOrder(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    const { kind, id, assignee_id, vendor_id, due } = fields(form, ["kind", "id", "assignee_id", "vendor_id", "due"]);
    await post(`/console/work-orders/${kind}/${id}/assign`, { actor, assignee_id, vendor_id, due });
    return "Assignment saved.";
  });
}

export async function uploadRequestFile(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    const id = String(form.get("id") ?? "");
    const file = fileFrom(form);
    if (!file) throw new Error("Choose a file to upload.");
    const body = new FormData();
    body.set("kind", String(form.get("kind") ?? "completion_doc"));
    body.set("actor", actor);
    body.set("file", file, file.name);
    await post(`/console/work-orders/request/${id}/files`, body);
    return form.get("kind") === "photo" ? "Photo added." : "Completion document uploaded. This now waits for verification.";
  });
}

// A PDF over this is refused here, with a reason, instead of failing at
// Vercel's request limit with a generic error.
const MAX_REPORT_BYTES = 4 * 1024 * 1024;

function reportFrom(form: FormData, required: boolean): File | null {
  const file = fileFrom(form);
  if (!file) {
    if (required) throw new Error("Choose the PDF report to upload.");
    return null;
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) throw new Error("Reports must be a PDF. Scan or save it as a PDF and upload that.");
  if (file.size > MAX_REPORT_BYTES) throw new Error("That PDF is over 4 MB. Save it at a smaller size (or as fewer pages) and try again.");
  return file;
}

export async function recordInspection(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    const { id, completed_on, result, vendor_id, notes } = fields(form, ["id", "completed_on", "result", "vendor_id", "notes"]);
    const file = reportFrom(form, false);
    const body = new FormData();
    body.set("actor", actor);
    body.set("completed_on", completed_on);
    body.set("result", result);
    body.set("vendor_id", vendor_id);
    body.set("notes", notes);
    if (file) body.set("file", file, file.name);
    await post(`/console/items/${id}/records`, body);
    return file ? "Inspection recorded with its report." : "Inspection recorded. Add its PDF report when you have it.";
  });
}

export async function attachRecordReport(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    const { id, record_id } = fields(form, ["id", "record_id"]);
    const file = reportFrom(form, true)!;
    const body = new FormData();
    body.set("actor", actor);
    body.set("file", file, file.name);
    await post(`/console/items/${id}/records/${record_id}/report`, body);
    return "Report added.";
  });
}

export async function verifyWorkOrder(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    const { kind, id, note } = fields(form, ["kind", "id", "note"]);
    const approved = form.get("approved") !== "false";
    const result = await post<{ status: string; outstanding?: string[]; next_due?: string }>(
      `/console/work-orders/${kind}/${id}/verify`, { actor, approved, note },
    );
    return {
      verified_complete: result.next_due ? `Verified complete. Next due ${result.next_due}.` : "Verified complete.",
      awaiting_document: `Approved. Still waiting on: ${(result.outstanding ?? []).join(", ").replaceAll("_", " ")}.`,
      failed: "Failure confirmed. A corrective action is needed before this can close.",
      returned_to_assignee: "Sent back to the assignee.",
    }[result.status] ?? "Saved.";
  });
}

// ── Approvals ───────────────────────────────────────────────────────────────

export async function decideRecommendation(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    const { id, decision, reason, review_date } = fields(form, ["id", "decision", "reason", "review_date"]);
    await post(`/console/recommendations/${id}/decision`, { actor, decision, reason, review_date });
    return `Decision recorded: ${decision}.`;
  });
}

export async function approveProposedItem(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    const { id, next_due, owner_id, vendor_id } = fields(form, ["id", "next_due", "owner_id", "vendor_id"]);
    await post(`/console/items/${id}/approve`, { actor, next_due, owner_id, vendor_id });
    return "Started. Reminders go out 30, 14 and 7 days before the due date, and on it.";
  });
}

export async function rejectProposedItem(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    const { id, reason } = fields(form, ["id", "reason"]);
    await post(`/console/items/${id}/reject`, { actor, reason });
    return "Item rejected.";
  });
}

export async function approveVendor(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    const id = String(form.get("id") ?? "");
    const approved = form.get("approved") !== "false";
    await post(`/console/vendors/${id}/approve`, { actor, approved });
    return approved ? "Vendor approved." : "Approval removed.";
  });
}

// ── Vendors and insurance ───────────────────────────────────────────────────

export async function addVendor(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    await post("/console/vendors", { actor, ...fields(form, ["name", "contact", "phone", "email", "services"]) });
    return "Vendor added.";
  });
}

export async function uploadCoi(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    const { vendor_id, expiration } = fields(form, ["vendor_id", "expiration"]);
    const file = fileFrom(form);
    if (!vendor_id) throw new Error("Choose the vendor.");
    if (!expiration) throw new Error("Enter the expiration date from the certificate.");
    if (!file) throw new Error("Choose the certificate file.");
    const body = new FormData();
    body.set("expiration", expiration);
    body.set("actor", actor);
    body.set("file", file, file.name);
    const result = await post<{ expired: boolean }>(`/console/vendors/${vendor_id}/coi`, body);
    return result.expired
      ? "Filed. That certificate has already expired, so the vendor stays flagged until a current one is uploaded."
      : "Certificate filed.";
  });
}

// ── Equipment ───────────────────────────────────────────────────────────────

const ASSET_FIELDS = ["location_id", "name", "category", "make", "model", "serial_number", "installed_on", "assigned_to_id", "service_interval", "last_service", "next_service", "notes"];

export async function saveAsset(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    const id = String(form.get("id") ?? "");
    const body = { actor, ...fields(form, ASSET_FIELDS) };
    if (id) {
      const retire = form.get("intent") === "retire";
      await post(`/console/assets/${id}`, retire ? { ...body, active: false } : body);
      return retire ? "Equipment retired." : "Equipment saved.";
    }
    await post("/console/assets", body);
    return "Equipment added.";
  });
}

export async function logAssetService(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    const { id, on, next_service, note } = fields(form, ["id", "on", "next_service", "note"]);
    await post(`/console/assets/${id}/serviced`, { actor, on, next_service, note });
    return "Service logged.";
  });
}

// ── Settings ────────────────────────────────────────────────────────────────

export async function addStore(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    await post("/console/stores", { actor, ...fields(form, ["name", "short_code", "building", "address"]) });
    return "Store added.";
  });
}

export async function addLocation(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    await post("/console/locations", { actor, ...fields(form, ["store_id", "building", "address"]) });
    return "Building added.";
  });
}

export async function addPerson(_: ActionState, form: FormData): Promise<ActionState> {
  return run(async (actor) => {
    await post("/console/people", { actor, ...fields(form, ["name", "email", "phone", "store_id"]) });
    return "Person added.";
  });
}

// ── Search (the command palette) ────────────────────────────────────────────

export type SearchResult = {
  type: "work_order" | "vendor" | "asset" | "store";
  id: string;
  kind?: "item" | "request";
  title: string;
  subtitle: string;
};

export async function searchRecords(q: string): Promise<SearchResult[]> {
  await requireAllowedUser();
  const { results } = await get<{ results: SearchResult[] }>("/console/search", { q: q.slice(0, 80) });
  return results;
}
