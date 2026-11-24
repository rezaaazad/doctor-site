import { requireStaff } from "@/lib/auth";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/admin/bits";
import { deleteMessage, setMessageRead } from "@/lib/actions";
import { prisma } from "@/lib/db";

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff("manage_leads");
  const { id } = await params;
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) notFound();
  if (!message.read) await prisma.contactMessage.update({ where: { id }, data: { read: true } });
  return (
    <article className="grid max-w-3xl gap-5">
      <h1 className="text-3xl font-black">{message.subject || "پیام"}</h1>
      <dl className="grid gap-2 text-sm text-muted">
        <div>از: {message.name}</div>
        <div dir="ltr">{message.email}</div>
        {message.phone ? <div dir="ltr">{message.phone}</div> : null}
        {message.projectType ? <div>نوع پروژه: {message.projectType}</div> : null}
        {message.budget ? <div>بودجه: {message.budget}</div> : null}
        <div>{new Intl.DateTimeFormat("fa-IR", { dateStyle: "full", timeStyle: "short" }).format(message.createdAt)}</div>
      </dl>
      <p className="whitespace-pre-wrap rounded-3xl border border-line p-5 leading-8">{message.message}</p>
      <div className="flex flex-wrap gap-3">
        <form action={setMessageRead}>
          <input type="hidden" name="id" value={message.id} />
          <input type="hidden" name="read" value="0" />
          <button type="submit" className="rounded-full border border-line px-4 py-2 text-sm">علامت به‌عنوان نخوانده</button>
        </form>
        <ConfirmButton action={deleteMessage.bind(null, message.id)} title="این پیام حذف شود؟" />
      </div>
    </article>
  );
}
