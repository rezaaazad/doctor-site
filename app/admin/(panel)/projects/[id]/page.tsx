import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/record-forms";
import { projectFields } from "@/lib/admin-data";
import { prisma } from "@/lib/db";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) notFound();
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">ویرایش {project.title}</h1>
      <ProjectForm project={projectFields(project)} />
    </div>
  );
}
