import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { prisma } from "@/lib/db";
import { mediaUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user || !can(user.role, "manage_media")) return NextResponse.json({ items: [] }, { status: 403 });
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  const files = url.searchParams.get("files") === "1";
  const rows = await prisma.media.findMany({
    where: {
      isPrivate: files ? true : false,
      ...(files ? {} : { mime: { startsWith: "image/" } }),
      ...(q ? { OR: [{ filename: { contains: q, mode: "insensitive" } }, { alt: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  return NextResponse.json({
    items: rows.map((m) => ({ id: m.id, url: m.isPrivate ? `media:${m.id}` : mediaUrl(m), filename: m.filename, alt: m.alt, width: m.width, height: m.height, mime: m.mime, size: m.size })),
  });
}
