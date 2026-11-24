"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Headset, Home, MessageCircle, Phone, Send, ShoppingBag, Store, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/money";
import { useCart } from "@/components/store/cart";
import type { ContactLinks } from "@/lib/contact";

function ContactSheet({ links, onClose }: { links: ContactLinks; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[65]" role="dialog" aria-modal="true" aria-label="راه‌های تماس">
      <button type="button" className="absolute inset-0 bg-ink/45" style={{ animation: "fade .2s both" }} onClick={onClose} aria-label="بستن" />
      <div className="absolute inset-x-0 bottom-0 rounded-t-[26px] bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-3" style={{ animation: "sheet-up .3s var(--ease-out) both" }}>
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-line" />
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-display text-lg font-extrabold">سؤال دارید؟ همین الان بپرسید</p>
            <p className="flex items-center gap-2 text-[0.82rem] text-muted">
              <span className="live-dot" /> پشتیبانی آنلاین است
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} aria-label="بستن">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="grid gap-2">
          {links.phoneHref ? (
            <a href={links.phoneHref} className="btn btn-ink btn-lg btn-block justify-between">
              <span className="flex items-center gap-2">
                <Phone className="size-5" aria-hidden /> تماس تلفنی
              </span>
              <span className="ltr num text-white/75">{links.phone}</span>
            </a>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            {links.whatsapp ? (
              <a href={links.whatsapp} target="_blank" rel="noopener" className="btn btn-outline btn-lg">
                <MessageCircle className="size-5 text-success" aria-hidden /> واتساپ
              </a>
            ) : null}
            {links.telegram ? (
              <a href={links.telegram} target="_blank" rel="noopener" className="btn btn-outline btn-lg">
                <Send className="size-5 text-primary" aria-hidden /> تلگرام
              </a>
            ) : null}
          </div>
          <Link href="/contact" onClick={onClose} className="btn btn-ghost btn-block">
            فرم درخواست مشاوره
          </Link>
        </div>
      </div>
    </div>
  );
}

export function MobileBar({ links, enabled }: { links: ContactLinks; enabled: boolean }) {
  const pathname = usePathname();
  const { count, setOpen, ready } = useCart();
  const [contact, setContact] = useState(false);
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
          <Link href="/store" className={cn(item, active("/store") ? "text-primary" : "text-muted")}>
            <Store className="size-[21px]" aria-hidden /> فروشگاه
          </Link>
          <button type="button" onClick={() => setContact(true)} className={cn(item, "text-fg")}>
            <span className="-mt-6 grid size-[52px] place-items-center rounded-full bg-primary text-white shadow-[0_10px_24px_-8px_var(--primary)] ring-4 ring-surface">
              <Headset className="size-6" aria-hidden />
            </span>
            مشاوره
          </button>
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
      {contact ? <ContactSheet links={links} onClose={() => setContact(false)} /> : null}
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
