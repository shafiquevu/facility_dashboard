"use client";

import { useState } from "react";
import { Field, Select, TextArea, TextInput } from "@/components/fields";
import { PublicForm } from "@/components/public-form";

export function DecisionForm({ action }: { action: string }) {
  const [decision, setDecision] = useState("approve");
  return (
    <PublicForm action={action} submit="Record decision">
      <Field label="Decision" htmlFor="decision">
        <Select id="decision" name="decision" value={decision} onChange={(e) => setDecision(e.target.value)}>
          <option value="approve">Approve the work</option>
          <option value="defer">Defer it to a later date</option>
          <option value="decline">Decline it</option>
        </Select>
      </Field>
      {decision === "defer" && (
        <Field label="Bring it back on" htmlFor="review_date">
          <TextInput id="review_date" name="review_date" type="date" required />
        </Field>
      )}
      <Field label="Why" htmlFor="reason" hint="Kept as the record of the decision.">
        <TextArea id="reason" name="reason" rows={3} required />
      </Field>
      <Field label="Your name" htmlFor="decided_by">
        <TextInput id="decided_by" name="decided_by" required autoComplete="name" />
      </Field>
    </PublicForm>
  );
}
