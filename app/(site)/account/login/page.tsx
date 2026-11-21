import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCustomer, safeCustomerNext } from "@/lib/customer-auth";
import { buildMetadata } from "@/lib/seo";
import { AccountLoginForm } from "@/components/account/login-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/account/login", title: "ورود به حساب" });
}

export default async function AccountLoginPage({ searchParams }: Props) {
  const customer = await getCustomer();
  const sp = await searchParams;
  const next = safeCustomerNext(typeof sp.next === "string" ? sp.next : "/account");
  if (customer) redirect(next);
  return (
    <div className="wrap pad flex min-h-[70vh] items-center py-16">
      <Suspense>
        <AccountLoginForm />
      </Suspense>
    </div>
  );
}