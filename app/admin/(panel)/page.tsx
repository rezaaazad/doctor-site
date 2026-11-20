import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function DashboardPage() {
  const [projects, services, unread, recent] = await Promise.all([
    prisma.project.count(),
    prisma.service.count(),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);
  const cards = [
    ["نمونه‌کارها", projects, "/admin/projects"],
    ["خدمات", services, "/admin/services"],
    ["پیام نخوانده", unread, "/admin/messages"],
  ] as const;
  return (
    <div className="grid gap-8">
      <div>
        <p className="kicker">مدیریت</p>
        <h1 className="mt-2 text-3xl font-black">همه‌چیز سایت از همین‌جا عوض می‌شود.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">ذخیره، همان لحظه روی سایت دیده می‌شود. نیازی به ساخت دوباره نیست.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(([label, value, href]) => (
          <Link key={href} href={href} className="rounded-3xl border border-white/10 p-5 hover:border-[var(--accent)]">
            <p className="text-sm text-white/50">{label}</p>
            <p className="mt-3 text-4xl font-black text-[var(--accent)]">{value}</p>
          </Link>
        ))}
      </div>
      <section>
        <h2 className="mb-3 font-bold">آخرین پیام‌ها</h2>
        {recent.length === 0 ? <p className="text-sm text-white/45">صندوق خالی است.</p> : (
          <ul className="divide-y divide-white/10 rounded-3xl border border-white/10">
            {recent.map((message) => (
              <li key={message.id}>
                <Link href={`/admin/messages/${message.id}`} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                  <span>{message.name} — {message.subject || "بدون موضوع"}</span>
                  <span className={message.read ? "text-white/35" : "text-[var(--accent)]"}>{message.read ? "خوانده" : "جدید"}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
