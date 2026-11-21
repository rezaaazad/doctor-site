import { AdminShell } from "@/components/admin/shell";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ADMIN_NAV } from "@/lib/admin/nav";
import { can, roleLabel } from "@/lib/roles";
import { getSiteSafe } from "@/lib/site";

export const metadata = { robots: { index: false, follow: false }, title: { default: "پنل مدیریت", template: "%s · پنل مدیریت" } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff();
  const nav = ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((i) => can(user.role, i.cap)) })).filter((g) => g.items.length);
  const [orders, leads, comments, tickets, site] = await Promise.all([
    can(user.role, "manage_orders") ? prisma.order.count({ where: { status: { in: ["processing", "on_hold"] } } }).catch(() => 0) : 0,
    can(user.role, "manage_leads") ? prisma.contactMessage.count({ where: { status: "new" } }).catch(() => 0) : 0,
    can(user.role, "moderate_comments") ? prisma.comment.count({ where: { status: "pending" } }).catch(() => 0) : 0,
    can(user.role, "manage_tickets") ? prisma.ticket.count({ where: { status: { in: ["open", "customer_reply"] } } }).catch(() => 0) : 0,
    getSiteSafe(),
  ]);
  return (
    <AdminShell user={{ name: user.name, email: user.email, roleLabel: roleLabel(user.role) }} nav={nav} badges={{ orders, leads, comments, tickets }} siteName={site.settings.siteName}>
      {children}
    </AdminShell>
  );
}
