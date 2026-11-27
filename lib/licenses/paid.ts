import type { Order, OrderItem, Prisma } from "@prisma/client";
import { nextExpiry } from "./domain";

// Called inside the payment transaction after its unpaid -> paid compare-and-set.
export async function enqueuePaidLicenses(
  tx: Prisma.TransactionClient,
  order: Order & { items: OrderItem[] },
  paidAt: Date,
) {
  const purchases = order.items
    .filter((i) => i.licenseTier)
    .sort((a, b) => a.renewalId.localeCompare(b.renewalId));
  for (const item of purchases) {
    if (!order.customerId || !item.licenseProductId || !item.licenseVariantId)
      throw new Error("مالک یا محصول لایسنس مشخص نیست.");
    let expiresAt = nextExpiry(paidAt, item.licenseDays);
    let licenseId = item.renewalId;
    if (licenseId) {
      await tx.$queryRaw`SELECT id FROM "PluginLicense" WHERE id=${licenseId} FOR UPDATE`;
      const existing = await tx.pluginLicense.findUniqueOrThrow({
        where: {
          id: licenseId,
          customerId: order.customerId,
          host: item.licenseHost,
          tier: item.licenseTier,
        },
      });
      expiresAt = nextExpiry(paidAt, item.licenseDays, existing.expiresAt);
      await tx.pluginLicense.update({
        where: { id: licenseId },
        data: {
          expiresAt,
          version: item.licenseVersion,
          state: "pending",
          attempts: 0,
          lease: "",
          nextAttempt: paidAt,
          error: "",
        },
      });
    } else {
      const license = await tx.pluginLicense.create({
        data: {
          id: item.id,
          productId: item.licenseProductId,
          variantId: item.licenseVariantId,
          customerId: order.customerId,
          title: item.title,
          host: item.licenseHost,
          tier: item.licenseTier,
          version: item.licenseVersion,
          startsAt: paidAt,
          expiresAt,
        },
      });
      licenseId = license.id;
    }
    await tx.licensePurchase.create({
      data: { itemId: item.id, licenseId, expiresAt, paidAt },
    });
    await tx.licenseEvent.create({
      data: {
        licenseId,
        body: item.renewalId ? "تمدید پرداخت شد" : "خرید اولیه پرداخت شد",
      },
    });
  }
}
