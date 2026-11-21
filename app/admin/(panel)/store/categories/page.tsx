import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td } from "@/components/admin/kit";
import { saveCategoryFormAction } from "@/lib/actions/admin/commerce";

export const metadata = { title: "دسته‌بندی‌ها" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await requireStaff("manage_store");
  const rows = await prisma.storeCategory.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <>
      <PageHeader title="دسته‌بندی محصولات" />
      <Panel title="دسته جدید" className="mb-6">
        <form action={saveCategoryFormAction} className="grid gap-3 md:grid-cols-3">
          <input name="name" required className="input" placeholder="نام" />
          <input name="slug" required className="input" dir="ltr" placeholder="slug" />
          <input name="icon" className="input" placeholder="آیکون" />
          <textarea name="description" className="input md:col-span-3" rows={2} placeholder="توضیح" />
          <label className="flex items-center gap-2 text-[0.85rem]"><input type="checkbox" name="visible" value="1" defaultChecked /> نمایان</label>
          <button type="submit" className="btn btn-primary btn-sm">ذخیره</button>
        </form>
      </Panel>
      <Panel>
        <Table>
          <thead><tr><Th>نام</Th><Th>نامک</Th><Th>محصول</Th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><Td>{r.icon} {r.name}</Td><Td><span dir="ltr">{r.slug}</span></Td><Td className="num">{r._count.products}</Td></tr>)}</tbody>
        </Table>
      </Panel>
    </>
  );
}