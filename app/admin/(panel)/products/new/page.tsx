import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, FormGrid } from "@/components/admin/kit";
import { saveProductFormAction } from "@/lib/actions/admin/commerce";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireStaff("manage_store");
  const categories = await prisma.storeCategory.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader title="محصول جدید" back={{ href: "/admin/products", label: "محصولات" }} />
      <Panel>
        <form action={saveProductFormAction} className="grid gap-4">
          <FormGrid>
            <label className="grid gap-1 text-[0.85rem] font-semibold md:col-span-2">عنوان<input name="title" required className="input" /></label>
            <label className="grid gap-1 text-[0.85rem] font-semibold">نامک<input name="slug" required className="input" dir="ltr" /></label>
            <label className="grid gap-1 text-[0.85rem] font-semibold">دسته
              <select name="categoryId" className="input" required>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-[0.85rem] font-semibold">قیمت (تومان)<input name="price" required className="input" dir="ltr" /></label>
            <label className="grid gap-1 text-[0.85rem] font-semibold md:col-span-2">خلاصه<textarea name="summary" rows={2} className="input" /></label>
          </FormGrid>
          <label className="flex items-center gap-2 text-[0.85rem]"><input type="checkbox" name="published" value="1" /> منتشر از همین الان</label>
          <button type="submit" className="btn btn-action">ایجاد</button>
        </form>
      </Panel>
    </>
  );
}