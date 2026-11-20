import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user: Awaited<ReturnType<typeof getSessionUser>> = null;
  try {
    user = await getSessionUser();
  } catch {
    return <p className="p-8 text-white">پایگاه داده در دسترس نیست.</p>;
  }
  if (!user) redirect("/admin/login");
  const unread = await prisma.contactMessage.count({ where: { read: false } }).catch(() => 0);
  return <AdminShell user={{ name: user.name, email: user.email }} unread={unread}>{children}</AdminShell>;
}
