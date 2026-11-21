"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { clientIp } from "@/lib/auth";
import { getCustomer, logoutCustomer, requestOtp, safeCustomerNext, verifyOtp } from "@/lib/customer-auth";
import { PROVINCES } from "@/lib/iran";
import { startPayment, type GatewayId } from "@/lib/payments";
import { computeQuote, createOrder, sanitizeLines, type Quote } from "@/lib/store/checkout";
import { RequestError } from "@/lib/utils";

const hits = new Map<string, number[]>();
function throttle(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= limit) throw new RequestError("درخواست‌ها زیاد است. چند دقیقه بعد دوباره تلاش کنید.");
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
}

export type QuoteRequest = {
  lines: unknown;
  couponCode?: string;
  province?: string;
  shippingId?: string;
  gateway?: string;
  useWallet?: boolean;
  mobile?: string;
  withGateways?: boolean;
};

export async function quoteAction(input: QuoteRequest): Promise<Quote> {
  const customer = await getCustomer();
  const { quote } = await computeQuote({
    lines: sanitizeLines(input.lines),
    couponCode: typeof input.couponCode === "string" ? input.couponCode.slice(0, 40) : "",
    province: typeof input.province === "string" ? input.province : "",
    shippingId: typeof input.shippingId === "string" ? input.shippingId : "",
    gateway: typeof input.gateway === "string" ? input.gateway : "",
    useWallet: Boolean(input.useWallet),
    mobile: typeof input.mobile === "string" ? input.mobile : "",
    customer,
    withGateways: Boolean(input.withGateways),
  });
  return quote;
}

export type PlaceOrderRequest = QuoteRequest & {
  gateway: string;
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  addressLine?: string;
  postalCode?: string;
  note?: string;
  saveAddress?: boolean;
  acceptTerms?: boolean;
};

export type PlaceOrderResult = { ok: true; redirect: string } | { ok: false; message: string; field?: string };

const str = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export async function placeOrderAction(input: PlaceOrderRequest): Promise<PlaceOrderResult> {
  try {
    const ip = await clientIp();
    throttle(`order:${ip}`, 12, 10 * 60 * 1000);
    const customer = await getCustomer();
    const name = str(input.name, 120);
    if (name.length < 3) return { ok: false, message: "نام و نام خانوادگی را کامل بنویسید.", field: "name" };
    if (!input.acceptTerms) return { ok: false, message: "برای ثبت سفارش، قوانین خرید را بپذیرید.", field: "acceptTerms" };
    const province = str(input.province, 40);
    if (province && !(PROVINCES as readonly string[]).includes(province)) return { ok: false, message: "استان نامعتبر است.", field: "province" };
    const postalCode = str(input.postalCode, 20).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/\D/g, "");
    const email = str(input.email, 160);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "ایمیل معتبر نیست.", field: "email" };

    const order = await createOrder({
      lines: sanitizeLines(input.lines),
      couponCode: str(input.couponCode, 40),
      province,
      shippingId: str(input.shippingId, 40),
      gateway: str(input.gateway, 20) as GatewayId,
      useWallet: Boolean(input.useWallet),
      customer,
      name,
      mobile: str(input.mobile, 20),
      email,
      city: str(input.city, 80),
      addressLine: str(input.addressLine, 500),
      postalCode,
      note: str(input.note, 1000),
      ip,
    });

    if (customer && input.saveAddress && order.needsShipping) {
      const exists = await prisma.address.findFirst({ where: { customerId: customer.id, line: order.addressLine, postalCode: order.postalCode } });
      if (!exists) {
        const count = await prisma.address.count({ where: { customerId: customer.id } });
        await prisma.address.create({
          data: { customerId: customer.id, receiver: order.name, mobile: order.mobile, province: order.province, city: order.city, line: order.addressLine, postalCode: order.postalCode, isDefault: count === 0, title: count === 0 ? "خانه" : "" },
        });
      }
    }
    if (customer && !customer.name) await prisma.customer.update({ where: { id: customer.id }, data: { name, email: email || undefined } });

    const result = await startPayment(order.id, order.gateway as GatewayId);
    return { ok: true, redirect: result.redirect };
  } catch (error) {
    if (error instanceof RequestError) return { ok: false, message: error.message };
    console.error("place order failed", error);
    return { ok: false, message: "ثبت سفارش انجام نشد. چند لحظه بعد دوباره تلاش کنید." };
  }
}

export async function retryPaymentAction(orderNumber: number, accessKey: string, gateway: string): Promise<PlaceOrderResult> {
  try {
    const order = await prisma.order.findUnique({ where: { number: orderNumber } });
    if (!order || order.accessKey !== accessKey) return { ok: false, message: "سفارش پیدا نشد." };
    if (order.paymentStatus !== "unpaid" || !["pending", "failed"].includes(order.status)) return { ok: false, message: "این سفارش قابل پرداخت دوباره نیست." };
    if (order.status === "failed") await prisma.order.update({ where: { id: order.id }, data: { status: "pending" } });
    const result = await startPayment(order.id, gateway as GatewayId);
    return { ok: true, redirect: result.redirect };
  } catch (error) {
    if (error instanceof RequestError) return { ok: false, message: error.message };
    return { ok: false, message: "اتصال به درگاه برقرار نشد." };
  }
}

export async function toggleWishlistAction(productId: string): Promise<{ ok: boolean; wished?: boolean; login?: boolean }> {
  const customer = await getCustomer();
  if (!customer) return { ok: false, login: true };
  const product = await prisma.storeProduct.findUnique({ where: { id: String(productId).slice(0, 40) }, select: { id: true } });
  if (!product) return { ok: false };
  const existing = await prisma.wishlistItem.findUnique({ where: { customerId_productId: { customerId: customer.id, productId: product.id } } });
  if (existing) await prisma.wishlistItem.delete({ where: { id: existing.id } });
  else await prisma.wishlistItem.create({ data: { customerId: customer.id, productId: product.id } });
  revalidatePath("/account/wishlist");
  return { ok: true, wished: !existing };
}

export async function requestOtpAction(mobile: string) {
  const ip = await clientIp();
  try {
    throttle(`otp:${ip}`, 20, 60 * 60 * 1000);
  } catch (error) {
    return { ok: false, message: (error as Error).message };
  }
  return requestOtp(String(mobile ?? ""), ip);
}

export async function verifyOtpAction(mobile: string, code: string, next: string) {
  const ip = await clientIp();
  try {
    throttle(`verify:${ip}`, 40, 60 * 60 * 1000);
  } catch (error) {
    return { ok: false as const, message: (error as Error).message };
  }
  const result = await verifyOtp(String(mobile ?? ""), String(code ?? ""));
  if (!result.ok) return { ok: false as const, message: result.message };
  const target = safeCustomerNext(String(next || "/account"));
  return { ok: true as const, redirect: result.isNew && target === "/account" ? "/account/details?welcome=1" : target };
}

export async function logoutCustomerAction() {
  await logoutCustomer();
  return { ok: true };
}
