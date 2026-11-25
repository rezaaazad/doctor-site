import { ListControls, ListFooter, listParams, type ListQuery } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth";
import { ConfirmButton } from "@/components/admin/bits";
import { FaqForm } from "@/components/admin/sales-forms";
import { deleteFaq } from "@/lib/actions-sales";
import { prisma } from "@/lib/db";

export default async function FaqAdminPage({searchParams}:{searchParams:Promise<ListQuery>}) {
  await requireStaff("manage_content");
  const query=listParams(await searchParams);
  const items = await prisma.faq.findMany({skip:(query.page-1)*20,take:21,where:{question:{contains:query.q,mode:"insensitive"},visible:query.status==="yes"?true:query.status==="no"?false:undefined}, orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-black">پرسش‌های رایج</h1>
      <ListControls query={query} options={[["yes","نمایان"],["no","پنهان"]]}/>
      <FaqForm />
      {items.slice(0,20).map((item) => (
        <div key={item.id} className="grid gap-2">
          <FaqForm item={item} />
          <div className="flex justify-end"><ConfirmButton action={deleteFaq.bind(null, item.id)} /></div>
        </div>
      ))}
    <ListFooter query={query} count={items.length}/>
</div>
  );
}
