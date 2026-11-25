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
    <form action={action} className="card grid gap-4 p-6 md:p-8 [&_label]:grid [&_label]:gap-2">
      <div className="absolute h-0 overflow-hidden" aria-hidden>
        <label>Company<input name="company" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <label className="field"><span>نام</span><input className="input" name="name" required autoComplete="name" /></label>
      <label className="field"><span>شماره تماس</span><input className="input" name="phone" required autoComplete="tel" inputMode="tel" dir="ltr" /></label>
      <label className="field"><span>ایمیل (اختیاری)</span><input className="input" name="email" type="email" autoComplete="email" dir="ltr" /></label>
      <label className="field">
        <span>نوع پروژه</span>
        <select className="input" name="projectType" required defaultValue="">
          <option value="" disabled>انتخاب کنید</option>
          {types.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="field">
        <span>بازه بودجه</span>
        <select className="input" name="budget" required defaultValue="">
          <option value="" disabled>انتخاب کنید</option>
          {budgets.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="field"><span>توضیح کوتاه</span><textarea className="input" name="message" /></label>
      <input type="hidden" name="subject" value="" />
      {state && !state.ok ? <p className="text-sm text-red-700">{state.message}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>{pending ? "در حال ارسال…" : submitLabel}</button>
    </form>
  );
}
