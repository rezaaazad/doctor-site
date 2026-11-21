import { randomBytes } from "crypto";
import type { Order, OrderItem, Payment } from "@prisma/client";
import { prisma } from "@/lib/db";
import { UpstreamError } from "@/lib/http";
import { getGroup } from "@/lib/options";
import { siteUrl, asObject, RequestError } from "@/lib/utils";
import { defer, notifyOrderPaid, notifyOrderStatus } from "@/lib/messaging/notify";
import { addOrderNote, markOrderPaid, reduceStockOnce } from "@/lib/store/orders";
import { CreditClient, type CreditConfig, type CreditGatewayId } from "@/lib/payments/credit";
import { ZarinpalClient } from "@/lib/payments/zarinpal";

export type GatewayId = "zarinpal" | "snapppay" | "torobpay" | "bank" | "cod" | "mock";
export const ONLINE_GATEWAYS: GatewayId[] = ["zarinpal", "snapppay", "torobpay", "mock"];
export const CREDIT_GATEWAYS: CreditGatewayId[] = ["snapppay", "torobpay"];

export type GatewayOption = {
  id: GatewayId;
  title: string;
  description: string;
  kind: "online" | "installment" | "offline";
  feeRial: number;
  sandbox: boolean;
};

export type AvailabilityContext = { payableRial: bigint; needsShipping: boolean; province: string };

const DEFAULT_TITLES: Record<GatewayId, [string, string]> = {
  zarinpal: ["پرداخت آنلاین", "همه کارت‌های عضو شتاب"],
  snapppay: ["اسنپ‌پی — پرداخت اقساطی", "۴ قسط ماهانه، بدون سود و بدون ضامن"],
  torobpay: ["ترب‌پی — خرید اعتباری", "اکنون بخرید، در اقساط بپردازید"],
  bank: ["کارت‌به‌کارت", "بعد از واریز، سفارش تأیید می‌شود"],
  cod: ["پرداخت در محل", "پرداخت هنگام تحویل با کارت‌خوان"],
  mock: ["درگاه آزمایشی", "برای تست مسیر خرید"],
};

export async function creditConfig(gateway: CreditGatewayId): Promise<CreditConfig & { enabled: boolean; settle: boolean; sortOrder: number }> {
  const g = await getGroup(`pay_${gateway}`);
  return {
    gateway,
    enabled: Boolean(g.enabled),
    mode: (["live", "stage", "mock"].includes(String(g.mode)) ? g.mode : "stage") as CreditConfig["mode"],
    baseUrl: String(g.baseUrl || ""),
    stageBaseUrl: String(g.stageBaseUrl || ""),
    clientId: String(g.clientId || ""),
    clientSecret: String(g.clientSecret || ""),
    username: String(g.username || ""),
    password: String(g.password || ""),
    commissionType: String(g.commissionType || ""),
    settle: gateway === "snapppay" ? true : g.settle !== false,
    sortOrder: Number(g.sortOrder) || 0,
  };
}

export async function creditClient(gateway: CreditGatewayId) {
  return new CreditClient(await creditConfig(gateway));
}

const eligibilityCache = new Map<string, { at: number; value: { eligible: boolean; title: string; description: string } }>();

async function creditEligibility(gateway: CreditGatewayId, amountRial: bigint) {
  const key = `${gateway}:${amountRial}`;
  const hit = eligibilityCache.get(key);
  if (hit && Date.now() - hit.at < 120_000) return hit.value;
  try {
    const value = await (await creditClient(gateway)).eligible(Number(amountRial));
    eligibilityCache.set(key, { at: Date.now(), value });
    return value;
  } catch (error) {
    console.error(`${gateway} eligibility failed`, error instanceof UpstreamError ? error.message : error);
    return { eligible: false, title: "", description: "" };
  }
}

