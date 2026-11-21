import type { Capability } from "@/lib/roles";

export type AdminNavItem = { href: string; label: string; icon: string; cap: Capability; badge?: "orders" | "leads" | "comments" | "tickets" };
export type AdminNavGroup = { label: string; items: AdminNavItem[] };

// icon names map to lucide icons in components/admin/shell.tsx
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "",
    items: [{ href: "/admin", label: "پیشخوان", icon: "dashboard", cap: "view_dashboard" }],
  },
  {
    label: "فروشگاه",
    items: [
      { href: "/admin/orders", label: "سفارش‌ها", icon: "orders", cap: "manage_orders", badge: "orders" },
      { href: "/admin/products", label: "محصولات", icon: "products", cap: "manage_store" },
      { href: "/admin/store/categories", label: "دسته‌بندی‌ها", icon: "categories", cap: "manage_store" },
      { href: "/admin/store/attributes", label: "ویژگی‌ها", icon: "attributes", cap: "manage_store" },
      { href: "/admin/customers", label: "مشتری‌ها", icon: "customers", cap: "manage_customers" },
      { href: "/admin/coupons", label: "کدهای تخفیف", icon: "coupons", cap: "manage_coupons" },
      { href: "/admin/store/shipping", label: "حمل‌ونقل و مالیات", icon: "shipping", cap: "manage_store" },
      { href: "/admin/reports", label: "گزارش‌ها", icon: "reports", cap: "view_reports" },
    ],
  },
  {
    label: "ارتباط با مشتری",
    items: [
      { href: "/admin/leads", label: "درخواست‌ها و لیدها", icon: "leads", cap: "manage_leads", badge: "leads" },
      { href: "/admin/tickets", label: "تیکت‌ها", icon: "tickets", cap: "manage_tickets", badge: "tickets" },
      { href: "/admin/comments", label: "نظرات", icon: "comments", cap: "moderate_comments", badge: "comments" },
      { href: "/admin/newsletter", label: "خبرنامه", icon: "newsletter", cap: "manage_leads" },
    ],
  },
  {
    label: "محتوا",
    items: [
      { href: "/admin/posts", label: "نوشته‌ها", icon: "posts", cap: "manage_content" },
      { href: "/admin/pages", label: "برگه‌ها و لندینگ‌ها", icon: "pages", cap: "manage_content" },
      { href: "/admin/terms", label: "دسته و برچسب نوشته", icon: "terms", cap: "manage_content" },
      { href: "/admin/media", label: "رسانه", icon: "media", cap: "manage_media" },
      { href: "/admin/services", label: "خدمات", icon: "services", cap: "manage_content" },
      { href: "/admin/projects", label: "نمونه‌کارها", icon: "projects", cap: "manage_content" },
      { href: "/admin/library", label: "تعرفه، نظرات، پرسش‌ها…", icon: "library", cap: "manage_content" },
    ],
  },
  {
    label: "نمایش",
    items: [
      { href: "/admin/homepage", label: "بخش‌های صفحه اصلی", icon: "sections", cap: "manage_appearance" },
      { href: "/admin/menus", label: "منوها", icon: "menus", cap: "manage_appearance" },
      { href: "/admin/settings/theme", label: "پوسته و رنگ", icon: "theme", cap: "manage_settings" },
      { href: "/admin/seo", label: "سئو و ریدایرکت", icon: "seo", cap: "manage_seo" },
    ],
  },
  {
    label: "سیستم",
    items: [
      { href: "/admin/settings", label: "تنظیمات", icon: "settings", cap: "manage_settings" },
      { href: "/admin/settings/pay_zarinpal", label: "درگاه‌ها و اتصال‌ها", icon: "payments", cap: "manage_payments" },
      { href: "/admin/users", label: "کاربران و نقش‌ها", icon: "users", cap: "manage_users" },
      { href: "/admin/activity", label: "گزارش فعالیت", icon: "activity", cap: "view_activity" },
      { href: "/admin/tools", label: "پشتیبان و ابزارها", icon: "tools", cap: "manage_backups" },
    ],
  },
];
