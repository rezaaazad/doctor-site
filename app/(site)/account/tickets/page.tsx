import type { Metadata } from "next";
import Link from "next/link";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { TICKET_STATUSES } from "@/lib/store/status";
import { NewTicketForm } from "@/components/account/forms";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/account/tickets", title: "تیکت‌ها" });
}

export default async function TicketsPage() {
  const customer = await requireCustomer("/account/tickets");
  const tickets = await prisma.ticket.findMany({ where: { customerId: customer.id }, orderBy: { updatedAt: "desc" } });
  return (
    <div className="grid gap-6">

      <section className="card p-5">
        <h1 className="mb-4 font-display text-[1.35rem] font-extrabold">تیکت‌های من</h1>
        {tickets.length === 0 ? (
          <p className="text-muted">تیکتی ندارید.</p>
        ) : (
          <ul className="divide-y divide-line">
            {tickets.map((t) => (
              <li key={t.id} className="py-3">
                <Link href={`/account/tickets/${t.id}`} className="font-bold hover:text-primary">
                  #{t.number.toLocaleString("fa-IR")} — {t.subject}
                </Link>
                <p className="mt-1 text-[0.82rem] text-muted">{TICKET_STATUSES[t.status]?.label ?? t.status}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div id="new-ticket"><NewTicketForm /></div>
    </div>
  );
}