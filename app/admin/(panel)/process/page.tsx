import { requireStaff } from "@/lib/auth";
import { ConfirmButton } from "@/components/admin/bits";
import { LogoForm, StatForm, StepForm } from "@/components/admin/sales-forms";
import { deleteLogo, deleteStat, deleteStep } from "@/lib/actions-sales";
import { prisma } from "@/lib/db";

export default async function ProcessAdminPage() {
  await requireStaff("manage_content");
  const [steps, stats, logos] = await Promise.all([
    prisma.processStep.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.stat.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.clientLogo.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <div className="grid gap-10">
      <section className="grid gap-4">
        <h1 className="text-3xl font-black">روند کار</h1>
        <StepForm />
        {steps.map((item) => (
          <div key={item.id} className="grid gap-2">
            <StepForm item={item} />
            <div className="flex justify-end"><ConfirmButton action={deleteStep.bind(null, item.id)} /></div>
          </div>
        ))}
      </section>
      <section className="grid gap-4">
        <h2 className="text-2xl font-black">اعداد و تضمین‌ها</h2>
        <StatForm />
        {stats.map((item) => (
          <div key={item.id} className="grid gap-2">
            <StatForm item={item} />
            <div className="flex justify-end"><ConfirmButton action={deleteStat.bind(null, item.id)} /></div>
          </div>
        ))}
      </section>
      <section className="grid gap-4">
        <h2 className="text-2xl font-black">لوگوی مشتری‌ها</h2>
        <p className="text-sm text-muted">اگر تصویر نگذارید، نام به‌صورت نشان متنی دیده می‌شود. نام‌ها نمونه هستند؛ قبل از انتشار عوضشان کنید.</p>
        <LogoForm />
        {logos.map((item) => (
          <div key={item.id} className="grid gap-2">
            <LogoForm item={item} />
            <div className="flex justify-end"><ConfirmButton action={deleteLogo.bind(null, item.id)} /></div>
          </div>
        ))}
      </section>
    </div>
  );
}
