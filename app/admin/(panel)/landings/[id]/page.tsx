import { requireStaff } from "@/lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { saveLanding } from "@/lib/actions-landing";

export const dynamic = "force-dynamic";

export default async function LandingEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("manage_content");
  const { id } = await params;
  const page = await prisma.landingPage.findUnique({ where: { id } });
  if (!page) notFound();
  const faqs = Array.isArray(page.faqs)
    ? page.faqs.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const row = item as { q?: string; a?: string };
        return row.q ? [`${row.q} | ${row.a || ""}`] : [];
      }).join("\n")
    : "";
  return (
    <form action={saveLanding} className="grid max-w-3xl gap-3">
      <h1 className="text-3xl font-black">{page.title}</h1>
      <input type="hidden" name="id" value={page.id} />
      <label className="grid gap-1 text-sm">نامک<input name="slug" defaultValue={page.slug} className="admin-field" dir="ltr" /></label>
      <label className="grid gap-1 text-sm">عنوان<input name="title" defaultValue={page.title} className="admin-field" /></label>
      <label className="grid gap-1 text-sm">عنوان صفحه<input name="h1" defaultValue={page.h1} className="admin-field" /></label>
      <label className="grid gap-1 text-sm">خلاصه<textarea name="excerpt" defaultValue={page.excerpt} className="admin-field min-h-24" /></label>
      <label className="grid gap-1 text-sm">متن<textarea name="body" defaultValue={page.body} className="admin-field min-h-80" /></label>
      <label className="grid gap-1 text-sm">پرسش‌ها، هر خط: پرسش | پاسخ<textarea name="faqs" defaultValue={faqs} className="admin-field min-h-32" /></label>
      <label className="grid gap-1 text-sm">عنوان سئو<input name="seoTitle" defaultValue={page.seoTitle} className="admin-field" /></label>
      <label className="grid gap-1 text-sm">توضیح سئو<textarea name="seoDescription" defaultValue={page.seoDescription} className="admin-field" /></label>
      <label className="grid gap-1 text-sm">کلمات<input name="keywords" defaultValue={page.keywords} className="admin-field" /></label>
      <label className="grid gap-1 text-sm">ترتیب<input name="sortOrder" type="number" defaultValue={page.sortOrder} className="admin-field" dir="ltr" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="published" defaultChecked={page.published} /> منتشر شود</label>
      <button className="h-11 rounded-full bg-[var(--accent)] px-5 font-bold text-black" type="submit">ذخیره صفحه</button>
    </form>
  );
}
