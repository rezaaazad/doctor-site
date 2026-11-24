import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Newsletter({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireStaff("manage_leads");
  const search = await searchParams;
  const q = String(search.q || "")
    .trim()
    .slice(0, 200);
  const page = Math.max(1, Math.min(1000000, Math.floor(Number(search.page) || 1)));
  const rows = await prisma.newsletterSubscriber.findMany({
    where: { email: { contains: q, mode: "insensitive" } },
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: 51,
    skip: (page - 1) * 50,
  });
  const query = new URLSearchParams({ q });
  return (
    <section className="staff-inbox">
      <h1>اعضای خبرنامه</h1>
      <form className="catalog-controls">
        <input
          name="q"
          className="input"
          aria-label="جست‌وجوی ایمیل"
          placeholder="جست‌وجوی ایمیل"
          defaultValue={q}
        />
        <button className="btn btn-primary">جست‌وجو</button>
        <a className="btn btn-outline" href={"/admin/newsletter/export?" + query}>
          خروجی CSV
        </a>
      </form>
      {rows.length ? (
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>ایمیل</th>
                <th>منبع عضویت</th>
                <th>تاریخ عضویت</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((r) => (
                <tr key={r.id}>
                  <td dir="ltr">{r.email}</td>
                  <td>{r.source || "—"}</td>
                  <td>{r.createdAt.toLocaleDateString("fa-IR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>عضوی با این مشخصات پیدا نشد.</p>
      )}
      <nav className="catalog-pages">
        {page > 1 && <Link href={`?${query}&page=${page - 1}`}>قبلی</Link>}
        {rows.length > 50 && <Link href={`?${query}&page=${page + 1}`}>بعدی</Link>}
      </nav>
    </section>
  );
}
