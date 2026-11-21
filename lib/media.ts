import { randomBytes } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";

export function uploadDir() {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "data", "uploads");
}

/** Private files (digital product downloads) live outside the public /media route. */
export function privateDir() {
  return path.join(uploadDir(), "private");
}

export const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "image/svg+xml": "svg",
};

export const FILE_TYPES: Record<string, string> = {
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/pdf": "pdf",
  "application/epub+zip": "epub",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/x-rar-compressed": "rar",
  "application/vnd.rar": "rar",
  "video/mp4": "mp4",
  "audio/mpeg": "mp3",
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_FILE_BYTES = 200 * 1024 * 1024;

export function looksLikeImage(buf: Buffer, mime: string) {
  if (buf.length < 12) return false;
  if (mime === "image/jpeg") return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (mime === "image/png") return buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mime === "image/gif") return buf.subarray(0, 4).toString("ascii") === "GIF8";
  if (mime === "image/webp") return buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP";
  if (mime === "image/avif") return buf.subarray(4, 8).toString("ascii") === "ftyp";
  if (mime === "image/x-icon" || mime === "image/vnd.microsoft.icon") return buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01 && buf[3] === 0x00;
  if (mime === "image/svg+xml") {
    const head = buf.subarray(0, 2048).toString("utf8").toLowerCase();
    return head.includes("<svg") && !/<script|on\w+\s*=|javascript:|<foreignobject/.test(buf.toString("utf8").toLowerCase());
  }
  return false;
}

function looksLikeFile(buf: Buffer, ext: string) {
  if (ext === "zip" || ext === "xlsx" || ext === "docx" || ext === "epub") return buf[0] === 0x50 && buf[1] === 0x4b;
  if (ext === "pdf") return buf.subarray(0, 4).toString("ascii") === "%PDF";
  if (ext === "rar") return buf.subarray(0, 4).toString("ascii") === "Rar!";
  return true;
}

async function imageSize(buf: Buffer) {
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(buf).metadata();
    return { width: meta.width ?? 0, height: meta.height ?? 0 };
  } catch {
    return { width: 0, height: 0 };
  }
}

export type StoredMedia = { id: string; url: string; storedName: string; width: number; height: number; isPrivate: boolean };

export function mediaUrl(media: { storedName: string; isPrivate: boolean }) {
  return media.isPrivate ? "" : `/media/${media.storedName}`;
}

/** Validates and stores an upload. Images are public; other allowed files are stored privately. */
export async function storeUpload(file: File, opts: { alt?: string; folder?: string; private?: boolean } = {}): Promise<StoredMedia> {
  if (!(file instanceof File) || file.size === 0) throw new UploadError("فایلی انتخاب نشده.");
  const imageExt = IMAGE_TYPES[file.type];
  const fileExt = FILE_TYPES[file.type];
  const ext = imageExt ?? fileExt;
  if (!ext) throw new UploadError("این نوع فایل پشتیبانی نمی‌شود. تصویر (JPG، PNG، WebP، AVIF، GIF، SVG) یا فایل (ZIP، PDF، RAR، XLSX، DOCX، MP4، MP3).");
  const isPrivate = opts.private || !imageExt;
  const limit = imageExt ? MAX_IMAGE_BYTES : MAX_FILE_BYTES;
  if (file.size > limit) throw new UploadError(`حداکثر حجم ${Math.round(limit / 1024 / 1024)} مگابایت است.`);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (imageExt ? !looksLikeImage(bytes, file.type) : !looksLikeFile(bytes, ext)) throw new UploadError("محتوای فایل با نوع آن نمی‌خواند.");
  const storedName = `${randomBytes(16).toString("hex")}.${ext}`;
  const dir = isPrivate ? privateDir() : uploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, storedName), bytes);
  const size = imageExt && ext !== "svg" && ext !== "ico" ? await imageSize(bytes) : { width: 0, height: 0 };
  const row = await prisma.media.create({
    data: {
      filename: file.name.slice(0, 180),
      storedName,
      mime: file.type,
      size: bytes.length,
      alt: (opts.alt ?? "").trim().slice(0, 300),
      folder: (opts.folder ?? "").trim().slice(0, 60),
      isPrivate,
      width: size.width,
      height: size.height,
    },
  });
  return { id: row.id, url: mediaUrl(row), storedName, width: size.width, height: size.height, isPrivate };
}

/** Crops (and optionally resizes) an image into a new media item; the original is kept. */
export async function cropMedia(id: string, box: { x: number; y: number; width: number; height: number; maxWidth?: number }) {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media || media.isPrivate || !/^image\/(jpeg|png|webp|avif)$/.test(media.mime)) throw new UploadError("فقط تصاویر JPG، PNG، WebP یا AVIF قابل برش‌اند.");
  const sharp = (await import("sharp")).default;
  const src = path.join(uploadDir(), media.storedName);
  const image = sharp(src);
  const meta = await image.metadata();
  const W = meta.width ?? 0;
  const H = meta.height ?? 0;
  const left = Math.max(0, Math.min(W - 1, Math.round(box.x)));
  const top = Math.max(0, Math.min(H - 1, Math.round(box.y)));
  const width = Math.max(1, Math.min(W - left, Math.round(box.width)));
  const height = Math.max(1, Math.min(H - top, Math.round(box.height)));
  let pipeline = sharp(src).extract({ left, top, width, height });
  if (box.maxWidth && box.maxWidth < width) pipeline = pipeline.resize({ width: Math.round(box.maxWidth) });
  const out = await pipeline.webp({ quality: 86 }).toBuffer({ resolveWithObject: true });
  const storedName = `${randomBytes(16).toString("hex")}.webp`;
  await writeFile(path.join(uploadDir(), storedName), out.data);
  const row = await prisma.media.create({
    data: {
      filename: media.filename.replace(/\.\w+$/, "") + "-crop.webp",
      storedName,
      mime: "image/webp",
      size: out.data.length,
      alt: media.alt,
      folder: media.folder,
      width: out.info.width,
      height: out.info.height,
    },
  });
  return { id: row.id, url: mediaUrl(row) };
}

export async function deleteMediaFile(id: string) {
  const media = await prisma.media.delete({ where: { id } });
  await unlink(path.join(media.isPrivate ? privateDir() : uploadDir(), media.storedName)).catch(() => undefined);
  return media;
}

export class UploadError extends Error {}
