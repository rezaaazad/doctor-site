import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { formatToman } from "@/lib/money";
import { GATEWAY_LABELS, TRACKING_STEPS, statusLabel, TXN_STATUSES } from "@/lib/store/status";
import { CheckoutRetry } from "@/components/store/checkout-retry";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `سفارش ${id.slice(0, 8)}` };
}

export default async function AccountOrderPage({ params }: Props) {
  const customer = await requireCustomer();
  const { id } = await params;
  const order = await prisma.order.findFirst({
    where: { id, customerId: customer.id },
    include: { items: true, payments: true, notes: { where: { toCustomer: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!order) notFound();
  const stepIndex = TRACKING_STEPS.findIndex((s) => s.status === order.status);

  return (
    <div className="grid gap-6">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[1.4rem] font-extrabold">سفارش #{order.number.toLocaleString("fa-IR")}</h1>
            <p className="mt-1 text-[0.85rem] text-muted">{new Date(order.createdAt).toLocaleString("fa-IR")}</p>
          </div>
          <Link href={`/account/orders/${order.id}/invoice`} className="btn btn-outline btn-sm" target="_blank">
            فاکتور
          </Link>
        </div>
        <ol className="mt-6 grid gap-2 sm:grid-cols-4">
          {TRACKING_STEPS.map((step, i) => (
            <li key={step.status} className={cn("rounded-xl border px-3 py-2 text-center text-[0.78rem] font-semibold", i <= stepIndex ? "border-primary bg-primary-soft text-primary" : "border-line text-muted")}>
              {step.label}
            </li>
          ))}
        </ol>
        {order.trackingCode ? (
          <p className="mt-4 text-[0.88rem]">
            کد رهگیری مرسوله: <b className="num" dir="ltr">{order.trackingCode}</b> {order.carrier ? ` — ${order.carrier}` : ""}
          </p>
        ) : null}
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">اقلام</h2>
        <ul className="divide-y divide-line text-[0.88rem]">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3">
              <span>
                {item.title}
                {item.variantTitle ? ` — ${item.variantTitle}` : ""} × {item.quantity.toLocaleString("fa-IR")}
              </span>
              <span className="num font-semibold">{formatToman(item.totalRial)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1 border-t border-line pt-4 text-[0.88rem]">
          <Row label="جمع" value={formatToman(order.subtotalRial)} />
          {Number(order.discountRial) > 0 ? <Row label="تخفیف" value={`- ${formatToman(order.discountRial)}`} /> : null}
          {Number(order.shippingRial) > 0 ? <Row label="ارسال" value={formatToman(order.shippingRial)} /> : null}
          <Row label="مبلغ نهایی" value={formatToman(order.totalRial)} bold />
        </dl>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">پرداخت</h2>
        <p className="text-[0.88rem] text-muted">درگاه: {GATEWAY_LABELS[order.gateway] ?? order.gateway}</p>
        <ul className="mt-3 space-y-2 text-[0.85rem]">
          {order.payments.map((p) => (
            <li key={p.id} className="rounded-xl border border-line px-3 py-2">
              {TXN_STATUSES[p.status] ?? p.status} · {formatToman(p.amountRial)}
              {p.refId ? <span className="ms-2 num text-muted" dir="ltr">{p.refId}</span> : null}
            </li>
          ))}
        </ul>
        {order.paymentStatus === "unpaid" && ["pending", "failed"].includes(order.status) ? (
          <div className="mt-4">
            <CheckoutRetry orderNumber={order.number} accessKey={order.accessKey} gateway={order.gateway} />
          </div>
        ) : null}
      </section>

      {order.notes.length ? (
        <section className="card p-5">
          <h2 className="mb-3 font-bold">یادداشت فروشگاه</h2>
          <ul className="space-y-2 text-[0.88rem] text-muted">
            {order.notes.map((n) => (
              <li key={n.id}>{n.body}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-3", bold && "font-extrabold text-fg")}>
      <dt className="text-muted">{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}
