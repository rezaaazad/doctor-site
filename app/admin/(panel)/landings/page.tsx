import { ListControls, ListFooter, listParams, type ListQuery } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LandingsAdminPage({searchParams}:{searchParams:Promise<ListQuery>}) {
  await requireStaff("manage_content");
  const query=listParams(await searchParams);
  const pages = await prisma.landingPage.findMany({skip:(query.page-1)*20,take:21,where:{title:{contains:query.q,mode:"insensitive"},published:query.status==="yes"?true:query.status==="no"?false:undefined}, orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-black">صفحه‌های کلیدی</h1>
      <ListControls query={query} options={[["yes","منتشرشده"],["no","پیش‌نویس"]]}/>
      <Link href="/admin/landings/new" className="text-primary font-bold">افزودن صفحه</Link>
      <p className="text-sm text-muted">متن، پرسش و متای هر صفحه را از اینجا عوض کنید. آدرس صفحه همان نامک است.</p>
      {pages.slice(0,20).map((page) => (
        <Link key={page.id} href={`/admin/landings/${page.id}`} className="rounded-3xl border border-line p-4">
          <b>{page.title}</b>
          <p className="text-sm text-muted" dir="ltr">/{page.slug}</p>
        </Link>
      ))}
    <ListFooter query={query} count={pages.length}/>
</div>
  );
}
