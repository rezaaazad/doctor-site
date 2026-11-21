import { Prisma } from "@prisma/client";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { guardAction, type StaffUser } from "@/lib/auth";
import { RequestError } from "@/lib/utils";
import { UploadError } from "@/lib/media";
import { logActivity } from "@/lib/activity";
import type { Capability } from "@/lib/roles";
import { toLatinDigits } from "@/lib/money";

export type AdminState = { ok?: boolean; message?: string; errors?: Record<string, string>; data?: unknown; redirect?: string } | null;

export class FieldError extends Error {
  constructor(
    public field: string,
    message: string,
  ) {
    super(message);
  }
}

export function failState(error: unknown): AdminState {
  if (isRedirectError(error)) throw error;
  if (error instanceof FieldError) return { ok: false, message: error.message, errors: { [error.field]: error.message } };
  if (error instanceof ZodError) {
    const errors: Record<string, string> = {};
    for (const issue of error.issues) errors[issue.path.join(".")] ||= issue.message;
    return { ok: false, message: error.issues[0]?.message || "داده نامعتبر است.", errors };
  }
  if (error instanceof RequestError || error instanceof UploadError) return { ok: false, message: error.message };
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return { ok: false, message: "این مقدار (مثل نامک یا کد) قبلاً استفاده شده است." };
    if (error.code === "P2025") return { ok: false, message: "مورد پیدا نشد؛ شاید حذف شده است." };
    if (error.code === "P2003") return { ok: false, message: "این مورد به داده دیگری وصل است و حذف نمی‌شود." };
  }
  console.error(error);
  return { ok: false, message: "خطای غیرمنتظره؛ دوباره تلاش کنید." };
}

/**
 * Wraps an admin mutation: session + capability + same-origin check, error mapping, activity log and
 * revalidation. The callback may return a message, a partial state, or nothing.
 */
export async function adminRun(
  cap: Capability,
  fn: (user: StaffUser) => Promise<string | AdminState | void>,
  opts: { log?: { action: string; entity: string; entityId?: string; summary?: string } | ((r: unknown) => void); revalidate?: string[] } = {},
): Promise<AdminState> {
  try {
    const user = await guardAction(cap);
    const result = await fn(user);
    if (opts.log && typeof opts.log === "object") await logActivity(user, opts.log.action, opts.log.entity, opts.log.entityId ?? "", opts.log.summary ?? "");
    for (const p of opts.revalidate ?? ["/"]) revalidatePath(p, "layout");
    if (typeof result === "string") return { ok: true, message: result };
    return { ok: true, message: "ذخیره شد.", ...(result ?? {}) };
  } catch (error) {
    return failState(error);
  }
}

export const field = {
  text: (fd: FormData, name: string, max = 5000) => String(fd.get(name) ?? "").trim().slice(0, max),
  raw: (fd: FormData, name: string) => String(fd.get(name) ?? ""),
  flag: (fd: FormData, name: string) => ["1", "on", "true"].includes(String(fd.get(name) ?? "")),
  int: (fd: FormData, name: string, fallback = 0) => {
    const n = Number.parseInt(toLatinDigits(String(fd.get(name) ?? "")).replace(/[,٬\s]/g, ""), 10);
    return Number.isFinite(n) ? n : fallback;
  },
  num: (fd: FormData, name: string, fallback = 0) => {
    const n = Number(toLatinDigits(String(fd.get(name) ?? "")).replace(/[,٬\s]/g, "").replace("٫", "."));
    return Number.isFinite(n) ? n : fallback;
  },
  /** Toman input (as typed by staff) to Rial BigInt; empty → null. */
  toman: (fd: FormData, name: string): bigint | null => {
    const raw = toLatinDigits(String(fd.get(name) ?? "")).replace(/[,٬\s]/g, "");
    if (!raw) return null;
    if (!/^\d+$/.test(raw)) throw new FieldError(name, "مبلغ باید عدد صحیح به تومان باشد.");
    return BigInt(raw) * BigInt(10);
  },
  date: (fd: FormData, name: string): Date | null => {
    const raw = String(fd.get(name) ?? "").trim();
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) throw new FieldError(name, "تاریخ نامعتبر است.");
    return d;
  },
  lines: (fd: FormData, name: string) =>
    String(fd.get(name) ?? "")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
  json: <T = unknown>(fd: FormData, name: string, fallback: T): T => {
    try {
      const raw = String(fd.get(name) ?? "");
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      throw new FieldError(name, "داده ارسالی خراب است.");
    }
  },
  slug: (fd: FormData, name: string) => {
    const v = String(fd.get(name) ?? "")
      .trim()
      .toLowerCase()
      .replace(/[\s\u200c_]+/g, "-")
      .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    if (!v) throw new FieldError(name, "نامک (slug) لازم است.");
    return v.slice(0, 120);
  },
};

/** Revision snapshot helper for posts/pages/products. Keeps the latest 30 per entity. */
export async function snapshot(prisma: Prisma.TransactionClient | import("@prisma/client").PrismaClient, entityType: string, entityId: string, data: unknown, authorName: string) {
  await prisma.revision.create({ data: { entityType, entityId, data: JSON.parse(JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v))), authorName } });
  const old = await prisma.revision.findMany({ where: { entityType, entityId }, orderBy: { createdAt: "desc" }, skip: 30, select: { id: true } });
  if (old.length) await prisma.revision.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
}