export async function availableGateways(ctx: AvailabilityContext): Promise<GatewayOption[]> {
  const [zp, bank, cod, mock] = await Promise.all([getGroup("pay_zarinpal"), getGroup("pay_bank"), getGroup("pay_cod"), getGroup("pay_mock")]);
  const options: (GatewayOption & { sort: number })[] = [];
  if (zp.enabled && zp.merchantId) {
    options.push({ id: "zarinpal", title: String(zp.title || DEFAULT_TITLES.zarinpal[0]), description: String(zp.description || DEFAULT_TITLES.zarinpal[1]), kind: "online", feeRial: 0, sandbox: Boolean(zp.sandbox), sort: Number(zp.sortOrder) });
  }
  for (const id of CREDIT_GATEWAYS) {
    const cfg = await creditConfig(id);
    if (!cfg.enabled || ctx.payableRial <= BigInt(0)) continue;
    const result = await creditEligibility(id, ctx.payableRial);
    if (!result.eligible) continue;
    options.push({ id, title: result.title || DEFAULT_TITLES[id][0], description: result.description || DEFAULT_TITLES[id][1], kind: "installment", feeRial: 0, sandbox: cfg.mode !== "live", sort: cfg.sortOrder });
  }
  if (bank.enabled) options.push({ id: "bank", title: String(bank.title || DEFAULT_TITLES.bank[0]), description: String(bank.instructions || DEFAULT_TITLES.bank[1]), kind: "offline", feeRial: 0, sandbox: false, sort: Number(bank.sortOrder) });
  if (cod.enabled && ctx.needsShipping) {
    const provinces = String(cod.provinces || "").split(/[,،]/).map((p) => p.trim()).filter(Boolean);
    if (!provinces.length || provinces.includes(ctx.province)) {
      options.push({ id: "cod", title: String(cod.title || DEFAULT_TITLES.cod[0]), description: DEFAULT_TITLES.cod[1], kind: "offline", feeRial: (Number(cod.feeToman) || 0) * 10, sandbox: false, sort: Number(cod.sortOrder) });
    }
  }
  if (mock.enabled) options.push({ id: "mock", title: String(mock.title || DEFAULT_TITLES.mock[0]), description: DEFAULT_TITLES.mock[1], kind: "online", feeRial: 0, sandbox: true, sort: Number(mock.sortOrder) });
  return options.sort((a, b) => a.sort - b.sort).map(({ sort: _sort, ...rest }) => rest);
}

export function callbackUrl(gateway: string) {
  return `${siteUrl()}/api/pay/${gateway}/callback`;
}

export function resultUrl(order: Pick<Order, "number" | "accessKey">) {
  return `/checkout/result/${order.number}?k=${order.accessKey}`;
}

function payable(order: Order) {
  return order.totalRial - order.walletRial;
}

type OrderWithItems = Order & { items: OrderItem[] };

function creditRequest(order: OrderWithItems, transactionId: string, gateway: CreditGatewayId, commissionType: string) {
  return {
    amount: Number(payable(order)),
    discountAmount: Number(order.discountRial),
    externalSourceAmount: Number(order.walletRial),
    mobile: order.mobile,
    returnURL: callbackUrl(gateway),
    transactionId,
    postalCode: order.postalCode || undefined,
    cart: {
      id: order.number,
      shippingAmount: Number(order.shippingRial),
      taxAmount: Number(order.taxRial),
      items: order.items.map((item, index) => ({
        id: index + 1,
        name: item.variantTitle ? `${item.title} - ${item.variantTitle}` : item.title,
        category: item.category,
        amount: Number(item.unitRial),
        count: item.quantity,
        commissionType: Number(commissionType) || undefined,
      })),
    },
  };
}

export type StartResult = { redirect: string };

