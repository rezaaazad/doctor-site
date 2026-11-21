"use client";

import { useActionState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitLeadAction, subscribeAction, type PublicFormState } from "@/lib/actions/public";
import { Field, FormMessage, Input, Select, SubmitButton, Textarea } from "@/components/ui/form";

export function LeadForm({
  types = [],
  budgets = [],
  submitLabel = "درخواست مشاوره رایگان",
  source = "site",
  compact = false,
  tone = "default",
  className,
}: {
  types?: string[];
  budgets?: string[];
  submitLabel?: string;
  source?: string;
  compact?: boolean;
  tone?: "default" | "light";
  className?: string;
}) {
  const [state, action] = useActionState<PublicFormState, FormData>(submitLeadAction, null);
  if (state?.ok) {
    return (
      <div role="status" className={cn("flex flex-col items-center rounded-[var(--r)] p-8 text-center", tone === "light" ? "bg-white/10 text-white" : "bg-success-soft", className)}>
        <CheckCircle2 className={cn("anim-pop size-12", tone === "light" ? "text-white" : "text-success")} aria-hidden />
        <p className="mt-3 font-display text-lg font-extrabold">ثبت شد!</p>
        <p className={cn("mt-1 text-[0.92rem]", tone === "light" ? "text-white/75" : "text-muted")}>{state.message}</p>
      </div>
    );
  }
  const err = state?.errors ?? {};
  return (
    <form action={action} className={cn("grid gap-3.5", !compact && "md:grid-cols-2", className)} noValidate>
      <div className="absolute h-0 w-0 overflow-hidden" aria-hidden>
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <input type="hidden" name="source" value={source} />
      <Field label="نام و نام خانوادگی" htmlFor={`lead-name-${source}`} error={err.name} required>
        <Input id={`lead-name-${source}`} name="name" autoComplete="name" required aria-invalid={Boolean(err.name)} placeholder="مثلاً سارا محمدی" />
      </Field>
      <Field label="شماره موبایل" htmlFor={`lead-phone-${source}`} error={err.phone} required>
        <Input id={`lead-phone-${source}`} name="phone" inputMode="tel" autoComplete="tel" dir="ltr" required aria-invalid={Boolean(err.phone)} placeholder="0912 123 4567" className="text-right" />
      </Field>
      {types.length ? (
        <Field label="چه چیزی لازم دارید؟" htmlFor={`lead-type-${source}`}>
          <Select id={`lead-type-${source}`} name="projectType" defaultValue="">
            <option value="">انتخاب کنید (اختیاری)</option>
            {types.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
      ) : null}
      {budgets.length ? (
        <Field label="بودجه تقریبی" htmlFor={`lead-budget-${source}`}>
          <Select id={`lead-budget-${source}`} name="budget" defaultValue="">
            <option value="">انتخاب کنید (اختیاری)</option>
            {budgets.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
      ) : null}
      {!compact ? (
        <Field label="توضیح کوتاه (اختیاری)" htmlFor={`lead-msg-${source}`} className="md:col-span-2" error={err.message}>
          <Textarea id={`lead-msg-${source}`} name="message" rows={3} className="!min-h-[96px]" placeholder="مثلاً: فروشگاه پوشاک دارم و می‌خواهم فروش آنلاین را شروع کنم." />
        </Field>
      ) : null}
      {state && !state.ok ? <FormMessage state={state} className={cn(!compact && "md:col-span-2")} /> : null}
      <div className={cn(!compact && "md:col-span-2", "flex flex-wrap items-center gap-3")}>
        <SubmitButton size="lg" pendingText="در حال ثبت…" className="w-full sm:w-auto">
          <Send className="size-[18px]" aria-hidden />
          {submitLabel}
        </SubmitButton>
        <span className={cn("text-[0.78rem]", tone === "light" ? "text-white/60" : "text-muted")}>بدون هزینه و بدون تعهد. شماره شما فقط برای همین تماس است.</span>
      </div>
    </form>
  );
}

export function NewsletterForm({ source = "footer", tone = "light" }: { source?: string; tone?: "light" | "default" }) {
  const [state, action] = useActionState<PublicFormState, FormData>(subscribeAction, null);
  return (
    <form action={action} className="w-full">
      <input type="hidden" name="source" value={source} />
      <div className="absolute h-0 w-0 overflow-hidden" aria-hidden>
        <input name="company" tabIndex={-1} autoComplete="off" />
      </div>
      <div className={cn("flex items-center gap-1.5 rounded-full p-1.5", tone === "light" ? "bg-white/8 ring-1 ring-white/15" : "bg-surface ring-1 ring-line")}>
        <input
          name="email"
          type="email"
          required
          dir="ltr"
          placeholder="email@example.com"
          aria-label="ایمیل برای خبرنامه"
          className={cn("min-w-0 flex-1 bg-transparent px-3 text-[0.9rem] outline-none", tone === "light" ? "text-white placeholder:text-white/40" : "placeholder:text-muted")}
        />
        <SubmitButton size="sm" variant="action" pendingText="…">
          عضویت
        </SubmitButton>
      </div>
      {state?.message ? <p className={cn("mt-2 text-[0.8rem] font-semibold", state.ok ? "text-[#7ee2b8]" : "text-[#ffb4c4]")}>{state.message}</p> : null}
    </form>
  );
}
