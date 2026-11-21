import { requireStaff } from "@/lib/auth";
import { notFound } from "next/navigation";
import { PostForm } from "@/components/admin/sales-forms";
import { prisma } from "@/lib/db";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("manage_content");
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">ویرایش یادداشت</h1>
      <PostForm item={post} />
    </div>
  );
}
