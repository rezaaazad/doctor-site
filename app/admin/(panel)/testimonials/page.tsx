import { requireStaff } from "@/lib/auth";
import { ConfirmButton, OrderButtons } from "@/components/admin/bits";
import { TestimonialForm } from "@/components/admin/record-forms";
import { deleteTestimonial } from "@/lib/actions";
import { prisma } from "@/lib/db";

export default async function TestimonialsPage() {
  await requireStaff("manage_content");
  const items = await prisma.testimonial.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">نظرات</h1>
        <p className="mt-2 text-sm text-muted">نقل‌قول‌های اولیه نمونه هستند. قبل از انتشار عمومی با نقل‌قول واقعی عوضشان کنید یا پنهانشان کنید.</p>
      </div>
      <TestimonialForm />
      {items.map((item) => (
        <div key={item.id} className="grid gap-2">
          <TestimonialForm item={item} />
          <div className="flex justify-end gap-2">
            <OrderButtons kind="testimonial" id={item.id} />
            <ConfirmButton action={deleteTestimonial.bind(null, item.id)} />
          </div>
        </div>
      ))}
    </div>
  );
}
