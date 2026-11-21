import type { Metadata } from "next";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { formatToman } from "@/lib/money";
import { GATEWAY_LABELS, TXN_STATUSES } from "@/lib/store/status";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/account/installments", title: "وضعیت اقساط" });
}

export default async function InstallmentsPage() {
  const customer = await requireCustomer("/account/installments");
  const payments = await prisma.payment.findMany({
    where: {
      gateway: { in: ["snapppay", "torobpay"] },
      order: { customerId: customer.id },
    },
    include: { order: { select: { number: true, id: true, totalRial: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <section className="card p-5">
      <h1 className="mb-4 font-display text-[1.35rem] font-extrabold">خریدهای اقساطی</h1>
      {payments.length === 0 ? (
        <p className="text-muted">تراکنش اقساطی ثبت نشده است.</p>
      ) : (
        <ul className="divide-y divide-line text-[0.88rem]">
          {payments.map((p) => (
            <li key={p.id} className="py-4">
              <p className="font-bold">
                سفارش #{p.order.number.toLocaleString("fa-IR")} — {GATEWAY_LABELS[p.gateway]}
              </p>
              <p className="mt-1 text-muted">{TXN_STATUSES[p.status] ?? p.status} · {formatToman(p.amountRial)}</p>
              {p.refId ? <p className="mt-1 num text-[0.82rem]" dir="ltr">شناسه: {p.refId}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}