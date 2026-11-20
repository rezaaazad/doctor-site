"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/lib/actions";
import { cn } from "@/lib/utils";

const links = [
  ["/admin", "نمای کلی"],
  ["/admin/analytics", "آمارگیر"],
  ["/admin/landings", "صفحه‌های کلیدی"],
  ["/admin/content", "متن‌ها"],
  ["/admin/appearance", "ظاهر"],
  ["/admin/hero", "هیرو سه‌بعدی"],
  ["/admin/menu", "منو"],
  ["/admin/projects", "نمونه‌کارها"],
  ["/admin/services", "خدمات"],
  ["/admin/pricing", "تعرفه"],
  ["/admin/process", "روند و اعداد"],
  ["/admin/faq", "پرسش‌ها"],
  ["/admin/blog", "وبلاگ"],
  ["/admin/testimonials", "نظرات"],
  ["/admin/profile", "هویت و تماس"],
  ["/admin/messages", "پیام‌ها"],
  ["/admin/seo", "سئو"],
  ["/admin/media", "رسانه"],
  ["/admin/users", "مدیران"],
] as const;

export function AdminShell({
  user,
  unread,
  children,
}: {
  user: { name: string; email: string };
  unread: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-[100svh] bg-[#070708] text-white lg:grid lg:grid-cols-[16rem_1fr]" dir="rtl">
      <aside className={`${open ? "block" : "hidden"} border-b border-white/10 bg-black/40 lg:block lg:border-b-0 lg:border-e`}>
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/admin" className="font-black">دکتر سایت</Link>
          <span className="size-2 rounded-full bg-[var(--accent)]" />
        </div>
        <nav className="grid gap-1 px-3 pb-6">
          {links.map(([href, label]) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn("flex items-center justify-between rounded-xl px-3 py-2 text-sm", active ? "bg-[var(--accent)] text-black" : "text-white/70 hover:bg-white/5")}
              >
                <span>{label}</span>
                {href === "/admin/messages" && unread > 0 ? <span className={active ? "text-black" : "text-[var(--accent)]"}>{unread}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="grid gap-3 border-t border-white/10 px-5 py-5 text-xs text-white/50">
          <p>{user.name}</p>
          <p dir="ltr" className="text-left">{user.email}</p>
          <div className="flex gap-3 text-sm">
            <Link href="/" className="text-[var(--accent)]">مشاهده سایت</Link>
            <form action={logoutAction}>
              <button type="submit" className="text-white/70">خروج</button>
            </form>
          </div>
        </div>
      </aside>
      <div>
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 lg:hidden">
          <button type="button" className="rounded-full border border-white/15 px-3 py-1.5 text-sm" onClick={() => setOpen((value) => !value)}>
            {open ? "بستن" : "منوی مدیریت"}
          </button>
          <Link href="/" className="text-sm text-[var(--accent)]">سایت</Link>
        </div>
        <div className="px-4 py-6 lg:px-8 lg:py-8">{children}</div>
      </div>
    </div>
  );
}
