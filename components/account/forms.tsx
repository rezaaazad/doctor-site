"use client";

import Link from "next/link";
import { useActionState, useId } from "react";
import { PROVINCES } from "@/lib/iran";
import { saveAccountDetailsAction, saveAddressAction, openTicketAction, submitProductReviewAction } from "@/lib/actions/account";
import { TICKET_DEPARTMENTS } from "@/lib/store/status";

type State = { ok: boolean; message: string; errors?:Record<string,string>;values?:Record<string,string> } | null;

export function AccountDetailsForm({
  defaults,
}: {
  defaults: { name: string; email: string; nationalCode: string; smsOptIn: boolean };
}) {
  const [state, action] = useActionState<State,FormData>(saveAccountDetailsAction, null as State);
  const prefix = useId();
  const error = (key:string) => state?.errors?.[key] ? <span id={prefix+key} role="alert" className="text-urgency">{state.errors[key]}</span> : null;
  return (
    <form action={action} className="card grid gap-4 p-5">
      <h1 className="font-display text-[1.35rem] font-extrabold">مشخصات حساب</h1>
      <label className="grid gap-1.5 text-[0.85rem] font-semibold">
        نام و نام خانوادگی
        <input name="name" defaultValue={state?.values?.name ?? defaults.name} className="field text-base" />
      </label>
      <label className="grid gap-1.5 text-[0.85rem] font-semibold">
        ایمیل
        <input name="email" aria-invalid={!!state?.errors?.email} aria-describedby={state?.errors?.email ? prefix+"email" : undefined} type="email" defaultValue={state?.values?.email ?? defaults.email} className="field text-base" dir="ltr" />
      {error("email")}</label>
      <label className="grid gap-1.5 text-[0.85rem] font-semibold">
        کد ملی
        <input name="nationalCode" aria-invalid={!!state?.errors?.nationalCode} aria-describedby={state?.errors?.nationalCode ? prefix+"nationalCode" : undefined} defaultValue={state?.values?.nationalCode ?? defaults.nationalCode} className="field text-base" dir="ltr" />
      {error("nationalCode")}</label>
      <label className="flex items-center gap-2 text-[0.85rem] font-semibold">
        <input type="checkbox" name="smsOptIn" value="1" defaultChecked={defaults.smsOptIn} />
        دریافت پیامک اطلاع‌رسانی سفارش
      </label>
      <button type="submit" className="btn btn-primary w-fit">ذخیره</button>
      {state?.message ? <p className={state.ok ? "text-success" : "text-urgency"}>{state.message}</p> : null}
    </form>
  );
}

