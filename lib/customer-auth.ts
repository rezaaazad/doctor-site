import { createHash, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { hashToken, isHttps } from "@/lib/auth";
import { getGroup } from "@/lib/options";
import { normalizeMobile } from "@/lib/money";
import { sendOtpSms } from "@/lib/messaging/sms";
import { renderTemplate } from "@/lib/messaging/templates";

export const CUSTOMER_COOKIE = "ds_customer";
const SESSION_DAYS = 30;
const OTP_TTL_MS = 2 * 60 * 1000;
const RESEND_MS = 60 * 1000;
const MAX_PER_HOUR_MOBILE = 5;
const MAX_PER_HOUR_IP = 15;
const MAX_ATTEMPTS = 5;

function hashCode(mobile: string, code: string) {
  return createHash("sha256").update(`${process.env.SESSION_SECRET || ""}:otp:${mobile}:${code}`).digest("hex");
}

export type OtpRequestResult = { ok: boolean; message: string; retryIn?: number; devCode?: string };

export async function requestOtp(rawMobile: string, ip: string): Promise<OtpRequestResult> {
  const mobile = normalizeMobile(rawMobile);
  if (!mobile) return { ok: false, message: "شماره موبایل معتبر نیست. مثل ۰۹۱۲۱۲۳۴۵۶۷" };
  const customer = await prisma.customer.findUnique({ where: { mobile }, select: { blocked: true } });
  if (customer?.blocked) return { ok: false, message: "این حساب غیرفعال است. با پشتیبانی تماس بگیرید." };
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [last, perMobile, perIp] = await Promise.all([
    prisma.otpCode.findFirst({ where: { mobile }, orderBy: { createdAt: "desc" } }),
    prisma.otpCode.count({ where: { mobile, createdAt: { gte: hourAgo } } }),
    prisma.otpCode.count({ where: { ip, createdAt: { gte: hourAgo } } }),
  ]);
  if (last && Date.now() - last.createdAt.getTime() < RESEND_MS) {
    const retryIn = Math.ceil((RESEND_MS - (Date.now() - last.createdAt.getTime())) / 1000);
    return { ok: true, message: "کد قبلاً فرستاده شده است.", retryIn };
  }
  if (perMobile >= MAX_PER_HOUR_MOBILE || perIp >= MAX_PER_HOUR_IP) {
    return { ok: false, message: "درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید." };
  }
  const code = String(randomInt(10000, 100000));
  await prisma.otpCode.create({ data: { mobile, ip, codeHash: hashCode(mobile, code), expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
  await prisma.otpCode.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
  const [templates, settings, sms] = await Promise.all([
    getGroup("templates"),
    prisma.siteSettings.findUnique({ where: { id: "default" }, select: { siteName: true } }),
    getGroup("sms"),
  ]);
  const text = renderTemplate(String(templates.otp), { code, site: settings?.siteName || "" });
  const sent = await sendOtpSms(mobile, code, text);
  if (!sent.ok) return { ok: false, message: "ارسال پیامک انجام نشد. چند لحظه بعد دوباره تلاش کنید." };
  const devCode = sms.provider === "console" && process.env.NODE_ENV !== "production" ? code : undefined;
  return { ok: true, message: "کد ۵ رقمی به موبایل شما پیامک شد.", retryIn: RESEND_MS / 1000, devCode };
}

export async function verifyOtp(rawMobile: string, rawCode: string) {
  const mobile = normalizeMobile(rawMobile);
  const code = rawCode.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/\D/g, "");
  if (!mobile || code.length !== 5) return { ok: false as const, message: "کد ۵ رقمی را کامل وارد کنید." };
  const otp = await prisma.otpCode.findFirst({
    where: { mobile, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { ok: false as const, message: "کد منقضی شده است. کد تازه بگیرید." };
  if (otp.attempts >= MAX_ATTEMPTS) return { ok: false as const, message: "تلاش زیاد. کد تازه بگیرید." };
  const expected = Buffer.from(otp.codeHash, "hex");
  const actual = Buffer.from(hashCode(mobile, code), "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    return { ok: false as const, message: "کد درست نیست." };
  }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
  const customer = await prisma.customer.upsert({
    where: { mobile },
    create: { mobile, lastLoginAt: new Date() },
    update: { lastLoginAt: new Date() },
  });
  if (customer.blocked) return { ok: false as const, message: "این حساب غیرفعال است." };
  await createCustomerSession(customer.id);
  await prisma.order.updateMany({ where: { customerId: null, mobile }, data: { customerId: customer.id } });
  return { ok: true as const, customer, isNew: !customer.name };
}

export async function createCustomerSession(customerId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.customerSession.create({
    data: { customerId, tokenHash: hashToken(`c:${token}`), expiresAt: new Date(Date.now() + SESSION_DAYS * 86400_000) },
  });
  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: await isHttps(), path: "/", maxAge: SESSION_DAYS * 86400 });
}

export const getCustomer = cache(async () => {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.customerSession
    .findUnique({ where: { tokenHash: hashToken(`c:${token}`) }, include: { customer: true } })
    .catch(() => null);
  if (!session || session.expiresAt.getTime() < Date.now() || session.customer.blocked) return null;
  return session.customer;
});

export async function requireCustomer(next = "/account") {
  const customer = await getCustomer();
  if (!customer) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return customer;
}

export async function logoutCustomer() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token) await prisma.customerSession.deleteMany({ where: { tokenHash: hashToken(`c:${token}`) } });
  jar.set(CUSTOMER_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: await isHttps(), path: "/", maxAge: 0 });
}

export function safeCustomerNext(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || value.startsWith("/admin")) return "/account";
  return value;
}
