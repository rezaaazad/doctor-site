import { requireStaff } from "@/lib/auth";
import Link from "next/link";
import { ConfirmButton } from "@/components/admin/bits";
import { deletePost } from "@/lib/actions-sales";
import { prisma } from "@/lib/db";

export default async function BlogAdminPage() {
  await requireStaff("manage_content");
  const posts = await prisma.blogPost.findMany({ orderBy: { publishedAt: "desc" } });
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">وبلاگ</h1>
        <Link href="/admin/blog/new" className="inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-black">یادداشت جدید</Link>
      </div>
      {posts.length === 0 ? <p className="text-sm text-muted">یادداشتی نیست.</p> : null}
      <ul className="grid gap-3">
        {posts.map((post) => (
          <li key={post.id} className="flex items-center justify-between gap-3 rounded-3xl border border-line px-4 py-3">
            <Link href={`/admin/blog/${post.id}`} className="font-bold">{post.title}</Link>
            <ConfirmButton action={deletePost.bind(null, post.id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