/** Starts payment for an already-created order and returns where to send the customer. */
export async function startPayment(orderId: string, gateway: GatewayId): Promise<StartResult> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) throw new RequestError("سفارش پیدا نشد.");
  if (order.paymentStatus !== "unpaid") return { redirect: resultUrl(order) };

  if (payable(order) <= BigInt(0)) {
    await markOrderPaid(order.id, { gateway: order.walletRial > BigInt(0) ? "wallet" : "free", note: "سفارش بدون نیاز به پرداخت آنلاین تأیید شد." });
    return { redirect: resultUrl(order) };
  }

  if (gateway === "bank" || gateway === "cod") {
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: order.id }, data: { status: "on_hold", gateway } });
      await reduceStockOnce(order.id, tx);
      await addOrderNote(order.id, gateway === "bank" ? "منتظر تأیید واریز کارت‌به‌کارت." : "پرداخت در محل؛ بعد از تحویل تأیید شود.", {}, tx);
    });
    defer(async () => {
      await notifyOrderPaid(order.id);
      await notifyOrderStatus(order.id);
    });
    return { redirect: resultUrl(order) };
  }

  const transactionId = `DS${order.number}-${randomBytes(5).toString("hex")}`;
  const amountRial = payable(order);
  const payment = await prisma.payment.create({
    data: { orderId: order.id, gateway, amountRial, transactionId, status: "initiated" },
  });
  await prisma.order.update({ where: { id: order.id }, data: { gateway } });

  try {
    if (gateway === "zarinpal") {
      const cfg = await getGroup("pay_zarinpal");
      if (!cfg.enabled) throw new RequestError("این درگاه فعال نیست.");
      const client = new ZarinpalClient({ merchantId: String(cfg.merchantId || ""), sandbox: Boolean(cfg.sandbox) });
      const res = await client.request({
        amountRial: Number(amountRial),
        callbackUrl: `${callbackUrl("zarinpal")}?tx=${transactionId}`,
        description: `سفارش ${order.number}`,
        mobile: order.mobile,
        email: order.email,
        orderId: String(order.number),
      });
      await prisma.payment.update({ where: { id: payment.id }, data: { authority: res.authority, status: "redirected", sandbox: Boolean(cfg.sandbox), raw: { request: res.raw } as object } });
      return { redirect: res.url };
    }

    if (gateway === "snapppay" || gateway === "torobpay") {
      const cfg = await creditConfig(gateway);
      if (!cfg.enabled) throw new RequestError("این درگاه فعال نیست.");
      if (cfg.mode === "mock") {
        await prisma.payment.update({ where: { id: payment.id }, data: { authority: `mock_${transactionId}`, status: "redirected", sandbox: true } });
        return { redirect: `/pay/mock/${transactionId}` };
      }
      const client = new CreditClient(cfg);
      const res = await client.createToken(creditRequest(order, transactionId, gateway, cfg.commissionType ?? ""));
      await prisma.payment.update({ where: { id: payment.id }, data: { authority: res.paymentToken, status: "redirected", sandbox: cfg.mode !== "live", raw: { token: res.raw } as object } });
      return { redirect: res.paymentPageUrl };
    }

    if (gateway === "mock") {
      const cfg = await getGroup("pay_mock");
      if (!cfg.enabled) throw new RequestError("این درگاه فعال نیست.");
      await prisma.payment.update({ where: { id: payment.id }, data: { authority: `mock_${transactionId}`, status: "redirected", sandbox: true } });
      return { redirect: `/pay/mock/${transactionId}` };
    }
    throw new RequestError("روش پرداخت نامعتبر است.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطای درگاه";
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed", message: message.slice(0, 500), raw: { error: error instanceof UpstreamError ? (error.body as object) ?? {} : {} } } });
    await addOrderNote(order.id, `اتصال به درگاه ${gateway} ناموفق بود: ${message}`);
    if (error instanceof RequestError) throw error;
    throw new RequestError("اتصال به درگاه برقرار نشد. چند لحظه بعد دوباره تلاش کنید یا روش دیگری انتخاب کنید.");
  }
}

export type CallbackOutcome = { ok: boolean; message: string; orderNumber: number; accessKey: string };

async function findPayment(gateway: string, params: Record<string, string>) {
  const tx = params.tx || params.transactionId || params.transaction_id || "";
  if (tx) {
    const p = await prisma.payment.findUnique({ where: { transactionId: tx }, include: { order: true } });
    if (p && p.gateway === gateway) return p;
  }
  const authority = params.Authority || params.authority || params.paymentToken || "";
  if (authority) {
    return prisma.payment.findFirst({ where: { gateway, authority }, include: { order: true }, orderBy: { createdAt: "desc" } });
  }
  return null;
}

function outcome(payment: Payment & { order: Order }, ok: boolean, message: string): CallbackOutcome {
  return { ok, message, orderNumber: payment.order.number, accessKey: payment.order.accessKey };
}

async function failPayment(payment: Payment & { order: Order }, message: string, raw: unknown = {}) {
  await prisma.payment.update({ where: { id: payment.id }, data: { status: "failed", message: message.slice(0, 500), raw: { ...asObject(payment.raw), callback: raw } as object } });
  await addOrderNote(payment.orderId, `پرداخت ناموفق (${payment.gateway}): ${message}`);
  return outcome(payment, false, message);
}

