"use client";

import { useActionState, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/app/(console)/actions";

type Action = (state: ActionState, form: FormData) => Promise<ActionState>;

// A form wired to a server action. Success is a toast that names what
// happened; a refusal (a gate that said no) stays on the form, beside the
// fields, until it is fixed.
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: Action;
  children: ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      toast.success(state.ok);
      if (resetOnSuccess) ref.current?.reset();
    }
  }, [state, resetOnSuccess]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {children}
      {state.error && (
        <p role="alert" className="col-span-full mt-1 rounded-md bg-overdue-tint px-3 py-2 text-[13px] text-overdue">
          {state.error}
        </p>
      )}
    </form>
  );
}

export function Submit({
  children,
  variant = "default",
  name,
  value,
  size = "default",
}: {
  children: ReactNode;
  variant?: "default" | "outline" | "destructive" | "ghost";
  name?: string;
  value?: string;
  size?: "default" | "sm" | "lg";
}) {
  const { pending, data } = useFormStatus();
  // With two submit buttons, only the one that was pressed shows the spinner.
  const mine = pending && (!name || data?.get(name) === value);
  return (
    <Button type="submit" variant={variant} size={size} name={name} value={value} disabled={pending}>
      {mine && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
}
