import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td } from "@/components/admin/kit";
import { TICKET_STATUSES } from "@/lib/store/status";

export const metadata = { title: "تیکت‌ها" };
export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
  await requireStaff("manage_tickets");
  const rows = await prisma.ticket.findMany({ include: { customer: { select: { mobile: true, name: true } } }, orderBy: { updatedAt: "desc" }, take: 100 });
  return (
    <>
      <PageHeader title="تیکت‌های پشتیبانی" />
      <Panel>
        <Table>
          <thead><tr><Th>شماره</Th><Th>مشتری</Th><Th>موضوع</Th><Th>وضعیت</Th></tr></thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <Td className="num">#{t.number}</Td>
                <Td>{t.customer.name || t.customer.mobile}</Td>
                <Td><Link href={`/admin/tickets/${t.id}`} className="font-semibold text-primary hover:underline">{t.subject}</Link></Td>
                <Td>{TICKET_STATUSES[t.status]?.label ?? t.status}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}