export const CAPABILITIES = {
  view_dashboard: "مشاهده داشبورد",
  manage_content: "مدیریت محتوا، صفحه‌ها و وبلاگ",
  publish_content: "انتشار محتوا",
  moderate_comments: "مدیریت نظرات",
  manage_media: "کتابخانه رسانه",
  manage_store: "محصولات، دسته‌ها و تنظیمات فروشگاه",
  manage_orders: "مدیریت سفارش‌ها",
  refund_orders: "بازپرداخت و لغو تراکنش",
  manage_customers: "مشتری‌ها و کیف پول",
  manage_coupons: "کدهای تخفیف",
  view_reports: "گزارش‌ها و آمار",
  manage_leads: "لیدها و پیام‌ها",
  manage_tickets: "تیکت‌های پشتیبانی",
  manage_appearance: "پوسته، منو و بخش‌های صفحه اصلی",
  manage_seo: "سئو و ریدایرکت‌ها",
  manage_settings: "تنظیمات عمومی",
  manage_payments: "درگاه‌های پرداخت",
  manage_integrations: "اتصال‌ها و اطلاع‌رسانی",
  manage_users: "کاربران و نقش‌ها",
  view_activity: "گزارش فعالیت",
  manage_backups: "پشتیبان‌گیری و خروجی",
} as const;

export type Capability = keyof typeof CAPABILITIES;

const ALL = Object.keys(CAPABILITIES) as Capability[];

export const ROLES: Record<string, { label: string; description: string; caps: Capability[] }> = {
  admin: { label: "مدیر کل", description: "دسترسی کامل به همه بخش‌ها.", caps: ALL },
  shop_manager: {
    label: "مدیر فروشگاه",
    description: "محصول، سفارش، مشتری، تخفیف، گزارش و پشتیبانی.",
    caps: [
      "view_dashboard",
      "manage_store",
      "manage_orders",
      "refund_orders",
      "manage_customers",
      "manage_coupons",
      "view_reports",
      "moderate_comments",
      "manage_media",
      "manage_tickets",
      "manage_leads",
    ],
  },
  editor: {
    label: "ویراستار",
    description: "نوشته، برگه، رسانه، نظرات و بخش‌های صفحه.",
    caps: ["view_dashboard", "manage_content", "publish_content", "moderate_comments", "manage_media", "manage_appearance", "manage_seo"],
  },
  support: {
    label: "پشتیبان",
    description: "تیکت، لید، مشاهده سفارش و مشتری.",
    caps: ["view_dashboard", "manage_tickets", "manage_leads", "manage_orders", "moderate_comments"],
  },
};

export function roleLabel(role: string) {
  return ROLES[role]?.label ?? role;
}

export function can(role: string | undefined | null, cap: Capability) {
  if (!role) return false;
  return ROLES[role]?.caps.includes(cap) ?? false;
}