export function AddressForm({ address }: { address?: { id: string; title: string; receiver: string; mobile: string; province: string; city: string; line: string; postalCode: string; isDefault: boolean } }) {
  const [state, action] = useActionState<State,FormData>(saveAddressAction, null as State);
  const prefix = useId();
  const error = (key:string) => state?.errors?.[key] ? <span id={prefix+key} role="alert" className="text-urgency">{state.errors[key]}</span> : null;
  return (
    <form action={action} className="grid gap-3 rounded-xl border border-line p-4">
      {address?.id ? <input type="hidden" name="id" value={address.id} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-[0.82rem] font-semibold">عنوان<input name="title" defaultValue={state?.values?.title ?? address?.title} className="field" placeholder="خانه" /></label>
        <label className="grid gap-1 text-[0.82rem] font-semibold">گیرنده *<input name="receiver" aria-invalid={!!state?.errors?.receiver} aria-describedby={state?.errors?.receiver ? prefix+"receiver" : undefined} required defaultValue={state?.values?.receiver ?? address?.receiver} className="field" />{error("receiver")}</label>
        <label className="grid gap-1 text-[0.82rem] font-semibold">موبایل *<input name="mobile" aria-invalid={!!state?.errors?.mobile} aria-describedby={state?.errors?.mobile ? prefix+"mobile" : undefined} required defaultValue={state?.values?.mobile ?? address?.mobile} className="field" dir="ltr" />{error("mobile")}</label>
        <label className="grid gap-1 text-[0.82rem] font-semibold">استان *
          <select name="province" aria-invalid={!!state?.errors?.province} aria-describedby={state?.errors?.province ? prefix+"province" : undefined} required defaultValue={state?.values?.province ?? address?.province} className="field">
            <option value="">انتخاب</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        {error("province")}</label>
        <label className="grid gap-1 text-[0.82rem] font-semibold md:col-span-2">شهر *<input name="city" aria-invalid={!!state?.errors?.city} aria-describedby={state?.errors?.city ? prefix+"city" : undefined} required defaultValue={state?.values?.city ?? address?.city} className="field" />{error("city")}</label>
        <label className="grid gap-1 text-[0.82rem] font-semibold md:col-span-2">آدرس *<textarea name="line" aria-invalid={!!state?.errors?.line} aria-describedby={state?.errors?.line ? prefix+"line" : undefined} required rows={2} defaultValue={state?.values?.line ?? address?.line} className="field" />{error("line")}</label>
        <label className="grid gap-1 text-[0.82rem] font-semibold">کد پستی<input name="postalCode" aria-invalid={!!state?.errors?.postalCode} aria-describedby={state?.errors?.postalCode ? prefix+"postalCode" : undefined} defaultValue={state?.values?.postalCode ?? address?.postalCode} className="field" dir="ltr" />{error("postalCode")}</label>
      </div>
      <label className="flex items-center gap-2 text-[0.82rem]"><input type="checkbox" name="isDefault" value="1" defaultChecked={address?.isDefault} /> آدرس پیش‌فرض</label>
      <button type="submit" className="btn btn-primary btn-sm w-fit">ذخیره آدرس</button>
      {state?.message ? <p role="status" className={state.ok?"text-success":"text-urgency"}>{state.message}</p> : null}
    </form>
  );
}

type TicketState = { ok?: boolean; message?: string; id?: string } | null;

export function NewTicketForm() {
  const [state, action] = useActionState(openTicketAction, null as TicketState);
  return (
    <form action={action} className="card grid gap-3 p-5">
      <h2 className="font-bold">تیکت جدید</h2>
      <label className="grid gap-1 text-[0.82rem] font-semibold">دپارتمان
        <select name="department" className="field" defaultValue="support">
          {Object.entries(TICKET_DEPARTMENTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-[0.82rem] font-semibold">موضوع *<input name="subject" minLength={4} maxLength={160} required className="field" /></label>
      <label className="grid gap-1 text-[0.82rem] font-semibold">پیام *<textarea name="body" minLength={8} maxLength={4000} required rows={4} className="field" /></label>
      <button type="submit" className="btn btn-primary w-fit">ارسال</button>
      {state?.message ? <p>{state.message}</p> : null}
      {state?.ok && state.id ? <Link className="btn btn-outline" href={"/account/tickets/"+state.id}>مشاهده گفت‌وگو</Link> : null}
    </form>
  );
}

export function ReviewForm({ products }: { products: { id: string; title: string }[] }) {
  const [state, action] = useActionState(submitProductReviewAction, null as State);
  if (!products.length) return <p className="text-muted">پس از خرید محصول می‌توانید نظر بدهید.</p>;
  return (
    <form action={action} className="card grid gap-3 p-5">
      <h2 className="font-bold">ثبت دیدگاه</h2>
      <label className="grid gap-1 text-[0.82rem] font-semibold">محصول
        <select name="productId" className="field" required>
          {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-[0.82rem] font-semibold">امتیاز (۱ تا ۵)
        <select name="rating" className="field" defaultValue="5">
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <textarea name="body" rows={4} required className="field" placeholder="تجربه خرید شما…" />
      <button type="submit" className="btn btn-primary w-fit">ثبت نظر</button>
      {state?.message ? <p className={state.ok ? "text-success" : "text-urgency"}>{state.message}</p> : null}
    </form>
  );
}