import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { guardAction, requireStaff } from "@/lib/auth";
import { ticketStatuses } from "../status";

export default async function Ticket({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("manage_tickets");
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!ticket) notFound();
  async function reply(form: FormData) {
    "use server";
    const staff = await guardAction("manage_tickets");
    const body = String(form.get("body") || "").trim();
    if (!body || body.length > 5000) throw new Error("پاسخ باید بین ۱ تا ۵۰۰۰ نویسه باشد.");
    await prisma.ticket.update({
      where: { id, status: { not: "closed" } },
      data: { status: "answered", messages: { create: { fromStaff: true, authorName: staff.name, body } } },
    });
    for (const path of ["/admin/tickets", "/account/tickets"]) {
      revalidatePath(path);
      revalidatePath(path + "/" + id);
    }
  }
  return (
    <section className="staff-inbox">
      <Link href="/admin/tickets">بازگشت به تیکت‌ها</Link>
      <h1>{ticket.subject}</h1>
      <small>
        تیکت {ticket.number.toLocaleString("fa-IR")} · {ticketStatuses[ticket.status]}
      </small>
      <ol className="ticket-thread">
        {ticket.messages.map((m) => (
          <li key={m.id} data-staff={m.fromStaff}>
            <b>
              {m.fromStaff ? "پشتیبانی · " : ""}
              {m.authorName}
            </b>
            <time>{m.createdAt.toLocaleString("fa-IR")}</time>
            <p>{m.body}</p>
          </li>
        ))}
      </ol>
      {ticket.status !== "closed" && (
        <form action={reply}>
          <label>
            پاسخ به مشتری
            <textarea className="input" name="body" rows={4} maxLength={5000} required />
          </label>
          <button className="btn btn-primary">ارسال پاسخ</button>
        </form>
      )}
    </section>
  );
}
