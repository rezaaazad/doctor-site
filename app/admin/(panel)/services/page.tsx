import { ListControls, ListFooter, listParams, type ListQuery } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth";
import { ConfirmButton, OrderButtons } from "@/components/admin/bits";
import { ServiceForm } from "@/components/admin/record-forms";
import { deleteService } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { asStringArray } from "@/lib/utils";

export default async function ServicesAdminPage({searchParams}:{searchParams:Promise<ListQuery>}) {
  await requireStaff("manage_content");
  const query=listParams(await searchParams);
  const services = await prisma.service.findMany({skip:(query.page-1)*20,take:21,where:{title:{contains:query.q,mode:"insensitive"},visible:query.status==="yes"?true:query.status==="no"?false:undefined}, orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">خدمات</h1>
      <ListControls query={query} options={[["yes","نمایان"],["no","پنهان"]]}/>
      <ServiceForm />
      {services.slice(0,20).map((service) => (
        <div key={service.id} className="grid gap-2">
          <ServiceForm item={{ ...service, includes: asStringArray(service.includes) }} />
          <div className="flex justify-end gap-2">
            <OrderButtons kind="service" id={service.id} />
            <ConfirmButton action={deleteService.bind(null, service.id)} />
          </div>
        </div>
      ))}
    <ListFooter query={query} count={services.length}/>
</div>
  );
}
