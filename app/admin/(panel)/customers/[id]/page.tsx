import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, KeyValue } from "@/components/admin/kit";
import { updateCustomerFormAction } from "@/lib/actions/admin/commerce";
import { rialToToman, formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function CustomerDetailPage({ params }: Props) {
  await requireStaff("manage_customers");
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" }, take: 10 }, wallet: { orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!customer) notFound();
  return (
    <>
      <PageHeader title={customer.name || customer.mobile} back={{ href: "/admin/customers", label: "مشتری‌ها" }} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="ویرایش">
          <form action={updateCustomerFormAction} className="grid gap-3">
            <input type="hidden" name="id" value={customer.id} />
            <input name="name" defaultValue={customer.name} className="input" placeholder="نام" />
            <input name="email" defaultValue={customer.email} className="input" dir="ltr" placeholder="ایمیل" />
            <input name="walletToman" defaultValue={rialToToman(customer.walletRial)} className="input" dir="ltr" placeholder="کیف پول تومان" />
            <textarea name="note" defaultValue={customer.note} rows={3} className="input" />
            <label className="flex items-center gap-2 text-[0.85rem]"><input type="checkbox" name="blocked" value="1" defaultChecked={customer.blocked} /> مسدود</label>
            <button type="submit" className="btn btn-primary btn-sm w-fit">ذخیره</button>
          </form>
        </Panel>
        <Panel title="خلاصه">
          <KeyValue items={[
            { label: "موبایل", value: customer.mobile },
            { label: "کیف پول", value: formatToman(customer.walletRial) },
            { label: "تعداد سفارش", value: customer.orders.length.toLocaleString("fa-IR") },
          ]} />
        </Panel>
      </div>
    </>
  );
}