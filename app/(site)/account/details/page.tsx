import type { Metadata } from "next";
import { requireCustomer } from "@/lib/customer-auth";
import { buildMetadata } from "@/lib/seo";
import { AccountDetailsForm } from "@/components/account/forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/account/details", title: "مشخصات حساب" });
}

export default async function AccountDetailsPage() {
  const customer = await requireCustomer("/account/details");
  return (
    <AccountDetailsForm
      defaults={{ name: customer.name, email: customer.email, nationalCode: customer.nationalCode, smsOptIn: customer.smsOptIn }}
    />
  );
}