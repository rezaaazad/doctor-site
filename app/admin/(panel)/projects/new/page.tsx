import { requireStaff } from "@/lib/auth";
import { ProjectForm } from "@/components/admin/record-forms";

export default async function NewProjectPage() {
  await requireStaff("manage_content");
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">پروژه جدید</h1>
      <ProjectForm />
    </div>
  );
}
