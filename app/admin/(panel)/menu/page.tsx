import { requireStaff } from "@/lib/auth";
import { ConfirmButton, OrderButtons } from "@/components/admin/bits";
import { MenuForm } from "@/components/admin/record-forms";
import { deleteMenu } from "@/lib/actions";
import { prisma } from "@/lib/db";

export default async function MenuPage() {
  await requireStaff("manage_appearance");
  const items = await prisma.menuItem.findMany({ orderBy: [{ location: "asc" }, { sortOrder: "asc" }] });
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">منو</h1>
      <MenuForm />
      <div className="grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="grid gap-3">
            <MenuForm item={item} />
            <div className="flex justify-end gap-2">
              <OrderButtons kind="menu" id={item.id} />
              <ConfirmButton action={deleteMenu.bind(null, item.id)} title="این پیوند حذف شود؟" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
