import { ListControls, ListFooter, listParams, type ListQuery } from "@/components/admin/list-controls";
import { requireStaff } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function MessagesPage({searchParams}:{searchParams:Promise<ListQuery>}) {
  await requireStaff("manage_leads");
  const query=listParams(await searchParams);
  const messages = await prisma.contactMessage.findMany({skip:(query.page-1)*20,take:21,where:{subject:{contains:query.q,mode:"insensitive"},read:query.status==="yes"?true:query.status==="no"?false:undefined}, orderBy: { createdAt: "desc" } });
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">صندوق پیام</h1>
      <ListControls query={query} options={[["yes","خوانده‌شده"],["no","خوانده‌نشده"]]}/>
      {messages.length === 0 ? <p className="text-sm text-muted">پیامی نرسیده.</p> : (
        <ul className="divide-y divide-white/10 rounded-3xl border border-line">
          {messages.slice(0,20).map((message) => (
            <li key={message.id}>
              <Link href={`/admin/messages/${message.id}`} className="grid gap-1 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <span>
                  <span className="font-bold">{message.name}</span>
                  <span className="mt-1 block text-sm text-muted">{message.subject || message.email}</span>
                </span>
                <span className="text-xs text-muted">
                  {new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(message.createdAt)}
                  <span className="ms-2">{message.read ? "خوانده" : "جدید"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    <ListFooter query={query} count={messages.length}/>
</div>
  );
}
