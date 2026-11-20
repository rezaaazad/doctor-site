import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function MessagesPage() {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="grid gap-6">
      <h1 className="text-3xl font-black">صندوق پیام</h1>
      {messages.length === 0 ? <p className="text-sm text-white/50">پیامی نرسیده.</p> : (
        <ul className="divide-y divide-white/10 rounded-3xl border border-white/10">
          {messages.map((message) => (
            <li key={message.id}>
              <Link href={`/admin/messages/${message.id}`} className="grid gap-1 px-4 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <span>
                  <span className="font-bold">{message.name}</span>
                  <span className="mt-1 block text-sm text-white/50">{message.subject || message.email}</span>
                </span>
                <span className="text-xs text-white/40">
                  {new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(message.createdAt)}
                  <span className="ms-2">{message.read ? "خوانده" : "جدید"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
