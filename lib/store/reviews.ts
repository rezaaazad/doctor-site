import { prisma } from "@/lib/db";

/** Recomputes ratingAvg/ratingCount on a product from its approved top-level reviews. */
export async function recomputeProductRating(productId: string) {
  const agg = await prisma.comment.aggregate({
    where: { targetType: "product", targetId: productId, status: "approved", parentId: null, rating: { not: null } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.storeProduct
    .update({ where: { id: productId }, data: { ratingAvg: Math.round((agg._avg.rating ?? 0) * 10) / 10, ratingCount: agg._count._all } })
    .catch(() => undefined);
}

/** True when the customer has a paid order containing the product (marks reviews as verified buyer). */
export async function hasPurchased(customerId: string, productId: string) {
  const item = await prisma.orderItem.findFirst({
    where: { productId, order: { customerId, paymentStatus: { in: ["paid", "partially_refunded"] } } },
    select: { id: true },
  });
  return Boolean(item);
}