/**
 * Verifies a gateway callback server-side. Never trusts the query/body status alone: every success path
 * calls the gateway's verify API (or the server-side mock record) before marking the order paid.
 */
export async function handleCallback(gateway: string, params: Record<string, string>): Promise<CallbackOutcome | null> {
  if (!ONLINE_GATEWAYS.includes(gateway as GatewayId)) return null;
  const payment = await findPayment(gateway, params);
  if (!payment) return null;
  if (["verified", "settled"].includes(payment.status)) return outcome(payment, true, "پرداخت قبلاً تأیید شده است.");
  if (payment.status === "failed" || payment.status === "cancelled") return outcome(payment, false, payment.message || "پرداخت ناموفق بود.");

  const claimed = await prisma.payment.updateMany({ where: { id: payment.id, status: { in: ["initiated", "redirected"] } }, data: { status: "verifying" } });
  if (!claimed.count) {
    const fresh = await prisma.payment.findUnique({ where: { id: payment.id }, include: { order: true } });
    const ok = !!fresh && ["verified", "settled"].includes(fresh.status);
    return outcome(payment, ok, ok ? "پرداخت تأیید شد." : "پرداخت در حال بررسی است.");
  }

  try {
    if (gateway === "zarinpal") {
      const status = params.Status || params.status || "";
      if (status !== "OK") return await failPayment(payment, "پرداخت توسط کاربر لغو شد یا ناموفق بود.", params);
      if (params.Authority && params.Authority !== payment.authority) return await failPayment(payment, "شناسه پرداخت مطابقت ندارد.", params);
      const cfg = await getGroup("pay_zarinpal");
      const client = new ZarinpalClient({ merchantId: String(cfg.merchantId || ""), sandbox: payment.sandbox });
      const res = await client.verify({ amountRial: Number(payment.amountRial), authority: payment.authority });
      if (!res.ok) return await failPayment(payment, res.message, res.raw);
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "verified", refId: res.refId, cardPan: res.cardPan, message: "OK", raw: { ...asObject(payment.raw), verify: res.raw } as object } });
      await markOrderPaid(payment.orderId, { gateway, paymentId: payment.id, note: `پرداخت زرین‌پال تأیید شد. کد پیگیری: ${res.refId}` });
      return outcome(payment, true, "پرداخت با موفقیت انجام شد.");
    }

    if (gateway === "snapppay" || gateway === "torobpay") {
      const state = (params.state || params.State || "").toUpperCase();
      if (state && state !== "OK") return await failPayment(payment, "پرداخت اقساطی تکمیل نشد.", params);
      const cfg = await creditConfig(gateway);
      if (cfg.mode === "mock" || payment.authority.startsWith("mock_")) {
        const approved = asObject(payment.raw).mock === "approved";
        if (!approved) return await failPayment(payment, "پرداخت آزمایشی تأیید نشد.", params);
        await prisma.payment.update({ where: { id: payment.id }, data: { status: "settled", refId: `MOCK-${payment.transactionId}`, message: "mock settled" } });
        await markOrderPaid(payment.orderId, { gateway, paymentId: payment.id, note: `پرداخت آزمایشی ${gateway} تأیید و تسویه شد.` });
        return outcome(payment, true, "پرداخت آزمایشی موفق بود.");
      }
      const client = new CreditClient(cfg);
      const verified = await client.verify(payment.authority);
      if (verified.transactionId && verified.transactionId !== payment.transactionId) {
        return await failPayment(payment, "شناسه تراکنش برگشتی با سفارش یکسان نیست.", verified.raw);
      }
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "verified", refId: verified.transactionId, raw: { ...asObject(payment.raw), verify: verified.raw } as object } });
      if (cfg.settle) {
        try {
          const settled = await client.settle(payment.authority);
          await prisma.payment.update({ where: { id: payment.id }, data: { status: "settled", message: "settled", raw: { ...asObject(payment.raw), verify: verified.raw, settle: settled.raw } as object } });
        } catch (error) {
          await addOrderNote(payment.orderId, `Verify موفق بود ولی Settle انجام نشد (${(error as Error).message}). از صفحه سفارش دوباره Settle بزنید.`);
          return outcome(payment, false, "پرداخت تأیید شد ولی نهایی نشد. همکاران ما در کمتر از چند دقیقه پیگیری می‌کنند.");
        }
      }
      await markOrderPaid(payment.orderId, { gateway, paymentId: payment.id, note: `پرداخت اقساطی ${gateway === "snapppay" ? "اسنپ‌پی" : "ترب‌پی"} تأیید شد.` });
      return outcome(payment, true, "خرید اقساطی شما با موفقیت ثبت شد.");
    }

    if (gateway === "mock") {
      const approved = asObject(payment.raw).mock === "approved";
      if (!approved) return await failPayment(payment, "پرداخت آزمایشی لغو شد.", params);
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "verified", refId: `MOCK-${payment.transactionId}`, message: "mock" } });
      await markOrderPaid(payment.orderId, { gateway, paymentId: payment.id, note: "پرداخت با درگاه آزمایشی تأیید شد." });
      return outcome(payment, true, "پرداخت آزمایشی موفق بود.");
    }
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "خطای ناشناخته";
    await prisma.payment.updateMany({ where: { id: payment.id, status: "verifying" }, data: { status: "redirected", message: `verify error: ${message}`.slice(0, 500) } });
    await addOrderNote(payment.orderId, `خطا در تأیید پرداخت ${gateway}: ${message}`);
    return outcome(payment, false, "تأیید پرداخت با خطا روبه‌رو شد. اگر مبلغ کسر شده، تا ۷۲ ساعت برمی‌گردد یا با پشتیبانی تماس بگیرید.");
  }
}

