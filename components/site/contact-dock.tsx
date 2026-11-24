"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Headset, Home, MessageCircle, Phone, Send, ShoppingBag, Store, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/money";
import { useCart } from "@/components/store/cart";
import type { ContactLinks } from "@/lib/contact";

export function MobileBar({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  const { count, setOpen, ready } = useCart();
  if (!enabled || pathname.startsWith("/checkout")) return null;
  const item = "flex flex-1 flex-col items-center justify-center gap-1 text-[0.66rem] font-bold";
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <>
      <div className="h-[calc(64px+env(safe-area-inset-bottom))] lg:hidden" aria-hidden />
      <nav
        aria-label="دسترسی سریع"
        className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface/92 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-20px_rgba(11,21,48,0.4)] backdrop-blur-xl lg:hidden"
      >
        <div className="flex h-16 items-stretch">
          <Link href="/" className={cn(item, active("/") ? "text-primary" : "text-muted")}>
            <Home className="size-[21px]" aria-hidden /> خانه
          </Link>
          <button type="button" onClick={() => window.dispatchEvent(new Event("store:categories"))} className={cn(item, active("/store") ? "text-primary" : "text-muted")}><Store aria-hidden size={21}/>دسته‌ها</button>
          <button type="button" onClick={() => setOpen(true)} className={cn(item, "relative text-muted")}>
            <span className="relative">
              <ShoppingBag className="size-[21px]" aria-hidden />
              {ready && count > 0 ? (
                <span className="num absolute -top-1.5 -left-2.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-primary px-1 text-[0.62rem] text-white">{formatNumber(count)}</span>
              ) : null}
            </span>
            سبد خرید
          </button>
          <Link href="/account" className={cn(item, active("/account") ? "text-primary" : "text-muted")}>
            <User className="size-[21px]" aria-hidden /> حساب من
          </Link>
        </div>
      </nav>
    </>
  );
}

export function FloatingContact({ links, enabled }: { links: ContactLinks; enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (!enabled || pathname.startsWith("/checkout")) return null;
  const items = [
    links.whatsapp ? { href: links.whatsapp, label: "واتساپ", icon: <MessageCircle className="size-5" aria-hidden />, cls: "bg-[#128C4A]" } : null,
    links.telegram ? { href: links.telegram, label: "تلگرام", icon: <Send className="size-5" aria-hidden />, cls: "bg-[#1f7fc4]" } : null,
    links.phoneHref ? { href: links.phoneHref, label: links.phone, icon: <Phone className="size-5" aria-hidden />, cls: "bg-ink" } : null,
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode; cls: string }[];
  if (!items.length) return null;
  return (
    <div className="fixed bottom-6 left-6 z-50 hidden flex-col items-start gap-2 lg:flex">
      {open
        ? items.map((item, index) => (
            <a
              key={item.href}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel="noopener"
              className={cn("anim-rise flex items-center gap-2.5 rounded-full py-2.5 pr-3 pl-4 text-[0.88rem] font-bold text-white shadow-2", item.cls)}
              style={{ ["--d" as string]: items.length - index }}
            >
              {item.icon}
              <span className={item.href.startsWith("tel:") ? "ltr num" : ""}>{item.label}</span>
            </a>
          ))
        : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "بستن راه‌های تماس" : "تماس با ما"}
        className="group relative grid size-14 place-items-center rounded-full bg-primary text-white shadow-[0_16px_36px_-12px_var(--primary)] transition-transform hover:scale-105"
      >
        {open ? <X className="size-6" aria-hidden /> : <Headset className="size-6" aria-hidden />}
        {!open ? <span className="absolute top-0.5 right-0.5 size-3 rounded-full bg-success ring-2 ring-white" /> : null}
      </button>
    </div>
  );
}
