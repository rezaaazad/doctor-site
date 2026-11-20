import Link from "next/link";
import { ConfirmButton, OrderButtons } from "@/components/admin/bits";
import { deleteProject } from "@/lib/actions";
import { prisma } from "@/lib/db";

export default async function ProjectsAdminPage() {
  const projects = await prisma.project.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black">نمونه‌کارها</h1>
        <Link href="/admin/projects/new" className="inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-black">پروژه جدید</Link>
      </div>
      {projects.length === 0 ? <p className="text-sm text-white/50">هنوز پروژه‌ای نیست.</p> : null}
      <ul className="grid gap-3">
        {projects.map((project) => (
          <li key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 px-4 py-3">
            <div>
              <Link href={`/admin/projects/${project.id}`} className="font-bold hover:text-[var(--accent)]">{project.title}</Link>
              <p className="text-xs text-white/40">{project.published ? "منتشر" : "پیش‌نویس"} · /portfolio/{project.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <OrderButtons kind="project" id={project.id} />
              <ConfirmButton action={deleteProject.bind(null, project.id)} title="این پروژه حذف شود؟" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
