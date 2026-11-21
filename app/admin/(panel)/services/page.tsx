import { requireStaff } from "@/lib/auth";
import { ConfirmButton, OrderButtons } from "@/components/admin/bits";
import { ServiceForm } from "@/components/admin/record-forms";
import { deleteService } from "@/lib/actions";
import { prisma } from "@/lib/db";
import { asStringArray } from "@/lib/utils";

export default async function ServicesAdminPage() {
  await requireStaff("manage_content");
  const services = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">خدمات</h1>
      <ServiceForm />
      {services.map((service) => (
        <div key={service.id} className="grid gap-2">
          <ServiceForm item={{ ...service, includes: asStringArray(service.includes) }} />
          <div className="flex justify-end gap-2">
            <OrderButtons kind="service" id={service.id} />
            <ConfirmButton action={deleteService.bind(null, service.id)} />
          </div>
        </div>
      ))}
    </div>
  );
}
