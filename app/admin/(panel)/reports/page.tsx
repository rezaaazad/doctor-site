import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, StatCard } from "@/components/admin/kit";
import { salesReportCsvFormAction } from "@/lib/actions/admin/commerce";
import { formatToman } from "@/lib/money";
import { GATEWAY_LABELS } from "@/lib/store/status";

export const metadata = { title: "گزارش‌ها" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  await requireStaff("view_reports");
  const since = new Date(Date.now() - 30 * 86400_000);
  const [paid, revenue, byGateway, top] = await Promise.all([
    prisma.order.count({ where: { paymentStatus: "paid", createdAt: { gte: since } } }),
    prisma.order.aggregate({ where: { paymentStatus: "paid", createdAt: { gte: since } }, _sum: { totalRial: true } }),
    prisma.order.groupBy({ by: ["gateway"], where: { paymentStatus: "paid", createdAt: { gte: since } }, _count: true, _sum: { totalRial: true } }),
    prisma.orderItem.groupBy({ by: ["productId"], where: { order: { paymentStatus: "paid", createdAt: { gte: since } } }, _sum: { quantity: true }, orderBy: { _sum: { quantity: "desc" } }, take: 8 }),
  ]);
  const productIds = top.map((t) => t.productId).filter(Boolean) as string[];
  const products = productIds.length ? await prisma.storeProduct.findMany({ where: { id: { in: productIds } }, select: { id: true, title: true } }) : [];
  const titleBy = new Map(products.map((p) => [p.id, p.title]));
  return (
    <>
      <PageHeader title="گزارش فروش" description="آمار ۳۰ روز اخیر." actions={<form action={salesReportCsvFormAction}><button className="btn btn-outline btn-sm" type="submit">خروجی CSV</button></form>} />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="سفارش پرداخت‌شده" value={paid.toLocaleString("fa-IR")} tone="primary" />
        <StatCard label="درآمد" value={formatToman(revenue._sum.totalRial ?? 0)} tone="success" />
      </div>
      <Panel title="سهم درگاه‌ها">
        <ul className="space-y-2 text-[0.88rem]">
          {byGateway.map((g) => (
            <li key={g.gateway} className="flex justify-between">
              <span>{GATEWAY_LABELS[g.gateway] ?? g.gateway}</span>
              <span className="num">{g._count} · {formatToman(g._sum.totalRial ?? 0)}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="پرفروش‌ها" className="mt-6">
        <ol className="list-decimal ps-5 text-[0.88rem]">
          {top.map((t) => (
            <li key={t.productId} className="py-1">{titleBy.get(t.productId || "") || "—"} — {Number(t._sum.quantity || 0).toLocaleString("fa-IR")} عدد</li>
          ))}
        </ol>
      </Panel>
    </>
  );
}