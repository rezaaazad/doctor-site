import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function siteUrl() {
  return (process.env.SITE_URL || "https://doctor-site.ir").replace(/\/$/, "");
}

export function isRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

export class RequestError extends Error {}

export function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function assertPlainContent(value: unknown, depth = 0): void {
  if (depth > 5) throw new RequestError("ساختار محتوا بیش از حد تو در تو است.");
  if (value === null || typeof value === "boolean" || typeof value === "number") return;
  if (typeof value === "string") {
    if (value.length > 12000) throw new RequestError("یکی از متن‌ها بیش از حد طولانی است.");
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > 40) throw new RequestError("یکی از فهرست‌ها بیش از حد طولانی است.");
    for (const item of value) assertPlainContent(item, depth + 1);
    return;
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (key === "__proto__" || key === "constructor" || key === "prototype") {
        throw new RequestError("کلید نامعتبر است.");
      }
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(key)) throw new RequestError("کلید نامعتبر است.");
      assertPlainContent(item, depth + 1);
    }
    return;
  }
  throw new RequestError("نوع داده نامعتبر است.");
}
