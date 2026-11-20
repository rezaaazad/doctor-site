import { PostForm } from "@/components/admin/sales-forms";

export default function NewPostPage() {
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">یادداشت جدید</h1>
      <PostForm />
    </div>
  );
}
