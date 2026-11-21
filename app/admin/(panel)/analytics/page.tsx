import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function since(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function totals(from: Date) {
  const [views, visitors] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: from } } }),
    prisma.pageView.findMany({ where: { createdAt: { gte: from } }, distinct: ["visitorHash"], select: { visitorHash: true } }),
  ]);
  return { views, visitors: visitors.length };
}

export default async function AnalyticsPage() {
  const now = new Date();
  const startToday = new Date(now);
  startToday.setHours(0, 0, 0, 0);
  const [today, week, month, pages, refs, devices, series] = await Promise.all([
    totals(startToday),
    totals(since(7)),
    totals(since(30)),
    prisma.pageView.groupBy({ by: ["path"], where: { createdAt: { gte: since(30) } }, _count: { _all: true }, orderBy: { _count: { path: "desc" } }, take: 8 }),
    prisma.pageView.groupBy({ by: ["referrer"], where: { createdAt: { gte: since(30) }, NOT: { referrer: "" } }, _count: { _all: true }, orderBy: { _count: { referrer: "desc" } }, take: 8 }),
    prisma.pageView.groupBy({ by: ["device"], where: { createdAt: { gte: since(30) } }, _count: { _all: true } }),
    Promise.all(Array.from({ length: 14 }, (_, index) => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - (13 - index));
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      return prisma.pageView.count({ where: { createdAt: { gte: day, lt: next } } });
    })),
  ]);
  const max = Math.max(1, ...series);
  const cards = [
    ["امروز", today],
    ["۷ روز", week],
    ["۳۰ روز", month],
  ] as const;
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">آمارگیر</h1>
      <p className="text-sm text-white/60">بازدیدها روی همین سرور می‌مانند. ربات و صفحه مدیریت شمرده نمی‌شود. شناسه بازدیدکننده هش روزانه است، نه آی‌پی خام.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map(([label, stat]) => (
          <article key={label} className="rounded-3xl border border-white/10 p-4">
            <p className="text-white/50">{label}</p>
            <p className="mt-2 text-3xl font-black">{stat.visitors.toLocaleString("fa-IR")}</p>
            <p className="text-sm text-white/60">بازدیدکننده یکتا</p>
            <p className="mt-2 text-xl">{stat.views.toLocaleString("fa-IR")} بازدید صفحه</p>
          </article>
        ))}
      </div>
      <section>
        <h2 className="mb-3 text-xl font-bold">۱۴ روز اخیر</h2>
        <div className="flex h-36 items-end gap-1">
          {series.map((value, index) => (
            <div key={index} className="flex-1 rounded-t bg-[var(--accent)]" style={{ height: `${Math.max(4, (value / max) * 100)}%` }} title={String(value)} />
          ))}
        </div>
      </section>
      <div className="grid gap-6 lg:grid-cols-3">
        <List title="صفحه‌ها" rows={pages.map((row) => [row.path, row._count._all])} />
        <List title="ارجاع" rows={refs.map((row) => [row.referrer || "مستقیم", row._count._all])} />
        <List title="دستگاه" rows={devices.map((row) => [row.device || "نامشخص", row._count._all])} />
      </div>
    </div>
  );
}

function List({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <section className="rounded-3xl border border-white/10 p-4">
      <h2 className="mb-3 font-bold">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-white/40">هنوز بازدیدی نیست.</p> : null}
      <ul className="grid gap-2 text-sm">
        {rows.map(([label, count]) => (
          <li key={label} className="flex justify-between gap-3"><span className="truncate">{label}</span><b>{count.toLocaleString("fa-IR")}</b></li>
        ))}
      </ul>
    </section>
  );
}
