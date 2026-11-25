import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/account/downloads", title: "دانلودها" });
}

export default async function DownloadsPage() {
  const customer = await requireCustomer("/account/downloads");
  const grants = await prisma.downloadGrant.findMany({
    where: { order: { customerId: customer.id } },
    orderBy: { createdAt: "desc" },
    include: { order: { select: { number: true } },orderItem:{select:{product:{select:{licenseNote:true}}}} },
  });
  return (
    <section className="card p-5">
      <h1 className="mb-4 font-display text-[1.35rem] font-extrabold">فایل‌های دانلودی</h1>
      {grants.length === 0 ? (
        <div className="account-empty"><p>فایل‌های خریداری‌شده بعد از پرداخت در این بخش قرار می‌گیرند.</p><Link href="/store" className="btn btn-outline">مشاهده فروشگاه</Link></div>
      ) : (
        <ul className="divide-y divide-line">
          {grants.map((g) => {
            const expired = g.expiresAt && g.expiresAt.getTime() < Date.now();
            const ok = g.remaining > 0 && !expired;
            return (
              <li key={g.id} className="flex flex-wrap items-center justify-between gap-3 py-4 text-[0.88rem]">
                <div>
                  <p className="font-bold">{g.title}</p>
                  {g.orderItem.product?.licenseNote && <p className="text-sm">شرایط مجوز: {g.orderItem.product.licenseNote}</p>}
                  <p className="text-muted">سفارش #{g.order.number.toLocaleString("fa-IR")}</p>
                  <p className="text-[0.8rem] text-muted">
                    باقی‌مانده: {g.remaining.toLocaleString("fa-IR")}
                    {g.expiresAt ? ` · تا ${new Date(g.expiresAt).toLocaleDateString("fa-IR")}` : ""}
                  </p>
                </div>
                {ok ? (
                  <Link href={`/api/download/${g.token}`} className="btn btn-primary btn-sm">
                    دانلود
                  </Link>
                ) : (
                  <span className="text-urgency">{expired ? "مهلت دانلود پایان یافته" : "دفعات دانلود تمام شده"}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}