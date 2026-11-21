"use client";

import { useActionState } from "react";
import { PROVINCES } from "@/lib/iran";
import { saveAccountDetailsAction, saveAddressAction, openTicketAction, submitProductReviewAction } from "@/lib/actions/account";
import { TICKET_DEPARTMENTS } from "@/lib/store/status";

type State = { ok?: boolean; message?: string } | null;

export function AccountDetailsForm({
  defaults,
}: {
  defaults: { name: string; email: string; nationalCode: string; smsOptIn: boolean };
}) {
  const [state, action] = useActionState(saveAccountDetailsAction, null as State);
  return (
    <form action={action} className="card grid gap-4 p-5">
      <h1 className="font-display text-[1.35rem] font-extrabold">مشخصات حساب</h1>
      <label className="grid gap-1.5 text-[0.85rem] font-semibold">
        نام و نام خانوادگی
        <input name="name" defaultValue={defaults.name} className="field text-base" />
      </label>
      <label className="grid gap-1.5 text-[0.85rem] font-semibold">
        ایمیل
        <input name="email" type="email" defaultValue={defaults.email} className="field text-base" dir="ltr" />
      </label>
      <label className="grid gap-1.5 text-[0.85rem] font-semibold">
        کد ملی
        <input name="nationalCode" defaultValue={defaults.nationalCode} className="field text-base" dir="ltr" />
      </label>
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
  const [state, action] = useActionState(saveAddressAction, null as State);
  return (
    <form action={action} className="grid gap-3 rounded-xl border border-line p-4">
      {address?.id ? <input type="hidden" name="id" value={address.id} /> : null}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-[0.82rem] font-semibold">عنوان<input name="title" defaultValue={address?.title} className="field" placeholder="خانه" /></label>
        <label className="grid gap-1 text-[0.82rem] font-semibold">گیرنده *<input name="receiver" required defaultValue={address?.receiver} className="field" /></label>
        <label className="grid gap-1 text-[0.82rem] font-semibold">موبایل *<input name="mobile" required defaultValue={address?.mobile} className="field" dir="ltr" /></label>
        <label className="grid gap-1 text-[0.82rem] font-semibold">استان *
          <select name="province" required defaultValue={address?.province} className="field">
            <option value="">انتخاب</option>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-[0.82rem] font-semibold md:col-span-2">شهر *<input name="city" required defaultValue={address?.city} className="field" /></label>
        <label className="grid gap-1 text-[0.82rem] font-semibold md:col-span-2">آدرس *<textarea name="line" required rows={2} defaultValue={address?.line} className="field" /></label>
        <label className="grid gap-1 text-[0.82rem] font-semibold">کد پستی<input name="postalCode" defaultValue={address?.postalCode} className="field" dir="ltr" /></label>
      </div>
      <label className="flex items-center gap-2 text-[0.82rem]"><input type="checkbox" name="isDefault" value="1" defaultChecked={address?.isDefault} /> آدرس پیش‌فرض</label>
      <button type="submit" className="btn btn-primary btn-sm w-fit">ذخیره آدرس</button>
      {state?.message ? <p className="text-[0.85rem] text-success">{state.message}</p> : null}
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
      <label className="grid gap-1 text-[0.82rem] font-semibold">موضوع *<input name="subject" required className="field" /></label>
      <label className="grid gap-1 text-[0.82rem] font-semibold">پیام *<textarea name="body" required rows={4} className="field" /></label>
      <button type="submit" className="btn btn-primary w-fit">ارسال</button>
      {state?.message ? <p>{state.message}</p> : null}
      {state?.ok && state.id ? <p className="text-success">تیکت ثبت شد.</p> : null}
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