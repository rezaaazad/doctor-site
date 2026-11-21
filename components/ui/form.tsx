"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  htmlFor,
  className,
  children,
  required,
}: {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="field-label">
          {label}
          {required ? <span className="ms-1 text-urgency">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? <p className="mt-1.5 text-[0.8rem] font-semibold text-urgency">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return <input className={cn("input", className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea className={cn("input", className)} {...props} />;
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select className={cn("input", className)} {...props}>
      {children}
    </select>
  );
}

export function Checkbox({ label, hint, className, ...props }: React.ComponentProps<"input"> & { label: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 rounded-xl py-1", className)}>
      <input type="checkbox" className="peer mt-1 size-[18px] shrink-0 cursor-pointer accent-[var(--primary)]" {...props} />
      <span className="min-w-0">
        <span className="block text-[0.92rem] font-semibold leading-7">{label}</span>
        {hint ? <span className="block text-[0.78rem] leading-6 text-muted">{hint}</span> : null}
      </span>
    </label>
  );
}

export function Toggle({ label, hint, className, ...props }: React.ComponentProps<"input"> & { label: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-4 py-1", className)}>
      <span className="min-w-0">
        <span className="block text-[0.92rem] font-semibold leading-7">{label}</span>
        {hint ? <span className="block text-[0.78rem] leading-6 text-muted">{hint}</span> : null}
      </span>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" {...props} />
        <span className="h-[26px] w-[46px] rounded-full bg-line transition-colors peer-checked:bg-success peer-focus-visible:ring-4 peer-focus-visible:ring-primary/25" />
        <span className="absolute top-[3px] right-[3px] size-5 rounded-full bg-white shadow-1 transition-transform peer-checked:-translate-x-5" />
      </span>
    </label>
  );
}

export function SubmitButton({
  children,
  pendingText,
  className,
  variant = "action",
  size,
  ...props
}: React.ComponentProps<"button"> & { pendingText?: string; variant?: "action" | "primary" | "ink" | "outline" | "ghost"; size?: "sm" | "lg" }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={cn("btn", `btn-${variant}`, size ? `btn-${size}` : "", className)}
      disabled={pending || props.disabled}
      aria-busy={pending}
      {...props}
    >
      {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}

export type FormState = { ok?: boolean; message?: string; errors?: Record<string, string>; data?: unknown } | null;

export function FormMessage({ state, className }: { state: FormState; className?: string }) {
  if (!state?.message) return null;
  return (
    <p
      role={state.ok ? "status" : "alert"}
      className={cn(
        "rounded-xl px-4 py-3 text-[0.88rem] font-semibold leading-7",
        state.ok ? "bg-success-soft text-success" : "bg-urgency-soft text-urgency",
        className,
      )}
    >
      {state.message}
    </p>
  );
}
