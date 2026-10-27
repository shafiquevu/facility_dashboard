"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy } from "lucide-react";
import type { Meta, WorkOrderDetail } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { assignWorkOrder, decideRecommendation, uploadRequestFile, verifyWorkOrder } from "../../../actions";
import { ActionForm, Submit } from "@/components/action-form";
import { Field, PersonSelect, Select, TextArea, TextInput, VendorSelect } from "@/components/fields";

export function AssignForm({ order, meta }: { order: WorkOrderDetail; meta: Meta }) {
  return (
    <ActionForm action={assignWorkOrder} className="space-y-4">
      <input type="hidden" name="kind" value={order.kind} />
      <input type="hidden" name="id" value={order.id} />
      <Field label="Assigned to" htmlFor="assignee_id" hint={order.kind === "item" ? "Empty means it stays with its owner." : undefined}>
        <PersonSelect meta={meta} id="assignee_id" name="assignee_id" value={order.kind === "request" ? order.assigned_to_id : null} empty="Nobody" />
      </Field>
      <Field label="Vendor" htmlFor="vendor_id">
        <VendorSelect meta={meta} id="vendor_id" value={order.vendor_id} />
      </Field>
      <Field label="Due date" htmlFor="due">
        <TextInput id="due" name="due" type="date" defaultValue={order.due ?? ""} />
      </Field>
      <Submit variant="outline">Save assignment</Submit>
    </ActionForm>
  );
}

export function VerifyForm({ kind, id }: { kind: string; id: string }) {
  return (
    <ActionForm action={verifyWorkOrder} className="space-y-4">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={id} />
      <Field label="Note" htmlFor="note" hint="Required when sending it back, so the assignee knows what to fix.">
        <TextArea id="note" name="note" rows={2} />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Submit name="approved" value="true">Verify complete</Submit>
        <Submit name="approved" value="false" variant="outline">Send back</Submit>
      </div>
    </ActionForm>
  );
}

export function RequestUpload({ id }: { id: string }) {
  return (
    <ActionForm action={uploadRequestFile} resetOnSuccess className="grid gap-3 border-t border-line bg-surface-sunk/60 px-5 py-4 sm:grid-cols-[1fr_170px_auto] sm:items-end">
      <input type="hidden" name="id" value={id} />
      <Field label="Add a file" htmlFor="file">
        <TextInput id="file" name="file" type="file" required />
      </Field>
      <Field label="It is" htmlFor="file-kind">
        <Select id="file-kind" name="kind" defaultValue="completion_doc">
          <option value="completion_doc">Proof of completion</option>
          <option value="photo">A photo</option>
        </Select>
      </Field>
      <Submit variant="outline">Upload</Submit>
      <p className="text-xs text-graphite sm:col-span-3">Proof of completion moves this to verification.</p>
    </ActionForm>
  );
}

export function DecisionForm({ id }: { id: string }) {
  const [decision, setDecision] = useState("approve");
  return (
    <ActionForm action={decideRecommendation} className="mt-3 grid gap-2 sm:grid-cols-[130px_1fr_auto] sm:items-start">
      <input type="hidden" name="id" value={id} />
      <Select name="decision" aria-label="Decision" value={decision} onChange={(e) => setDecision(e.target.value)}>
        <option value="approve">Approve</option>
        <option value="defer">Defer</option>
        <option value="decline">Decline</option>
      </Select>
      <TextInput name="reason" required placeholder="Why, for the record" aria-label="Reason" />
      <Submit variant="outline">Record decision</Submit>
      {decision === "defer" && (
        <Field label="Bring it back on" htmlFor={`review-${id}`} className="sm:col-span-3">
          <TextInput id={`review-${id}`} name="review_date" type="date" required className="sm:w-52" />
        </Field>
      )}
    </ActionForm>
  );
}

export function CopyLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex gap-2">
      <TextInput readOnly value={url} aria-label="Completion link" className="text-xs text-graphite" onFocus={(e) => e.target.select()} />
      <Button
        type="button"
        variant="outline"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          toast.success("Link copied");
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? <Check /> : <Copy />} Copy
      </Button>
    </div>
  );
}
