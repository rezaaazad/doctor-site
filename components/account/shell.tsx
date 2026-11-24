"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect,useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import {
  Bell,
  CreditCard,
  Download,
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Star,
  Ticket,
  User,
  Wallet,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAccountAction } from "@/lib/actions/account";

const NAV = [
  { href: "/account", label: "پیشخوان", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "سفارش‌ها", icon: Package },
  { href: "/account/downloads", label: "دانلودها", icon: Download },
  { href: "/account/installments", label: "اقساط", icon: CreditCard },
  { href: "/account/addresses", label: "آدرس‌ها", icon: MapPin },
  { href: "/account/details", label: "مشخصات حساب", icon: User },
  { href: "/account/wishlist", label: "علاقه‌مندی‌ها", icon: Heart },
  { href: "/account/reviews", label: "دیدگاه‌ها", icon: Star },
  { href: "/account/tickets", label: "تیکت پشتیبانی", icon: Ticket },
  { href: "/account/notifications", label: "اعلان‌ها", icon: Bell },
  { href: "/account/wallet", label: "کیف پول", icon: Wallet },
] as const;

export function AccountShell({
  children,
  customerName,
  mobile,
}: {
  children: React.ReactNode;
  customerName: string;
  mobile: string;
}) {
  const pathname = usePathname();
  const [open,setOpen]=useState(false);
  useEffect(()=>setOpen(false),[pathname]);
  const navigation = <ul className="grid gap-1">{NAV.map(item=>{const active="exact" in item&&item.exact?pathname===item.href:pathname.startsWith(item.href);const Icon=item.icon;return <li key={item.href}><Link href={item.href} aria-current={active?"page":undefined} onClick={()=>setOpen(false)} className={cn("flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold",active?"bg-primary-soft text-primary":"text-muted hover:bg-sunken hover:text-fg")}><Icon className="size-5 shrink-0" aria-hidden/>{item.label}</Link></li>})}</ul>;
  return (
    <div className="wrap pad pb-24">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker">حساب کاربری</p>
          <h1 className="mt-2 font-display text-[1.75rem] font-extrabold">{customerName || "مشتری گرامی"}</h1>
          <p className="mt-1 text-[0.85rem] text-muted" dir="ltr">
            {mobile}
          </p>
        </div>
        <form action={logoutAccountAction}>
          <button type="submit" className="btn btn-ghost btn-sm text-muted">
            <LogOut className="size-4" aria-hidden />
            خروج
          </button>
        </form>
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <button type="button" className="btn btn-outline lg:hidden" onClick={()=>setOpen(true)} aria-expanded={open}><Menu className="size-5"/> منوی حساب</button>
        <Drawer open={open} onOpenChange={setOpen} title="منوی حساب" className="p-4"><button type="button" className="btn btn-outline mb-4" onClick={()=>setOpen(false)}>بستن منو</button><nav aria-label="منوی حساب">{navigation}</nav></Drawer>
        <nav className="card hidden h-fit p-2 lg:sticky lg:top-24 lg:block" aria-label="منوی حساب">{navigation}</nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
