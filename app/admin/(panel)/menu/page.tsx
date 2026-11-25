import { ListControls,ListFooter,listParams,type ListQuery } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth";
import { ConfirmButton, OrderButtons } from "@/components/admin/bits";
import { MenuForm } from "@/components/admin/record-forms";
import { deleteMenu } from "@/lib/actions";
import { prisma } from "@/lib/db";

export default async function MenuPage({searchParams}:{searchParams:Promise<ListQuery>}) {
  await requireStaff("manage_appearance");
  const query=listParams(await searchParams);
  const parents=await prisma.menuItem.findMany({select:{id:true,label:true}});
  const items = await prisma.menuItem.findMany({skip:(query.page-1)*20,take:21,where:{label:{contains:query.q,mode:"insensitive"},visible:query.status==="yes"?true:query.status==="no"?false:undefined}, orderBy: [{ location: "asc" }, { sortOrder: "asc" }] });
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">منو</h1>
      <ListControls query={query} options={[["yes","نمایان"],["no","پنهان"]]}/><MenuForm parents={parents} />
      <div className="grid gap-4">
        {items.slice(0,20).map((item) => (
          <div key={item.id} className="grid gap-3">
            <MenuForm item={item} parents={parents} />
            <div className="flex justify-end gap-2">
              <OrderButtons kind="menu" id={item.id} />
              <ConfirmButton action={deleteMenu.bind(null, item.id)} title="این پیوند حذف شود؟" />
            </div>
          </div>
        ))}
      </div><ListFooter query={query} count={items.length}/>
    </div>
  );
}
