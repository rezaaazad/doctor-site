import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ActionForm } from "@/components/admin/forms";
import { licenseOperation } from "@/lib/actions/admin/licenses";
import { labels } from "@/lib/licenses/delivery";
export default async function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff("manage_orders");
  const { id } = await params;
  const l = await prisma.pluginLicense.findUnique({
    where: { id },
    include: {
      events: { orderBy: { createdAt: "desc" } },
      purchases: {
        include: { item: { include: { order: true } } },
        orderBy: { paidAt: "asc" },
      },
    },
  });
  if (!l) notFound();
  return (
    <main className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 [overflow-wrap:anywhere]">
      <h1>مجوز {l.title}</h1>
      <section className="card grid gap-2 p-4">
        <bdi>{l.host}</bdi>
        <p>
          {l.tier} · نسخه {l.version} · دانلود: {l.downloads}
        </p>
        <p>
          شروع {l.startsAt.toLocaleString("fa-IR")} · پایان{" "}
          {l.expiresAt.toISOString()}
        </p>
        <p>
          {l.blocked || labels[l.state]} · تلاش {l.attempts} · {l.error}
        </p>
        <small className="break-all">{l.checksum}</small>
      </section>
      <section className="card grid gap-2 p-4">
        <h2>خرید و تمدید</h2>
        {l.purchases.map((p) => (
          <Link href={"/admin/orders/" + p.item.orderId} key={p.itemId}>
            سفارش {p.item.order.number} · {p.item.order.name} ·{" "}
            {p.paidAt.toLocaleDateString("fa-IR")} · پایان{" "}
            {p.expiresAt.toISOString()}
          </Link>
        ))}
      </section>
      <section className="card p-4">
        <p>
          توقف تحویل یا بازپرداخت، دانلود بعدی را می‌بندد. ZIP قبلی می‌تواند تا
          انقضا روی همان دامنه فعال بماند. اصلاح دامنه نیاز به بررسی مدیر و خرید
          یا صدور مجزا دارد.
        </p>
        <ActionForm action={licenseOperation.bind(null, id)}>
          <textarea
            className="input"
            name="reason"
            required
            placeholder="دلیل عملیات"
          />
          <button name="op" value="rebuild" className="btn btn-outline">
            تلاش مجدد / بازسازی
          </button>
          <button name="op" value="block" className="btn btn-outline">
            توقف تحویل
          </button>
        </ActionForm>
      </section>
      <ul>
        {l.events.map((e) => (
          <li key={e.id} className="break-all">
            {e.createdAt.toLocaleString("fa-IR")} · {e.body}
          </li>
        ))}
      </ul>
    </main>
  );
}
