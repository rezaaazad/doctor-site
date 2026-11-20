import { SeoForm } from "@/components/admin/record-forms";
import { prisma } from "@/lib/db";

export default async function SeoPage() {
  const pages = await prisma.pageSeo.findMany({ orderBy: { path: "asc" } });
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">سئو</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-white/55">عنوان، توضیح و تصویر هر صفحه. نقشه سایت، robots و داده ساختاریافته خودکار ساخته می‌شوند. سئوی هر نمونه‌کار داخل همان پروژه است.</p>
      </div>
      <div className="grid gap-4">
        {pages.map((page) => <SeoForm key={page.id} item={page} />)}
      </div>
    </div>
  );
}
