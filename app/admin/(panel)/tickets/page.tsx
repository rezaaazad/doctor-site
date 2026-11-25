import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { ticketStatuses } from "./status";

export default async function Tickets({
  searchParams,
}: {
  searchParams: Promise<{ q?:string; status?: string; page?: string }>;
}) {
  await requireStaff("manage_tickets");
  const search = await searchParams;
  const status = search.status && Object.hasOwn(ticketStatuses, search.status) ? search.status : "";
  const q=String(search.q || "").trim().slice(0,160);
  const page = Math.max(1, Math.min(1000000, Math.floor(Number(search.page) || 1)));
  const rows = await prisma.ticket.findMany({
    where: {status:status || undefined,subject:{contains:q,mode:"insensitive"}},
    include: { customer: { select: { name: true, mobile: true } } },
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    take: 31,
    skip: (page - 1) * 30,
  });
  return (
    <section className="staff-inbox">
      <h1>تیکت‌های پشتیبانی</h1>
      <form className="admin-list-controls"><input className="input" name="q" aria-label="جست‌وجوی موضوع تیکت" placeholder="موضوع تیکت" defaultValue={q}/><input type="hidden" name="status" value={status}/><button className="btn btn-outline">جست‌وجو</button></form>
      <nav className="catalog-chips" aria-label="وضعیت تیکت">
        {[["", "همه"], ...Object.entries(ticketStatuses)].map(([key, label]) => (
          <Link key={key} aria-current={status === key ? "page" : undefined} href={"?"+new URLSearchParams({status:key,q})}>
            {label}
          </Link>
        ))}
      </nav>
      <ul>
        {rows.slice(0, 30).map((t) => (
          <li key={t.id}>
            <Link className="ticket-row" href={"/admin/tickets/" + t.id}>
              <div>
                <small>
                  تیکت {t.number.toLocaleString("fa-IR")} · {t.customer.name || t.customer.mobile}
                </small>
                <strong>{t.subject}</strong>
              </div>
              <span>{ticketStatuses[t.status] || t.status}</span>
              <time>{t.updatedAt.toLocaleDateString("fa-IR")}</time>
            </Link>
          </li>
        ))}
      </ul>
      {!rows.length && <p>تیکتی در این فهرست نیست.</p>}
      <nav className="catalog-pages">
        {page > 1 && <Link href={`?${new URLSearchParams({status,q})}&page=${page - 1}`}>قبلی</Link>}
        {rows.length > 30 && <Link href={`?${new URLSearchParams({status,q})}&page=${page + 1}`}>بعدی</Link>}
      </nav>
    </section>
  );
}
