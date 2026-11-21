import { getCustomer } from "@/lib/customer-auth";
import { AccountShell } from "@/components/account/shell";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCustomer();
  if (!customer) return children;
  return <AccountShell customerName={customer.name} mobile={customer.mobile}>{children}</AccountShell>;
}