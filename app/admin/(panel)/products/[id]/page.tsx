import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, FormGrid } from "@/components/admin/kit";
import { saveProductFormAction, deleteProductFormAction } from "@/lib/actions/admin/commerce";
import { rialToToman } from "@/lib/money";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminProductEditPage({ params }: Props) {
  await requireStaff("manage_store");
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.storeProduct.findUnique({ where: { id }, include: { variants: true } }),
    prisma.storeCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();
  return (
    <>
      <PageHeader title={product.title} back={{ href: "/admin/products", label: "محصولات" }} />
      <Panel title="ویرایش محصول">
        <form action={saveProductFormAction} className="grid gap-4">
          <input type="hidden" name="id" value={product.id} />
          <FormGrid>
            <label className="grid gap-1 text-[0.85rem] font-semibold md:col-span-2">عنوان<input name="title" defaultValue={product.title} required className="input" /></label>
            <label className="grid gap-1 text-[0.85rem] font-semibold">نامک<input name="slug" defaultValue={product.slug} required className="input" dir="ltr" /></label>
            <label className="grid gap-1 text-[0.85rem] font-semibold">دسته
              <select name="categoryId" defaultValue={product.categoryId} className="input">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-[0.85rem] font-semibold">قیمت (تومان)<input name="price" defaultValue={rialToToman(product.priceRial)} className="input" dir="ltr" /></label>
            <label className="grid gap-1 text-[0.85rem] font-semibold">قیمت قبل<input name="compareAt" defaultValue={product.compareAtRial ? rialToToman(product.compareAtRial) : ""} className="input" dir="ltr" /></label>
            <label className="grid gap-1 text-[0.85rem] font-semibold">نوع
              <select name="type" defaultValue={product.type} className="input"><option value="digital">دیجیتال</option><option value="physical">فیزیکی</option></select>
            </label>
            <label className="grid gap-1 text-[0.85rem] font-semibold md:col-span-2">خلاصه<textarea name="summary" defaultValue={product.summary} rows={2} className="input" /></label>
            <label className="grid gap-1 text-[0.85rem] font-semibold md:col-span-2">توضیحات<textarea name="description" defaultValue={product.description} rows={6} className="input" /></label>
          </FormGrid>
          <div className="flex flex-wrap gap-4 text-[0.85rem]">
            <label className="flex items-center gap-2"><input type="checkbox" name="published" value="1" defaultChecked={product.published} /> منتشر</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="featured" value="1" defaultChecked={product.featured} /> ویژه</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="manageStock" value="1" defaultChecked={product.manageStock} /> موجودی</label>
            <label className="flex items-center gap-2"><input type="checkbox" name="installments" value="1" defaultChecked={product.installments} /> اقساط</label>
          </div>
          <label className="grid gap-1 text-[0.85rem] font-semibold w-40">موجودی<input name="stock" type="number" defaultValue={product.stock} className="input" dir="ltr" /></label>
          <button type="submit" className="btn btn-primary w-fit">ذخیره</button>
        </form>
        <form action={deleteProductFormAction} className="mt-6 border-t border-line pt-4">
          <input type="hidden" name="id" value={product.id} />
          <button type="submit" className="btn btn-ghost text-urgency">حذف محصول</button>
        </form>
      </Panel>
      {product.variants.length ? (
        <Panel title="تنوع‌ها" className="mt-6">
          <ul className="text-[0.86rem]">{product.variants.map((v) => <li key={v.id}>{v.title} — {rialToToman(v.priceRial)} تومان</li>)}</ul>
        </Panel>
      ) : null}
    </>
  );
}