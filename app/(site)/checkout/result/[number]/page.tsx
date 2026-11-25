import {ProjectBrief} from "@/components/store/project-brief";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { formatToman } from "@/lib/money";
import { CheckoutRetry } from "@/components/store/checkout-retry";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ number: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/checkout/result", title: "نتیجه پرداخت",noindex:true });
}

export default async function CheckoutResultPage({ params, searchParams }: Props) {
  const { number: numStr } = await params;
  const sp = await searchParams;
  const number = Number(numStr);
  const accessKey = typeof sp.k === "string" ? sp.k : "";

  const msg = typeof sp.msg === "string" ? sp.msg : "";
  if (!Number.isSafeInteger(number) || number<=0 || !accessKey) notFound();
  const order = await prisma.order.findUnique({ where: { number, accessKey }, include: { items: {include:{product:{select:{briefSchema:true}}}} } });
  if (!order) notFound();
  const success = order.paymentStatus === "paid";

  return (
    <div className="wrap pad pb-20">
      <div className="card mx-auto max-w-xl p-8 text-center">
        <p className={`text-[0.85rem] font-bold ${success ? "text-success" : "text-urgency"}`}>{success ? "پرداخت موفق" : "پرداخت ناموفق"}</p>
        <h1 className="mt-3 font-display text-[1.75rem] font-extrabold">سفارش شماره {order.number.toLocaleString("fa-IR")}</h1>
        <p className="mt-3 text-[0.92rem] leading-7 text-muted">{msg || (success ? "سفارش شما ثبت و پرداخت تأیید شد." : "پرداخت تکمیل نشد.")}</p>
        <dl className="mt-6 space-y-2 text-[0.88rem] text-right">
          <Row label="مبلغ" value={formatToman(order.totalRial)} />
          <Row label="وضعیت" value={order.status} />
          <Row label="موبایل" value={order.mobile} />
        </dl>
        <ProjectBrief order={order} accessKey={accessKey}/>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/account/orders/${order.id}`} className="btn btn-primary">
            پیگیری سفارش
          </Link>
          <Link href="/store" className="btn btn-outline">
            ادامه خرید
          </Link>
        </div>
        {!success && order.paymentStatus === "unpaid" ? (
          <div className="mt-6 border-t border-line pt-6">
            <CheckoutRetry orderNumber={order.number} accessKey={order.accessKey} gateway={order.gateway} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}
