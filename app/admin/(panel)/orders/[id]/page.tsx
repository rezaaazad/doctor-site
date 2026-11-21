import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, KeyValue } from "@/components/admin/kit";
import { formatToman } from "@/lib/money";
import { ORDER_STATUSES, statusLabel, GATEWAY_LABELS, TXN_STATUSES } from "@/lib/store/status";
import { updateOrderFormAction, refundOrderFormAction, paymentOpFormAction } from "@/lib/actions/admin/commerce";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminOrderPage({ params }: Props) {
  const user = await requireStaff("manage_orders");
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, payments: true, notes: { orderBy: { createdAt: "desc" } }, refunds: true },
  });
  if (!order) notFound();
  return (
    <>
      <PageHeader title={`سفارش #${order.number.toLocaleString("fa-IR")}`} back={{ href: "/admin/orders", label: "سفارش‌ها" }} />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel title="جزئیات">
          <KeyValue
            items={[
              { label: "وضعیت", value: statusLabel(order.status) },
              { label: "پرداخت", value: order.paymentStatus },
              { label: "درگاه", value: GATEWAY_LABELS[order.gateway] ?? order.gateway },
              { label: "مشتری", value: `${order.name} (${order.mobile})` },
              { label: "جمع", value: formatToman(order.totalRial) },
              { label: "رهگیری", value: order.trackingCode || "—" },
            ]}
          />
          <h3 className="mb-2 mt-6 font-bold">اقلام</h3>
          <ul className="divide-y divide-line text-[0.86rem]">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between py-2"><span>{i.title} ×{i.quantity}</span><span className="num">{formatToman(i.totalRial)}</span></li>
            ))}
          </ul>
          <h3 className="mb-2 mt-6 font-bold">یادداشت‌ها</h3>
          <ul className="space-y-2 text-[0.85rem] text-muted">{order.notes.map((n) => <li key={n.id}>{n.body}</li>)}</ul>
        </Panel>
        <div className="grid gap-4">
          <Panel title="تغییر وضعیت">
            <form action={updateOrderFormAction} className="grid gap-3">
              <input type="hidden" name="orderId" value={order.id} />
              <select name="status" defaultValue={order.status} className="input">
                {Object.keys(ORDER_STATUSES).map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </select>
              <input name="trackingCode" placeholder="کد رهگیری" defaultValue={order.trackingCode} className="input" dir="ltr" />
              <input name="carrier" placeholder="شرکت حمل" defaultValue={order.carrier} className="input" />
              <textarea name="note" rows={2} placeholder="یادداشت برای مشتری" className="input" />
              <button type="submit" className="btn btn-primary btn-sm">ذخیره</button>
            </form>
          </Panel>
          {user && ["admin", "shop_manager"].includes(user.role) ? (
            <Panel title="استرداد">
              <form action={refundOrderFormAction} className="grid gap-3">
                <input type="hidden" name="orderId" value={order.id} />
                <input name="amount" placeholder="مبلغ تومان" className="input" dir="ltr" />
                <textarea name="reason" rows={2} className="input" placeholder="دلیل" />
                <label className="flex items-center gap-2 text-[0.85rem]"><input type="checkbox" name="toWallet" value="1" /> به کیف پول</label>
                <button type="submit" className="btn btn-outline btn-sm">ثبت استرداد</button>
              </form>
            </Panel>
          ) : null}
          {order.payments.some((p) => ["snapppay", "torobpay"].includes(p.gateway)) ? (
            <Panel title="عملیات اقساطی">
              {order.payments.filter((p) => ["snapppay", "torobpay"].includes(p.gateway)).map((p) => (
                <div key={p.id} className="mb-3 text-[0.85rem]">
                  <p>{TXN_STATUSES[p.status] ?? p.status}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["status", "settle", "revert", "cancel"] as const).map((op) => (
                      <form key={op} action={paymentOpFormAction}>
                        <input type="hidden" name="paymentId" value={p.id} />
                        <input type="hidden" name="op" value={op} />
                        <button type="submit" className="btn btn-ghost btn-sm">{op}</button>
                      </form>
                    ))}
                  </div>
                </div>
              ))}
            </Panel>
          ) : null}
        </div>
      </div>
    </>
  );
}