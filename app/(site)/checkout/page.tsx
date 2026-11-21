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
    <div className="wrap pad pb-20">
      <h1 className="mb-8 font-display text-[2rem] font-extrabold">تسویه حساب</h1>
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