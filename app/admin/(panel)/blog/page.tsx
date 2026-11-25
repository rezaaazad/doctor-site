import { ListControls, ListFooter, listParams, type ListQuery } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth";
import Link from "next/link";
import { ConfirmButton } from "@/components/admin/bits";
import { deletePost } from "@/lib/actions-sales";
import { prisma } from "@/lib/db";

export default async function BlogAdminPage({searchParams}:{searchParams:Promise<ListQuery>}) {
  await requireStaff("manage_content");
  const query=listParams(await searchParams);
  const posts = await prisma.blogPost.findMany({skip:(query.page-1)*20,take:21,where:{title:{contains:query.q,mode:"insensitive"},published:query.status==="yes"?true:query.status==="no"?false:undefined}, orderBy: { publishedAt: "desc" } });
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-black">وبلاگ</h1>
        <Link href="/admin/blog/new" className="inline-flex h-11 items-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-black">یادداشت جدید</Link>
      </div>
      <ListControls query={query} options={[["yes","منتشرشده"],["no","پیش‌نویس"]]}/>
      {posts.length === 0 ? <p className="text-sm text-muted">یادداشتی نیست.</p> : null}
      <ul className="grid gap-3">
        {posts.slice(0,20).map((post) => (
          <li key={post.id} className="flex items-center justify-between gap-3 rounded-3xl border border-line px-4 py-3">
            <Link href={`/admin/blog/${post.id}`} className="font-bold">{post.title}</Link>
            <ConfirmButton action={deletePost.bind(null, post.id)} />
          </li>
        ))}
      </ul>
    <ListFooter query={query} count={posts.length}/>
</div>
  );
}
