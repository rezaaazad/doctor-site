import { requireStaff } from "@/lib/auth";
import { ConfirmButton } from "@/components/admin/bits";
import { PackageForm } from "@/components/admin/sales-forms";
import { deletePackage } from "@/lib/actions-sales";
import { prisma } from "@/lib/db";
import { asStringArray } from "@/lib/utils";

export default async function PricingAdminPage() {
  await requireStaff("manage_content");
  const items = await prisma.package.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">تعرفه</h1>
      <p className="text-sm text-white/50">شروع قیمت و موارد هر پکیج. روی سایت، کنار خدمات دیده می‌شود.</p>
      <PackageForm />
      {items.map((item) => (
        <div key={item.id} className="grid gap-2">
          <PackageForm item={{ ...item, features: asStringArray(item.features) }} />
          <div className="flex justify-end"><ConfirmButton action={deletePackage.bind(null, item.id)} /></div>
        </div>
      ))}
    </div>
  );
}