/** Mock gateway page decision, stored server-side so the callback cannot be forged with ?state=OK. */
export async function recordMockDecision(transactionId: string, approved: boolean) {
  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment || !payment.authority.startsWith("mock_") || payment.status !== "redirected") return null;
  await prisma.payment.update({ where: { id: payment.id }, data: { raw: { ...asObject(payment.raw), mock: approved ? "approved" : "declined" } } });
  return payment;
}

export type AdminPaymentOp = "settle" | "revert" | "cancel" | "status";

export async function adminPaymentOp(paymentId: string, op: AdminPaymentOp) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw new RequestError("تراکنش پیدا نشد.");
  if (!CREDIT_GATEWAYS.includes(payment.gateway as CreditGatewayId)) throw new RequestError("این عملیات فقط برای اسنپ‌پی و ترب‌پی است.");
  const gateway = payment.gateway as CreditGatewayId;
  if (payment.authority.startsWith("mock_")) {
    const statusMap: Record<AdminPaymentOp, string> = { settle: "settled", revert: "reverted", cancel: "cancelled", status: payment.status };
    await prisma.payment.update({ where: { id: payment.id }, data: { status: statusMap[op] } });
    if (op === "settle") await markOrderPaid(payment.orderId, { gateway, paymentId });
    return `حالت آزمایشی: ${op} انجام شد.`;
  }
  const client = await creditClient(gateway);
  try {
    if (op === "status") {
      const res = await client.status(payment.authority);
      await prisma.payment.update({ where: { id: payment.id }, data: { message: `status: ${res.status}`, raw: { ...asObject(payment.raw), status: res.raw } as object } });
      return `وضعیت در درگاه: ${res.status || "نامشخص"}`;
    }
    if (op === "settle") {
      const res = await client.settle(payment.authority);
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "settled", raw: { ...asObject(payment.raw), settle: res.raw } as object } });
      await markOrderPaid(payment.orderId, { gateway, paymentId, note: "Settle دستی از پنل مدیریت انجام شد." });
      return "Settle انجام شد.";
    }
    if (op === "revert") {
      await client.revert(payment.authority);
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "reverted" } });
      await addOrderNote(payment.orderId, "تراکنش اعتباری Revert شد.");
      return "Revert انجام شد.";
    }
    await client.cancel(payment.authority);
    await prisma.payment.update({ where: { id: payment.id }, data: { status: "cancelled" } });
    await addOrderNote(payment.orderId, "خرید اعتباری لغو (Cancel) شد و مبلغ به مشتری برمی‌گردد.");
    return "لغو انجام شد.";
  } catch (error) {
    throw new RequestError(`درگاه پاسخ خطا داد: ${(error as Error).message}`);
  }
}
