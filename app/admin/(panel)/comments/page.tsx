import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, Tabs } from "@/components/admin/kit";
import { COMMENT_STATUSES } from "@/lib/store/status";
import { moderateCommentFormAction } from "@/lib/actions/admin/commerce";

export const dynamic = "force-dynamic";
export const metadata = { title: "نظرات" };

export default async function CommentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireStaff("moderate_comments");
  const status = (await searchParams).status || "pending";
  const rows = await prisma.comment.findMany({ where: { status }, orderBy: { createdAt: "desc" }, take: 100 });
  const counts = await prisma.comment.groupBy({ by: ["status"], _count: true });
  const tabs = Object.keys(COMMENT_STATUSES).map((key) => ({
    key,
    label: COMMENT_STATUSES[key].label,
    href: `/admin/comments?status=${key}`,
    count: counts.find((c) => c.status === key)?._count ?? 0,
  }));
  return (
    <>
      <PageHeader title="نظرات و دیدگاه محصولات" />
      <Panel>
        <Tabs items={tabs} active={status} />
        <Table>
          <thead><tr><Th>نویسنده</Th><Th>متن</Th><Th>نوع</Th><Th>عمل</Th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <Td>{c.name}</Td>
                <Td className="max-w-md truncate">{c.body}</Td>
                <Td>{c.targetType}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {c.status !== "approved" ? (
                      <form action={moderateCommentFormAction}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="status" value="approved" /><button type="submit" className="btn btn-outline btn-xs">تأیید</button></form>
                    ) : null}
                    {c.status !== "spam" ? (
                      <form action={moderateCommentFormAction}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="status" value="spam" /><button type="submit" className="btn btn-ghost btn-xs">اسپم</button></form>
                    ) : null}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}