import { createHash, randomBytes } from "crypto";
import { compare } from "bcryptjs";
import { hashPassword } from "@/lib/password";
import { cookies, headers } from "next/headers";
import { prisma } from "@/lib/db";
import { RequestError } from "@/lib/utils";

export const SESSION_COOKIE = "ds_session";
export const SESSION_DAYS = 14;
const DUMMY_HASH = "$2b$12$QAHgXt29pTtCeO6qnmdybOXLVPSUcB6ApYvrtLunzlOAdPorV2gIu";
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

export function hashToken(token: string) {
  const pepper = process.env.SESSION_SECRET || "";
  return createHash("sha256").update(`${pepper}:${token}`).digest("hex");
}

export async function clientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    return (parts.at(-1) || "unknown").slice(0, 64);
  }
  return (h.get("x-real-ip") || "local").slice(0, 64);
}

export async function isHttps() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return proto === "https";
}

export async function assertSameOrigin() {
  const h = await headers();
  const origin = h.get("origin");
  const host = h.get("host");
  if (!origin || !host) throw new RequestError("درخواست نامعتبر است.");
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new RequestError("درخواست نامعتبر است.");
  }
  if (originHost !== host) throw new RequestError("درخواست نامعتبر است.");
}

export async function getSessionUser() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  return session.user;
}

export async function assertRateLimit(ip: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  await prisma.loginAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  const count = await prisma.loginAttempt.count({ where: { ip, createdAt: { gte: since } } });
  if (count >= MAX_ATTEMPTS) {
    throw new RequestError("تلاش بیش از حد. پانزده دقیقه بعد دوباره وارد شوید.");
  }
}

export async function recordFailure(ip: string) {
  await prisma.loginAttempt.create({ data: { ip } });
}

export async function clearFailures(ip: string) {
  await prisma.loginAttempt.deleteMany({ where: { ip } });
}

export async function verifyPassword(email: string, password: string) {
  const user = await prisma.adminUser.findUnique({ where: { email } });
  const ok = await compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return null;
  return user;
}

export { hashPassword };

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isHttps(),
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: await isHttps(),
    path: "/",
    maxAge: 0,
  });
}

export function safeNext(value: string) {
  if (!value.startsWith("/admin") || value.startsWith("//") || value.startsWith("/admin/login")) {
    return "/admin";
  }
  if (value.includes("\\") || value.includes("\n")) return "/admin";
  return value;
}
