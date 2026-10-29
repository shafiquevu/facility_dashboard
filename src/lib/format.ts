// Dates from the backend are plain YYYY-MM-DD (a day, not a moment), so they
// are read at noon to stay on the same day in every timezone.
function asDate(value: string): Date {
  return value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
}

export function day(value: string | null | undefined, fallback = "—"): string {
  if (!value) return fallback;
  return asDate(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function shortDay(value: string): string {
  return asDate(value).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function dateTime(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    timeZone: "America/Chicago",
  });
}

export function words(value: string | null | undefined): string {
  if (!value) return "";
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function money(value: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  return Number(value).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function dueLabel(days: number | null): string {
  if (days === null) return "No due date";
  if (days === 0) return "Due today";
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} overdue`;
  return `Due in ${days} day${days === 1 ? "" : "s"}`;
}

// What an audit-trail verb reads as to a person.
const VERBS: Record<string, string> = {
  submitted: "Submitted work request",
  imported: "Imported from the facility workbook",
  assigned: "Assigned",
  proof_submitted: "Submitted proof",
  photo_added: "Added a photo",
  proof_rejected: "Sent back",
  verified_complete: "Verified complete",
  failure_confirmed: "Confirmed failure",
  awaiting_document: "Approved, awaiting document",
  proposed_by_store: "Proposed new item",
  approved_by_kelly: "Approved item",
  rejected: "Rejected",
  added: "Added",
  updated: "Updated",
  serviced: "Logged service",
  uploaded: "Uploaded document",
  approved: "Approved vendor",
  unapproved: "Removed vendor approval",
  decision_approve: "Approved recommendation",
  decision_defer: "Deferred recommendation",
  decision_decline: "Declined recommendation",
  completion_recorded: "Recorded completion",
  raised: "Raised recommendation",
  reminded: "Sent reminder",
  escalated: "Escalated",
  document_removed: "Removed a document",
  scheduled: "Booked the visit",
  rescheduled: "Moved the visit",
  unscheduled: "Cleared the visit",
  vendor_set: "Set the vendor",
  store_requested: "Asked to use this vendor at a store",
  store_approved: "Approved the vendor for a store",
  store_unapproved: "Removed a store approval",
  edited: "Edited",
  inspection_recorded: "Recorded a past inspection",
  report_added: "Added a report",
};

export function verb(value: string): string {
  return VERBS[value] ?? words(value);
}

export function subjectLabel(type: string): string {
  return {
    facility_item: "Inspection",
    work_request: "Work request",
    recommendation: "Recommendation",
    certificate_of_insurance: "Insurance",
    vendor: "Vendor",
    asset: "Equipment",
    store: "Store",
    location: "Building",
    person: "Person",
    corrective_action: "Corrective action",
  }[type] ?? words(type);
}

/** A building as Kelly lists it: "McGrath Honda of Elgin - Carwash Building". */
export function locationLabel(store: string, building: string): string {
  return `${store} - ${building}`;
}

// Kelly (28 Oct) wants each dealership by its full name everywhere, exactly as
// it is stored ("McGrath Honda of St. Charles", not "St. Charles Honda").
export function storeLabel(name: string): string {
  return name.trim();
}
