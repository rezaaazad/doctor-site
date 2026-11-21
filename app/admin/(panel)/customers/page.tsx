import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, FilterBar, Pagination, parsePage } from "@/components/admin/kit";
import { formatToman } from "@/lib/money";

export const metadata = { title: "مشتری‌ها" };
export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff("manage_customers");
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const per = 30;
  const where = sp.q ? { OR: [{ mobile: { contains: sp.q } }, { name: { contains: sp.q, mode: "insensitive" as const } }, { email: { contains: sp.q, mode: "insensitive" as const } }] } : {};
  const [total, rows] = await Promise.all([
    prisma.customer.count({ where }),
    prisma.customer.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * per, take: per }),
  ]);
  return (
    <>
      <PageHeader title="مشتری‌ها" />
      <Panel>
        <FilterBar base="/admin/customers" params={sp} placeholder="نام، موبایل، ایمیل…" />
        <Table>
          <thead><tr><Th>مشتری</Th><Th>موبایل</Th><Th>کیف پول</Th><Th>سفارش</Th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <Td><Link href={`/admin/customers/${c.id}`} className="font-semibold text-primary">{c.name || "—"}</Link></Td>
                <Td><span dir="ltr">{c.mobile}</span></Td>
                <Td className="num">{formatToman(c.walletRial)}</Td>
                <Td><Link href={`/admin/customers/${c.id}`} className="text-[0.82rem] text-primary">مشاهده</Link></Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination page={page} pages={Math.max(1, Math.ceil(total / per))} total={total} base="/admin/customers" params={sp} />
      </Panel>
    </>
  );
}