import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { getCustomer } from "@/lib/customer-auth";
import { getOptions } from "@/lib/options";
import { CheckoutForm } from "@/components/store/checkout-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/checkout", title: "تسویه حساب", description: "تکمیل سفارش و پرداخت" });
}

export default async function CheckoutPage() {
  const [customer, options] = await Promise.all([getCustomer().catch(() => null), getOptions()]);
  return (
    <div className="wrap pad pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-20">
      <h1 className="mb-2 font-display text-[1.75rem] font-extrabold md:text-[2rem]">تسویه حساب</h1>
      <p className="mb-8 text-[0.88rem] leading-7 text-muted">اطلاعات را بررسی کنید و روش پرداخت امن را انتخاب کنید. در صورت مشکل، سفارش ذخیره می‌شود تا بتوانید دوباره پرداخت کنید.</p>
      <CheckoutForm
        signedIn={Boolean(customer)}
        customer={
          customer
            ? { name: customer.name, mobile: customer.mobile, email: customer.email, walletRial: Number(customer.walletRial) }
            : null
        }
        guestCheckout={Boolean(options.store.guestCheckout)}
        termsUrl={String(options.store.termsUrl || "/terms")}
      />
    </div>
  );
}