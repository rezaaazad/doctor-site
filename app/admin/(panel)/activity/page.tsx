import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td, Pagination, parsePage } from "@/components/admin/kit";

export const metadata = { title: "گزارش فعالیت" };
export const dynamic = "force-dynamic";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireStaff("view_activity");
  const sp = await searchParams;
  const page = parsePage(sp.page);
  const per = 40;
  const [total, rows] = await Promise.all([
    prisma.activityLog.count(),
    prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * per, take: per }),
  ]);
  return (
    <>
      <PageHeader title="گزارش فعالیت" />
      <Panel>
        <Table>
          <thead><tr><Th>زمان</Th><Th>کاربر</Th><Th>عمل</Th><Th>خلاصه</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td className="text-[0.78rem] whitespace-nowrap">{new Date(r.createdAt).toLocaleString("fa-IR")}</Td>
                <Td>{r.userName}</Td>
                <Td>{r.action}</Td>
                <Td className="max-w-xs truncate">{r.summary || r.entity}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Pagination page={page} pages={Math.max(1, Math.ceil(total / per))} total={total} base="/admin/activity" params={sp} />
      </Panel>
    </>
  );
}