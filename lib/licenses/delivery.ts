import type { Prisma } from "@prisma/client";
export const paidPurchases = {
  every: {
    item: {
      order: {
        paymentStatus: "paid",
        status: { notIn: ["cancelled", "refunded", "failed"] },
      },
    },
  },
  some: {},
} satisfies Prisma.LicensePurchaseListRelationFilter;
export const labels: Record<string, string> = {
  pending: "در حال آماده‌سازی",
  building: "در حال آماده‌سازی",
  ready: "آماده دانلود",
  failed: "پرداخت انجام شده؛ تحویل در حال پیگیری است",
};
