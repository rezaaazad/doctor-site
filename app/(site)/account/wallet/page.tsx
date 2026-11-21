import type { Metadata } from "next";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/account/wallet", title: "کیف پول" });
}

export default async function WalletPage() {
  const customer = await requireCustomer("/account/wallet");
  const [txs, coupons] = await Promise.all([
    prisma.walletTransaction.findMany({ where: { customerId: customer.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.coupon.findMany({ where: { active: true, OR: [{ customerMobile: "" }, { customerMobile: customer.mobile }] }, take: 20 }),
  ]);
  return (
    <div className="grid gap-6">
      <section className="card p-5">
        <h1 className="font-display text-[1.35rem] font-extrabold">کیف پول</h1>
        <p className="mt-3 font-display text-[2rem] font-extrabold text-primary">{formatToman(customer.walletRial)}</p>
      </section>
      <section className="card p-5">
        <h2 className="mb-3 font-bold">تراکنش‌ها</h2>
        {txs.length === 0 ? (
          <p className="text-muted">تراکنشی نیست.</p>
        ) : (
          <ul className="divide-y divide-line text-[0.88rem]">
            {txs.map((t) => (
              <li key={t.id} className="flex justify-between gap-3 py-3">
                <span>{t.reason}</span>
                <span className={`num font-bold ${Number(t.amountRial) >= 0 ? "text-success" : "text-urgency"}`}>{formatToman(t.amountRial)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card p-5">
        <h2 className="mb-3 font-bold">کدهای تخفیف در دسترس</h2>
        {coupons.length === 0 ? (
          <p className="text-muted">کد فعالی نیست.</p>
        ) : (
          <ul className="space-y-2 text-[0.88rem]">
            {coupons.map((c) => (
              <li key={c.id} className="rounded-xl border border-line px-3 py-2">
                <span className="font-bold" dir="ltr">{c.code}</span>
                {c.description ? <span className="text-muted"> — {c.description}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}