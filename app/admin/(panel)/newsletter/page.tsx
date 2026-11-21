import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td } from "@/components/admin/kit";

export const metadata = { title: "خبرنامه" };
export const dynamic = "force-dynamic";

export default async function NewsletterPage() {
  await requireStaff("manage_leads");
  const rows = await prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  const csv = "email,created_at\n" + rows.map((r) => `${r.email},${r.createdAt.toISOString()}`).join("\n");
  return (
    <>
      <PageHeader title="مشترکین خبرنامه" />
      <Panel>
        <textarea readOnly className="input mb-4 font-mono text-[0.75rem]" rows={4} dir="ltr" value={csv} />
        <Table>
          <thead><tr><Th>ایمیل</Th><Th>تاریخ</Th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><Td><span dir="ltr">{r.email}</span></Td><Td>{new Date(r.createdAt).toLocaleDateString("fa-IR")}</Td></tr>)}</tbody>
        </Table>
      </Panel>
    </>
  );
}