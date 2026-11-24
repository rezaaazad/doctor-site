import { requireStaff } from "@/lib/auth";
import { encodeCsv } from "@/lib/admin/csv";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  await requireStaff("manage_leads");
  const q = new URL(request.url).searchParams.get("q")?.trim().slice(0, 200) || "";
  const rows = await prisma.newsletterSubscriber.findMany({
    where: { email: { contains: q, mode: "insensitive" } },
    orderBy: { email: "asc" },
    select: { email: true, source: true, createdAt: true },
  });
  return new Response(
    "\uFEFF" +
      encodeCsv([
        ["email", "source", "createdAt"],
        ...rows.map((r) => [r.email, r.source, r.createdAt.toISOString()]),
      ]),
    {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="newsletter.csv"',
        "Cache-Control": "private, no-store",
      },
    },
  );
}
