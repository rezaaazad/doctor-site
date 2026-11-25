import { ListControls, ListFooter, listParams, type ListQuery } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth";
import { ConfirmButton } from "@/components/admin/bits";
import { PackageForm } from "@/components/admin/sales-forms";
import { deletePackage } from "@/lib/actions-sales";
import { prisma } from "@/lib/db";
import { asStringArray } from "@/lib/utils";

export default async function PricingAdminPage({searchParams}:{searchParams:Promise<ListQuery>}) {
  await requireStaff("manage_content");
  const query=listParams(await searchParams);
  const items = await prisma.package.findMany({skip:(query.page-1)*20,take:21,where:{name:{contains:query.q,mode:"insensitive"},visible:query.status==="yes"?true:query.status==="no"?false:undefined}, orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">تعرفه</h1>
      <ListControls query={query} options={[["yes","نمایان"],["no","پنهان"]]}/>
      <p className="text-sm text-muted">شروع قیمت و موارد هر پکیج. روی سایت، کنار خدمات دیده می‌شود.</p>
      <PackageForm />
      {items.slice(0,20).map((item) => (
        <div key={item.id} className="grid gap-2">
          <PackageForm item={{ ...item, features: asStringArray(item.features) }} />
          <div className="flex justify-end"><ConfirmButton action={deletePackage.bind(null, item.id)} /></div>
        </div>
      ))}
    <ListFooter query={query} count={items.length}/>
</div>
  );
}
