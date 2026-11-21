import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel } from "@/components/admin/kit";
import { staffTicketReplyFormAction, updateTicketStatusFormAction } from "@/lib/actions/admin/commerce";
import { TICKET_STATUSES } from "@/lib/store/status";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function AdminTicketPage({ params }: Props) {
  await requireStaff("manage_tickets");
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { customer: { select: { name: true, mobile: true } }, messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) notFound();
  return (
    <>
      <PageHeader title={`تیکت #${ticket.number}`} back={{ href: "/admin/tickets", label: "تیکت‌ها" }} />
      <Panel title={ticket.subject} className="mb-6">
        <p className="text-[0.86rem] text-muted">
          {ticket.customer.name || ticket.customer.mobile} — {TICKET_STATUSES[ticket.status]?.label ?? ticket.status}
        </p>
        <form action={updateTicketStatusFormAction} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={ticket.id} />
          <select name="status" defaultValue={ticket.status} className="input w-auto min-w-[10rem]">
            {Object.entries(TICKET_STATUSES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-outline btn-sm">به‌روزرسانی وضعیت</button>
        </form>
      </Panel>
      <Panel title="گفتگو">
        <ul className="mb-6 space-y-4">
          {ticket.messages.map((m) => (
            <li key={m.id} className={`rounded-lg border border-line p-3 text-[0.86rem] ${m.fromStaff ? "bg-primary/5" : ""}`}>
              <div className="mb-1 flex justify-between text-[0.78rem] text-muted">
                <span>{m.fromStaff ? `پشتیبانی (${m.authorName})` : m.authorName}</span>
                <span>{new Date(m.createdAt).toLocaleString("fa-IR")}</span>
              </div>
              <p className="whitespace-pre-wrap leading-7">{m.body}</p>
            </li>
          ))}
        </ul>
        <form action={staffTicketReplyFormAction} className="grid gap-2">
          <input type="hidden" name="id" value={ticket.id} />
          <textarea name="body" required rows={4} className="input" placeholder="پاسخ پشتیبانی…" />
          <button type="submit" className="btn btn-primary btn-sm w-fit">ارسال پاسخ</button>
        </form>
      </Panel>
    </>
  );
}