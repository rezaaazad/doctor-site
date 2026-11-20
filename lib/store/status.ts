export const ORDER_STATUSES = {
  pending: { label: "در انتظار پرداخت", tone: "warn" },
  on_hold: { label: "در انتظار بررسی", tone: "warn" },
  processing: { label: "در حال پردازش", tone: "info" },
  shipped: { label: "ارسال شده", tone: "info" },
  delivered: { label: "تحویل شده", tone: "success" },
  completed: { label: "تکمیل شده", tone: "success" },
  cancelled: { label: "لغو شده", tone: "muted" },
  failed: { label: "ناموفق", tone: "danger" },
  refunded: { label: "مسترد شده", tone: "muted" },
} as const;

export type OrderStatus = keyof typeof ORDER_STATUSES;

export const PAYMENT_STATUSES = {
  unpaid: "پرداخت نشده",
  paid: "پرداخت شده",
  partially_refunded: "بخشی مسترد شده",
  refunded: "مسترد شده",
} as const;

export const TXN_STATUSES: Record<string, string> = {
  initiated: "ایجاد شده",
  redirected: "به درگاه رفت",
  verified: "تأیید شده",
  settled: "تسویه شده",
  failed: "ناموفق",
  cancelled: "لغو شده",
  reverted: "برگشت خورده",
  refunded: "مسترد شده",
};

export const GATEWAY_LABELS: Record<string, string> = {
  zarinpal: "زرین‌پال",
  snapppay: "اسنپ‌پی",
  torobpay: "ترب‌پی",
  bank: "کارت‌به‌کارت",
  cod: "پرداخت در محل",
  mock: "درگاه آزمایشی",
  wallet: "کیف پول",
  free: "رایگان",
};

export function statusLabel(status: string) {
  return ORDER_STATUSES[status as OrderStatus]?.label ?? status;
}

export function statusTone(status: string) {
  return ORDER_STATUSES[status as OrderStatus]?.tone ?? "muted";
}

export const PAID_STATUSES: OrderStatus[] = ["processing", "shipped", "delivered", "completed"];

export function isPaidStatus(status: string) {
  return (PAID_STATUSES as string[]).includes(status);
}

export const TRACKING_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "ثبت سفارش" },
  { status: "processing", label: "پرداخت و پردازش" },
  { status: "shipped", label: "ارسال" },
  { status: "delivered", label: "تحویل" },
];
