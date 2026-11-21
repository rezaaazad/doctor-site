import { requireStaff } from "@/lib/auth";
import { PostForm } from "@/components/admin/sales-forms";

export default async function NewPostPage() {
  await requireStaff("manage_content");
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">یادداشت جدید</h1>
      <PostForm />
    </div>
  );
}
