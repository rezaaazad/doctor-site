"use client";

import { useTransition } from "react";
import { retryPaymentAction } from "@/lib/actions/shop";

export function CheckoutRetry({ orderNumber, accessKey, gateway }: { orderNumber: number; accessKey: string; gateway: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      className="btn btn-action"
      onClick={() =>
        start(async () => {
          const result = await retryPaymentAction(orderNumber, accessKey, gateway);
          if (result.ok) window.location.href = result.redirect;
          else alert(result.message);
        })
      }
    >
      {pending ? "در حال اتصال…" : "تلاش مجدد برای پرداخت"}
    </button>
  );
}