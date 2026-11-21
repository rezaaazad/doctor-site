import { createHash, randomBytes } from "crypto";
import { compare } from "bcryptjs";
import { hashPassword } from "@/lib/password";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { can, type Capability } from "@/lib/roles";
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

/**
 * One definition of the client IP for rate limits, OTP, analytics and logs.
 * CLIENT_IP_HEADER names a header set by the trusted CDN (for example "x-real-ip").
 * Without it the last X-Forwarded-For hop is used, which is the address Caddy saw.
 */
export function ipFromHeaders(h: Headers) {
  const custom = process.env.CLIENT_IP_HEADER?.trim().toLowerCase();
  if (custom) {
    const value = h.get(custom)?.split(",")[0]?.trim();
    if (value) return value.slice(0, 64);
  }
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((part) => part.trim()).filter(Boolean);
    return (parts.at(-1) || "unknown").slice(0, 64);
  }
  return (h.get("x-real-ip") || "local").slice(0, 64);
}

export async function clientIp() {
  return ipFromHeaders(await headers());
}

export async function isHttps() {
  const h = await headers();
  const proto = h.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return proto === "https";
}

export function sameOrigin(h: Headers) {
  const origin = h.get("origin");
  const hosts = [h.get("host"), h.get("x-forwarded-host")?.split(",")[0]?.trim()].filter(Boolean);
  if (!origin || hosts.length === 0) return false;
  try {
    return hosts.includes(new URL(origin).host);
  } catch {
    return false;
  }
}

export async function assertSameOrigin() {
  if (!sameOrigin(await headers())) throw new RequestError("درخواست نامعتبر است.");
}

export type StaffUser = { id: string; email: string; name: string; role: string };

export async function getSessionUser(): Promise<StaffUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now() || !session.user.active) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  const { id, email, name, role } = session.user;
  return { id, email, name, role };
}

/** For server components: redirects to login, or to the dashboard when the role lacks the capability. */
export async function requireStaff(cap?: Capability): Promise<StaffUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (cap && !can(user.role, cap)) redirect("/admin?denied=1");
  return user;
}

/** For server actions: session, capability and same-origin. */
export async function guardAction(cap?: Capability): Promise<StaffUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  await assertSameOrigin();
  if (cap && !can(user.role, cap)) throw new RequestError("دسترسی این کار را ندارید.");
  return user;
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
  if (!user || !ok || !user.active) return null;
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
  await prisma.adminUser.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }).catch(() => undefined);
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
