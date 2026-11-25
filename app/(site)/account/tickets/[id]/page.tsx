
import { notFound } from "next/navigation";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { TICKET_STATUSES } from "@/lib/store/status";
import { replyTicketFormAction } from "@/lib/actions/account";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function TicketPage({ params }: Props) {
  const customer = await requireCustomer();
  const { id } = await params;
  const ticket = await prisma.ticket.findFirst({
    where: { id, customerId: customer.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) notFound();
  return (
    <section className="card p-5">
      <h1 className="font-display text-[1.35rem] font-extrabold">
        #{ticket.number.toLocaleString("fa-IR")} {ticket.subject}
      </h1>
      <p className="mt-1 text-[0.85rem] text-muted">{TICKET_STATUSES[ticket.status]?.label ?? ticket.status}</p>
      <ul className="mt-6 space-y-3">
        {ticket.messages.map((m) => (
          <li key={m.id} className={m.fromStaff ? "rounded-xl bg-primary-soft p-3 text-[0.88rem]" : "rounded-xl border border-line p-3 text-[0.88rem]"}>
            <b className="text-[0.78rem] text-muted">{m.fromStaff ? "پشتیبانی" : m.authorName}</b>
            <time className="ms-3 text-xs text-muted">{m.createdAt.toLocaleString("fa-IR")}</time><p className="mt-1 whitespace-pre-wrap">{m.body}</p>
          </li>
        ))}
      </ul>
      {ticket.status !== "closed" ? (
        <form action={replyTicketFormAction.bind(null, ticket.id)} className="mt-4 grid gap-2">
          <textarea name="body" aria-label="پاسخ شما" minLength={2} maxLength={4000} rows={3} required className="field" placeholder="پاسخ شما…" />
          <button type="submit" className="btn btn-primary btn-sm w-fit">ارسال پاسخ</button>
        </form>
      ) : null}
    </section>
  );
}