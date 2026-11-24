import { requireStaff } from "@/lib/auth";
import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LandingsAdminPage() {
  await requireStaff("manage_content");
  const pages = await prisma.landingPage.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-black">صفحه‌های کلیدی</h1>
      <Link href="/admin/landings/new" className="text-primary font-bold">افزودن صفحه</Link>
      <p className="text-sm text-muted">متن، پرسش و متای هر صفحه را از اینجا عوض کنید. آدرس صفحه همان نامک است.</p>
      {pages.map((page) => (
        <Link key={page.id} href={`/admin/landings/${page.id}`} className="rounded-3xl border border-line p-4">
          <b>{page.title}</b>
          <p className="text-sm text-muted" dir="ltr">/{page.slug}</p>
        </Link>
      ))}
    </div>
  );
}
