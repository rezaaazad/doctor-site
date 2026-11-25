import { randomBytes } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGroup } from "@/lib/options";
import { RequestError } from "@/lib/utils";
import { defer, notifyOrderPaid, notifyOrderStatus } from "@/lib/messaging/notify";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/store/status";

type Tx = Prisma.TransactionClient;

export function newAccessKey() {
  return randomBytes(18).toString("base64url");
}

export async function addOrderNote(orderId: string, body: string, opts: { toCustomer?: boolean; system?: boolean; authorName?: string } = {}, tx: Tx = prisma) {
  await tx.orderNote.create({
    data: { orderId, body: body.slice(0, 4000), toCustomer: opts.toCustomer ?? false, system: opts.system ?? true, authorName: opts.authorName ?? "سیستم" },
  });
}

async function adjustStock(tx: Tx, orderId: string, direction: 1 | -1) {
  const items = await tx.orderItem.findMany({ where: { orderId }, include: { product: { select: { manageStock: true } } } });
  for (const item of items) {
    if (!item.productId || !item.product?.manageStock) continue;
    const delta = direction * item.quantity;
    if (item.variantId) await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: delta } } });
    else await tx.storeProduct.updateMany({ where: { id: item.productId }, data: { stock: { increment: delta } } });
  }
}

export async function reduceStockOnce(orderId: string, tx: Tx) {
  const claimed = await tx.order.updateMany({ where: { id: orderId, stockReduced: false }, data: { stockReduced: true } });
  if (claimed.count) await adjustStock(tx, orderId, -1);
}

export async function restockOnce(orderId: string, tx: Tx) {
  const claimed = await tx.order.updateMany({ where: { id: orderId, stockReduced: true }, data: { stockReduced: false } });
  if (claimed.count) await adjustStock(tx, orderId, 1);
}

async function grantDownloads(tx: Tx, orderId: string) {
  const items = await tx.orderItem.findMany({
    where: { orderId, type: "digital" },
    include: { product: { select: { downloadUrl: true, downloadMedia: true, downloadLimit: true, downloadDays: true } }, downloads: true },
  });
  for (const item of items) {
    if (item.downloads.length || !item.product || (!item.product.downloadUrl && !item.product.downloadMedia)) continue;
    await tx.downloadGrant.create({
      data: {
        orderId,
        orderItemId: item.id,
        token: randomBytes(24).toString("base64url"),
        title: item.variantTitle ? `${item.title} — ${item.variantTitle}` : item.title,
        remaining: item.product.downloadLimit > 0 ? item.product.downloadLimit * item.quantity : 9999,
        expiresAt: item.product.downloadDays > 0 ? new Date(Date.now() + item.product.downloadDays * 86400_000) : null,
      },
    });
  }
}

/**
 * Marks an order as paid exactly once. Safe to call repeatedly from callbacks, webhooks and admin.
 * Returns true only for the call that performed the transition.
 */
export async function markOrderPaid(orderId: string, info: { gateway: string; paymentId?: string; note?: string }) {
  const done = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new RequestError("سفارش پیدا نشد.");
    const claimed = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: "unpaid" },
      data: { paymentStatus: "paid", paidAt: new Date(), gateway: info.gateway },
    });
    if (!claimed.count) return false;
    await reduceStockOnce(orderId, tx);
    await grantDownloads(tx, orderId);
    const allDigital = order.items.every((item) => item.type === "digital");
    await tx.order.update({
      where: { id: orderId },
      data: allDigital ? { status: "completed", completedAt: new Date() } : { status: "processing", projectStage: order.items.some(i => i.type === "service") ? "awaiting_brief" : "" },
    });
    for (const item of order.items) {
      if (item.productId) await tx.storeProduct.updateMany({ where: { id: item.productId }, data: { salesCount: { increment: item.quantity } } });
    }
    if (order.couponCode) await tx.coupon.updateMany({ where: { code: order.couponCode }, data: { usedCount: { increment: 1 } } });
    if (order.walletRial > BigInt(0) && order.customerId) {
      await tx.customer.update({ where: { id: order.customerId }, data: { walletRial: { decrement: order.walletRial } } });
      await tx.walletTransaction.create({ data: { customerId: order.customerId, amountRial: -order.walletRial, reason: `پرداخت سفارش ${order.number}`, orderId } });
    }
    await addOrderNote(orderId, info.note || `پرداخت با ${info.gateway} تأیید شد.`, {}, tx);
    return true;
  });
  if (done) defer(() => notifyOrderPaid(orderId));
  return done;
}

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["on_hold", "processing", "completed", "cancelled", "failed"],
  on_hold: ["processing", "shipped", "completed", "cancelled", "failed"],
  processing: ["on_hold", "shipped", "delivered", "completed", "cancelled", "refunded"],
  shipped: ["delivered", "completed", "processing", "refunded"],
  delivered: ["completed", "refunded"],
  completed: ["refunded", "processing"],
  cancelled: ["pending", "processing"],
  failed: ["pending", "processing", "cancelled"],
  refunded: [],
};

