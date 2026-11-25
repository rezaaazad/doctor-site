import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Bell, Ticket, Heart, Download } from "lucide-react";
import { requireCustomer } from "@/lib/customer-auth";
import { accountDashboardData } from "@/lib/actions/account";
import { buildMetadata } from "@/lib/seo";
import { formatToman } from "@/lib/money";
import { prisma } from "@/lib/db";
import { statusLabel, GATEWAY_LABELS } from "@/lib/store/status";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/account", title: "حساب کاربری" });
}

export default async function AccountDashboardPage() {
  const customer = await requireCustomer();
  const stats = await accountDashboardData();
  if (!stats) redirect("/account/login");
  const recent = await prisma.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, number: true, status: true, paymentStatus: true, totalRial: true, gateway: true, createdAt: true },
  });

  const tickets = await prisma.ticket.findMany({where:{customerId:customer.id,status:{not:"closed"}},orderBy:{updatedAt:"desc"},take:3,select:{id:true,subject:true,updatedAt:true}});
  const cards = [
    { label: "سفارش‌ها", value: stats.orders, href: "/account/orders", icon: Package },
    { label: "اعلان نخوانده", value: stats.unread, href: "/account/notifications", icon: Bell },
    { label: "تیکت باز", value: stats.tickets, href: "/account/tickets", icon: Ticket },
    { label: "علاقه‌مندی", value: stats.wishlist, href: "/account/wishlist", icon: Heart },
    { label: "دانلود فعال", value: stats.downloads, href: "/account/downloads", icon: Download },
  ];

  return (
    <div className="grid gap-6">
      <header><h1 className="account-heading">سلام{customer.name ? "، "+customer.name : ""}</h1><p className="text-muted">سفارش‌ها، فایل‌ها و پیام‌های پشتیبانی شما</p></header>
      <section className="account-wallet card p-5">
        <p className="text-[0.85rem] text-muted">موجودی کیف پول</p>
        <p className="mt-1 font-display text-[1.6rem] font-extrabold text-primary">{formatToman(stats.wallet)}</p>
        <Link href="/account/wallet" className="mt-3 inline-block text-[0.82rem] font-semibold text-primary hover:underline">
          جزئیات کیف پول
        </Link>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.href} href={c.href} className="card card-hover flex items-center gap-4 p-4">
              <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-[0.8rem] text-muted">{c.label}</span>
                <span className="num text-[1.35rem] font-extrabold">{c.value.toLocaleString("fa-IR")}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">آخرین سفارش‌ها</h2>
          <Link href="/account/orders" className="text-[0.82rem] font-semibold text-primary">
            همه
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-[0.88rem] text-muted">هنوز سفارشی ندارید.</p>
        ) : (
          <ul className="divide-y divide-line">
            {recent.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[0.88rem]">
                <div>
                  <Link href={`/account/orders/${o.id}`} className="font-bold hover:text-primary">
                    سفارش {o.number.toLocaleString("fa-IR")}
                  </Link>
                  <p className="mt-0.5 text-muted">
                    {statusLabel(o.status)} · {GATEWAY_LABELS[o.gateway] ?? o.gateway}
                  </p>
                </div>
                <span className="num font-bold">{formatToman(o.totalRial)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="card p-5"><h2 className="font-bold">گفت‌وگوهای باز</h2>{tickets.length ? <ul>{tickets.map(t=><li key={t.id}><Link className="account-line" href={"/account/tickets/"+t.id}>{t.subject}<small>{t.updatedAt.toLocaleDateString("fa-IR")}</small></Link></li>)}</ul> : <p className="my-3 text-muted">تیکت بازی ندارید.</p>}<Link className="btn btn-outline btn-sm" href="/account/tickets#new-ticket">ثبت تیکت</Link></section>
    </div>
  );
}