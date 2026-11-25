import { createReadStream, existsSync } from "fs";
import {privateDir,uploadDir} from "@/lib/media";
import path from "path";
import { Readable } from "stream";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const grant = await prisma.downloadGrant.findUnique({
    where: { token: String(token).slice(0, 80) },
    include: { orderItem: { include: { product: true } } },
  });
  if (!grant || grant.remaining <= 0 || (grant.expiresAt && grant.expiresAt.getTime() < Date.now())) {
    return Response.json({ message: "لینک دانلود نامعتبر یا منقضی شده است." }, { status: 410 });
  }
  const mediaId = grant.orderItem.product?.downloadMedia;
  const direct = grant.orderItem.product?.downloadUrl;
  if (!mediaId && !direct) return Response.json({ message: "فایل موجود نیست." }, { status: 404 });

  await prisma.downloadGrant.update({
    where: { id: grant.id },
    data: { remaining: { decrement: 1 }, lastUsedAt: new Date() },
  });

  if (direct && direct.startsWith("http")) {
    return Response.redirect(direct);
  }

  const media = mediaId ? await prisma.media.findUnique({ where: { id: mediaId } }) : null;
  if (!media) return Response.json({ message: "فایل پیدا نشد." }, { status: 404 });
  const root = media.isPrivate ? privateDir() : uploadDir();
  const filePath = path.join(root, media.storedName);
  if (!existsSync(filePath)) return Response.json({ message: "فایل روی سرور نیست." }, { status: 404 });
  const stream = createReadStream(filePath);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": media.mime,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(media.filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}