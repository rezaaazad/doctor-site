import { ListControls,ListFooter,listParams,type ListQuery } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth";
import { ConfirmButton } from "@/components/admin/bits";
import { LogoForm, StatForm, StepForm } from "@/components/admin/sales-forms";
import { deleteLogo, deleteStat, deleteStep } from "@/lib/actions-sales";
import { prisma } from "@/lib/db";

export default async function ProcessAdminPage({searchParams}:{searchParams:Promise<ListQuery>}) {
  await requireStaff("manage_content");
  const query=listParams(await searchParams);
  const filter={skip:(query.page-1)*20,take:21};
  const match={contains:query.q,mode:"insensitive" as const};
  const visible=query.status==="yes"?true:query.status==="no"?false:undefined;
  const [steps, stats, logos] = await Promise.all([
    prisma.processStep.findMany({...filter,where:{visible,title:match}, orderBy: { sortOrder: "asc" } }),
    prisma.stat.findMany({...filter,where:{visible,label:match}, orderBy: { sortOrder: "asc" } }),
    prisma.clientLogo.findMany({...filter,where:{visible,name:match}, orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <div className="grid gap-10">
      <ListControls query={query} options={[["yes","نمایان"],["no","پنهان"]]}/><section className="grid gap-4">
        <h1 className="text-3xl font-black">روند کار</h1>
        <StepForm />
        {steps.slice(0,20).map((item) => (
          <div key={item.id} className="grid gap-2">
            <StepForm item={item} />
            <div className="flex justify-end"><ConfirmButton action={deleteStep.bind(null, item.id)} /></div>
          </div>
        ))}
      </section>
      <section className="grid gap-4">
        <h2 className="text-2xl font-black">اعداد و تضمین‌ها</h2>
        <StatForm />
        {stats.slice(0,20).map((item) => (
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
        {logos.slice(0,20).map((item) => (
          <div key={item.id} className="grid gap-2">
            <LogoForm item={item} />
            <div className="flex justify-end"><ConfirmButton action={deleteLogo.bind(null, item.id)} /></div>
          </div>
        ))}
      </section>
      <ListFooter query={query} count={Math.max(steps.length,stats.length,logos.length)}/>
    </div>
  );
}
