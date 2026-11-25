import { ListControls,ListFooter,listParams,type ListQuery } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth";
import { SeoForm } from "@/components/admin/record-forms";
import { prisma } from "@/lib/db";

export default async function SeoPage({searchParams}:{searchParams:Promise<ListQuery>}) {
  await requireStaff("manage_seo");
  const query=listParams(await searchParams);
  const pages = await prisma.pageSeo.findMany({skip:(query.page-1)*20,take:21,where:{OR:[{title:{contains:query.q,mode:"insensitive"}},{path:{contains:query.q,mode:"insensitive"}}],noindex:query.status==="noindex"?true:query.status==="index"?false:undefined}, orderBy: { path: "asc" } });
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">سئو</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">عنوان، توضیح و تصویر هر صفحه. نقشه سایت، robots و داده ساختاریافته خودکار ساخته می‌شوند. سئوی هر نمونه‌کار داخل همان پروژه است.</p>
      </div>
      <ListControls query={query} options={[["index","قابل نمایه‌سازی"],["noindex","عدم نمایه‌سازی"]]}/><div className="grid gap-4">
        {pages.slice(0,20).map((page) => <SeoForm key={page.id} item={page} />)}
      </div><ListFooter query={query} count={pages.length}/>
    </div>
  );
}
