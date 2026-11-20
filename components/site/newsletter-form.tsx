"use client";

import { useActionState } from "react";
import { subscribeNewsletter, type ActionState } from "@/lib/actions";

export function NewsletterForm({ title }: { title: string }) {
  const [state, action, pending] = useActionState(subscribeNewsletter, null as ActionState);
  return (
    <form action={action} className="news">
      <p>{title}</p>
      <div>
        <input name="email" type="email" required placeholder="ایمیل" dir="ltr" aria-label="ایمیل" />
        <button type="submit" disabled={pending}>{pending ? "..." : "ثبت"}</button>
      </div>
      {state?.message ? <small>{state.message}</small> : null}
    </form>
  );
}
