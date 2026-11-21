import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { formatToman } from "@/lib/money";
import { statusLabel, PAYMENT_STATUSES } from "@/lib/store/status";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/account/orders", title: "سفارش‌های من" });
}

export default async function AccountOrdersPage() {
  const customer = await requireCustomer("/account/orders");
  const orders = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { title: true, quantity: true } } },
  });
  return (
    <section className="card p-5">
      <h1 className="mb-4 font-display text-[1.35rem] font-extrabold">سفارش‌های من</h1>
      {orders.length === 0 ? (
        <p className="text-muted">سفارشی ثبت نشده است.</p>
      ) : (
        <ul className="divide-y divide-line">
          {orders.map((o) => (
            <li key={o.id} className="py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/account/orders/${o.id}`} className="text-[1rem] font-bold hover:text-primary">
                    سفارش #{o.number.toLocaleString("fa-IR")}
                  </Link>
                  <p className="mt-1 text-[0.82rem] text-muted">
                    {new Date(o.createdAt).toLocaleDateString("fa-IR")} · {statusLabel(o.status)} · {PAYMENT_STATUSES[o.paymentStatus as keyof typeof PAYMENT_STATUSES] ?? o.paymentStatus}
                  </p>
                  <p className="mt-1 text-[0.8rem] text-muted">{o.items.map((i) => `${i.title} ×${i.quantity}`).join("، ")}</p>
                </div>
                <span className="num font-bold">{formatToman(o.totalRial)}</span>
              </div>
              {o.trackingCode ? (
                <p className="mt-2 text-[0.82rem]">
                  رهگیری: <span className="num font-semibold" dir="ltr">{o.trackingCode}</span>
                  {o.carrier ? ` (${o.carrier})` : null}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}