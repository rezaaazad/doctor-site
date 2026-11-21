import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, FilterBar, Pagination, parsePage } from "@/components/admin/kit";
import { formatToman } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "محصولات" };

type SP = Promise<Record<string, string | undefined>>;

export default async function AdminProductsPage({ searchParams }: { searchParams: SP }) {
  await requireStaff("manage_store");
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const q = sp.q?.trim() || "";
  const per = 25;
  const where = q
    ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { slug: { contains: q, mode: "insensitive" as const } }, { sku: { equals: q } }] }
    : {};
  const [total, rows] = await Promise.all([
    prisma.storeProduct.count({ where }),
    prisma.storeProduct.findMany({
      where,
      include: { category: { select: { name: true } } },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * per,
      take: per,
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / per));
  return (
    <>
      <PageHeader title="محصولات" description="مدیریت کاتالوگ، قیمت، موجودی و انتشار." actions={<Link href="/admin/products/new" className="btn btn-action btn-sm">محصول جدید</Link>} />
      <Panel>
        <FilterBar base="/admin/products" params={sp} />
        <Table>
          <thead>
            <tr>
              <Th>عنوان</Th>
              <Th>دسته</Th>
              <Th>قیمت</Th>
              <Th>وضعیت</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <Td><Link href={`/admin/products/${p.id}`} className="font-semibold text-primary hover:underline">{p.title}</Link></Td>
                <Td>{p.category.name}</Td>
                <Td className="num">{formatToman(p.priceRial)}</Td>
                <Td>{p.published ? <span className="badge badge-success">منتشر</span> : <span className="badge">پیش‌نویس</span>}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination page={page} pages={pages} total={total} base="/admin/products" params={sp} />
      </Panel>
    </>
  );
}