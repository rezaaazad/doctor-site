import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sweepStalePendingOrders } from "@/lib/store/orders";
import { PageHeader, Panel, Table, Th, Td, FilterBar, Pagination, parsePage, Tabs } from "@/components/admin/kit";
import { formatToman } from "@/lib/money";
import { statusLabel, GATEWAY_LABELS } from "@/lib/store/status";

export const dynamic = "force-dynamic";
export const metadata = { title: "سفارش‌ها" };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff("manage_orders");
  await sweepStalePendingOrders();
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const status = sp.status || "";
  const per = 30;
  const where = {
    ...(status ? { status } : {}),
    ...(sp.q ? { OR: [{ mobile: { contains: sp.q } }, { name: { contains: sp.q, mode: "insensitive" as const } }] } : {}),
    ...(sp.gateway ? { gateway: sp.gateway } : {}),
  };
  const [total, rows, counts] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * per, take: per }),
    prisma.order.groupBy({ by: ["status"], _count: true }),
  ]);
  const tabs = [
    { key: "", label: "همه", href: "/admin/orders", count: counts.reduce((s, c) => s + c._count, 0) },
    ...counts.map((c) => ({ key: c.status, label: statusLabel(c.status), href: `/admin/orders?status=${c.status}`, count: c._count })),
  ];
  return (
    <>
      <PageHeader title="سفارش‌ها" />
      <Panel>
        <Tabs items={tabs} active={status} />
        <FilterBar
          base="/admin/orders"
          params={sp}
          selects={[
            { name: "gateway", label: "درگاه", options: Object.entries(GATEWAY_LABELS).map(([value, label]) => ({ value, label })) },
          ]}
        />
        <Table>
          <thead><tr><Th>شماره</Th><Th>مشتری</Th><Th>مبلغ</Th><Th>وضعیت</Th><Th>پرداخت</Th></tr></thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id}>
                <Td><Link href={`/admin/orders/${o.id}`} className="num font-semibold text-primary">#{o.number.toLocaleString("fa-IR")}</Link></Td>
                <Td>{o.name}<br /><span className="text-[0.78rem] text-muted" dir="ltr">{o.mobile}</span></Td>
                <Td className="num">{formatToman(o.totalRial)}</Td>
                <Td>{statusLabel(o.status)}</Td>
                <Td>{o.paymentStatus}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination page={page} pages={Math.max(1, Math.ceil(total / per))} total={total} base="/admin/orders" params={sp} />
      </Panel>
    </>
  );
}