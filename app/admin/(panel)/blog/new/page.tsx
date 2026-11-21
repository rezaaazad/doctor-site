import { requireStaff } from "@/lib/auth";
import { EditorialForm } from "@/components/admin/editorial-form";

export default async function NewPostPage() {
  await requireStaff("manage_content");
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">یادداشت جدید</h1>
      <EditorialForm kind="post" />
    </div>
  );
}