export function canTransition(from: string, to: string) {
  if (from === to) return true;
  return (TRANSITIONS[from as OrderStatus] ?? []).includes(to as OrderStatus);
}

export async function setOrderStatus(
  orderId: string,
  status: string,
  opts: { authorName?: string; trackingCode?: string; carrier?: string; note?: string; notify?: boolean } = {},
) {
  if (!(status in ORDER_STATUSES)) throw new RequestError("وضعیت نامعتبر است.");
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new RequestError("سفارش پیدا نشد.");
  if (!canTransition(order.status, status)) throw new RequestError("تغییر به این وضعیت مجاز نیست.");
  await prisma.$transaction(async (tx) => {
    if (["cancelled", "failed", "refunded"].includes(status)) await restockOnce(orderId, tx);
    if (["processing", "shipped", "delivered", "completed", "on_hold"].includes(status) && order.status !== status) {
      if (["cancelled", "failed"].includes(order.status)) await reduceStockOnce(orderId, tx);
    }
    await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        trackingCode: opts.trackingCode ?? undefined,
        carrier: opts.carrier ?? undefined,
        completedAt: status === "completed" ? new Date() : undefined,
      },
    });
    if (order.status !== status) {
      await addOrderNote(orderId, `وضعیت از «${ORDER_STATUSES[order.status as OrderStatus]?.label ?? order.status}» به «${ORDER_STATUSES[status as OrderStatus].label}» تغییر کرد.`, { authorName: opts.authorName }, tx);
    }
    if (opts.note) await addOrderNote(orderId, opts.note, { toCustomer: true, system: false, authorName: opts.authorName }, tx);
  });
  if (opts.notify !== false && order.status !== status) defer(() => notifyOrderStatus(orderId));
}

export async function recordRefund(orderId: string, amountRial: bigint, opts: { method: string; reason: string; authorName: string; toWallet?: boolean }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new RequestError("سفارش پیدا نشد.");
    if (order.paymentStatus === "unpaid") throw new RequestError("این سفارش پرداخت نشده است.");
    const refundable = order.totalRial - order.refundedRial;
    if (amountRial <= BigInt(0) || amountRial > refundable) throw new RequestError("مبلغ استرداد نامعتبر است.");
    await tx.refund.create({ data: { orderId, amountRial, method: opts.method, reason: opts.reason, authorName: opts.authorName } });
    const refunded = order.refundedRial + amountRial;
    const full = refunded >= order.totalRial;
    await tx.order.update({
      where: { id: orderId },
      data: { refundedRial: refunded, paymentStatus: full ? "refunded" : "partially_refunded", status: full ? "refunded" : undefined },
    });
    if (full) await restockOnce(orderId, tx);
    if (opts.toWallet && order.customerId) {
      await tx.customer.update({ where: { id: order.customerId }, data: { walletRial: { increment: amountRial } } });
      await tx.walletTransaction.create({ data: { customerId: order.customerId, amountRial, reason: `استرداد سفارش ${order.number}`, orderId } });
    }
    await addOrderNote(orderId, `استرداد ${amountRial / BigInt(10)} تومان (${opts.method}). ${opts.reason}`.trim(), { authorName: opts.authorName }, tx);
    return full;
  });
}

/** Cancels unpaid online orders older than the configured hold window. Cheap enough to run on page loads. */
let lastSweep = 0;
export async function sweepStalePendingOrders() {
  if (Date.now() - lastSweep < 5 * 60 * 1000) return;
  lastSweep = Date.now();
  const store = await getGroup("store");
  const minutes = Number(store.pendingHoldMinutes) || 60;
  const cutoff = new Date(Date.now() - minutes * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: { status: "pending", paymentStatus: "unpaid", createdAt: { lt: cutoff }, gateway: { in: ["zarinpal", "snapppay", "torobpay", "mock"] } },
    select: { id: true },
    take: 50,
  });
  for (const row of stale) {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({ where: { id: row.id, status: "pending", paymentStatus: "unpaid" }, data: { status: "cancelled" } });
      if (!claimed.count) return;
      await restockOnce(row.id, tx);
      await addOrderNote(row.id, "به دلیل پرداخت‌نشدن در مهلت مقرر لغو شد.", {}, tx);
    });
  }
}
