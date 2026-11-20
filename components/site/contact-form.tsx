"use client";

import { useActionState } from "react";
import { submitContact, type ActionState } from "@/lib/actions";

export function ContactForm({
  submitLabel,
  types,
  budgets,
}: {
  submitLabel: string;
  types: string[];
  budgets: string[];
}) {
  const [state, action, pending] = useActionState(submitContact, null as ActionState);
  if (state?.ok) return <p role="status" className="card">{state.message}</p>;
  return (
    <form action={action} className="grid gap-4">
      <div className="absolute h-0 overflow-hidden" aria-hidden>
        <label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="field"><span>نام</span><input name="name" required autoComplete="name" /></label>
      <label className="field"><span>شماره تماس</span><input name="phone" required autoComplete="tel" inputMode="tel" dir="ltr" /></label>
      <label className="field"><span>ایمیل (اختیاری)</span><input name="email" type="email" autoComplete="email" dir="ltr" /></label>
      <label className="field">
        <span>نوع پروژه</span>
        <select name="projectType" required defaultValue="">
          <option value="" disabled>انتخاب کنید</option>
          {types.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="field">
        <span>بازه بودجه</span>
        <select name="budget" required defaultValue="">
          <option value="" disabled>انتخاب کنید</option>
          {budgets.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="field"><span>توضیح کوتاه</span><textarea name="message" /></label>
      <input type="hidden" name="subject" value="" />
      {state && !state.ok ? <p className="text-sm text-red-700">{state.message}</p> : null}
      <button className="pill solid" type="submit" disabled={pending}>{pending ? "در حال ارسال…" : submitLabel}</button>
    </form>
  );
}
