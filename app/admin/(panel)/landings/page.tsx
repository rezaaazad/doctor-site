import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function LandingsAdminPage() {
  const pages = await prisma.landingPage.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-4">
      <h1 className="text-3xl font-black">صفحه‌های کلیدی</h1>
      <p className="text-sm text-white/60">متن، پرسش و متای هر صفحه را از اینجا عوض کنید. آدرس صفحه همان نامک است.</p>
      {pages.map((page) => (
        <Link key={page.id} href={`/admin/landings/${page.id}`} className="rounded-3xl border border-white/10 p-4">
          <b>{page.title}</b>
          <p className="text-sm text-white/50" dir="ltr">/{page.slug}</p>
        </Link>
      ))}
    </div>
  );
}
