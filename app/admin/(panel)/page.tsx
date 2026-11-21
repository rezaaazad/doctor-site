import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/roles";
import { PageHeader, StatCard, Panel } from "@/components/admin/kit";
import { formatToman } from "@/lib/money";
import { sweepStalePendingOrders } from "@/lib/store/orders";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireStaff("view_dashboard");
  await sweepStalePendingOrders();
  const since = new Date(Date.now() - 7 * 86400_000);
  const [pendingOrders, revenueWeek, leads, lowStock] = await Promise.all([
    can(user.role, "manage_orders") ? prisma.order.count({ where: { status: { in: ["processing", "on_hold", "pending"] } } }) : 0,
    can(user.role, "view_reports") ? prisma.order.aggregate({ where: { paymentStatus: "paid", createdAt: { gte: since } }, _sum: { totalRial: true } }) : null,
    can(user.role, "manage_leads") ? prisma.contactMessage.count({ where: { status: "new" } }) : 0,
    can(user.role, "manage_store") ? prisma.storeProduct.count({ where: { manageStock: true, stock: { lte: 3 }, published: true } }) : 0,
  ]);
  return (
    <>
      <PageHeader title="پیشخوان" description="نمای کلی فروشگاه و سایت." />
      <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {can(user.role, "manage_orders") ? <StatCard label="سفارش‌های باز" value={pendingOrders.toLocaleString("fa-IR")} href="/admin/orders" tone="action" /> : null}
        {revenueWeek ? <StatCard label="فروش ۷ روز" value={formatToman(revenueWeek._sum.totalRial ?? 0)} href="/admin/reports" tone="success" /> : null}
        {can(user.role, "manage_leads") ? <StatCard label="لید جدید" value={leads.toLocaleString("fa-IR")} href="/admin/leads" tone="primary" /> : null}
        {can(user.role, "manage_store") ? <StatCard label="موجودی کم" value={lowStock.toLocaleString("fa-IR")} href="/admin/products" tone="urgency" /> : null}
      </div>
      <Panel title="میانبرها">
        <AdminShortcuts userRole={user.role} />
      </Panel>
    </>
  );
}

function AdminShortcuts({ userRole }: { userRole: string }) {
  const links = [
    { href: "/admin/products", label: "محصولات", cap: "manage_store" },
    { href: "/admin/orders", label: "سفارش‌ها", cap: "manage_orders" },
    { href: "/admin/posts", label: "نوشته‌ها", cap: "manage_content" },
    { href: "/admin/homepage", label: "صفحه اصلی", cap: "manage_appearance" },
    { href: "/admin/settings", label: "تنظیمات", cap: "manage_settings" },
  ].filter((l) => can(userRole, l.cap as import("@/lib/roles").Capability));
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <Link key={l.href} href={l.href} className="btn btn-outline btn-sm">{l.label}</Link>
      ))}
    </div>
  );
}