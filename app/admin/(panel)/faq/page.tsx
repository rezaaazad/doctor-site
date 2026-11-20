import { ConfirmButton } from "@/components/admin/bits";
import { FaqForm } from "@/components/admin/sales-forms";
import { deleteFaq } from "@/lib/actions-sales";
import { prisma } from "@/lib/db";

export default async function FaqAdminPage() {
  const items = await prisma.faq.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-black">پرسش‌های رایج</h1>
      <FaqForm />
      {items.map((item) => (
        <div key={item.id} className="grid gap-2">
          <FaqForm item={item} />
          <div className="flex justify-end"><ConfirmButton action={deleteFaq.bind(null, item.id)} /></div>
        </div>
      ))}
    </div>
  );
}
