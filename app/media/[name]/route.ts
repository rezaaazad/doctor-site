import { createReadStream } from "fs";
import { stat } from "fs/promises";
import path from "path";
import { Readable } from "stream";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  ico: "image/x-icon",
};

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) return new Response("Not found", { status: 404 });
  const dir = process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
  const file = path.join(dir, name);
  try {
    const info = await stat(file);
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const stream = createReadStream(file);
    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Content-Length": String(info.size),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
