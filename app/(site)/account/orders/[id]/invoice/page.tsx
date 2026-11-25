import {readAddons} from "@/lib/store/addons";
import { PrintInvoice } from "@/components/account/print-invoice";
import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { getSiteSafe } from "@/lib/site";
import { formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function InvoicePage({ params }: Props) {
  const customer = await requireCustomer();
  const { id } = await params;
  const [order, site] = await Promise.all([
    prisma.order.findFirst({ where: { id, customerId: customer.id }, include: { items: true } }),
    getSiteSafe(),
  ]);
  if (!order) notFound();
  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-fg print:m-0 print:p-0" dir="rtl">
      <header className="mb-8 border-b border-line pb-6">
        <h1 className="text-2xl font-extrabold">{site.settings.siteName}</h1>
        <p className="text-sm text-muted">فاکتور فروش · سفارش #{order.number.toLocaleString("fa-IR")}</p>
        <p className="mt-2 text-sm">{new Date(order.createdAt).toLocaleString("fa-IR")}</p>
      </header>
      <section className="mb-6 grid gap-1 text-sm">
        <p><b>خریدار:</b> {order.name} {order.invoiceCompany} {order.invoiceNationalId} — {order.mobile}</p>
      </section>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-right">
            <th className="py-2">شرح</th>
            <th className="py-2">تعداد</th>
            <th className="py-2">مبلغ</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id} className="border-b border-line">
              <td className="py-2">{item.title} {readAddons(item.addons).map(a=>a.title).join("، ")}{item.variantTitle ? ` (${item.variantTitle})` : ""}</td>
              <td className="py-2 num">{item.quantity.toLocaleString("fa-IR")}</td>
              <td className="py-2 num">{formatToman(item.totalRial)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="mt-6 text-left text-sm font-bold">جمع کل: {formatToman(order.totalRial)}</footer>
      <PrintInvoice/>
    </div>
  );
}