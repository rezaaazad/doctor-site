import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { markAllNotificationsReadFormAction } from "@/lib/actions/account";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/account/notifications", title: "اعلان‌ها" });
}

export default async function NotificationsPage() {
  const customer = await requireCustomer("/account/notifications");
  const items = await prisma.notification.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <section className="card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-[1.35rem] font-extrabold">اعلان‌ها</h1>
        <form action={markAllNotificationsReadFormAction}>
          <button type="submit" className="btn btn-ghost btn-sm">همه خوانده شد</button>
        </form>
      </div>
      {items.length === 0 ? (
        <p className="text-muted">اعلانی نیست.</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((n) => (
            <li key={n.id} className={n.readAt ? "py-3 text-muted" : "py-3"}>
              <p className="font-bold">{n.title}</p>
              {n.body ? <p className="mt-1 text-[0.88rem]">{n.body}</p> : null}
              {n.href ? (
                <Link href={n.href} className="mt-1 inline-block text-[0.82rem] text-primary">
                  مشاهده
                </Link>
              ) : null}
              <p className="mt-1 text-[0.75rem] text-muted">{new Date(n.createdAt).toLocaleString("fa-IR")}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}