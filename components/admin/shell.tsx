"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BarChart3,
  Boxes,
  Brush,
  ExternalLink,
  FileText,
  FolderTree,
  Gauge,
  Images,
  Inbox,
  LayoutTemplate,
  Library,
  LifeBuoy,
  ListTree,
  LogOut,
  Mail,
  Menu,
  MessagesSquare,
  Package,
  PanelsTopLeft,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Tags,
  TicketPercent,
  Truck,
  UserCog,
  Users,
  Wallet,
  Wrench,
  X,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AdminNavGroup } from "@/lib/admin/nav";
import { logoutStaffAction } from "@/lib/actions/admin/session";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: Gauge,
  orders: ReceiptText,
  products: Package,
  categories: FolderTree,
  attributes: SlidersHorizontal,
  customers: Users,
  coupons: TicketPercent,
  shipping: Truck,
  reports: BarChart3,
  leads: Inbox,
  tickets: LifeBuoy,
  comments: MessagesSquare,
  newsletter: Mail,
  posts: FileText,
  pages: LayoutTemplate,
  terms: Tags,
  media: Images,
  services: Briefcase,
  projects: Sparkles,
  library: Library,
  sections: PanelsTopLeft,
  menus: ListTree,
  theme: Brush,
  seo: Search,
  settings: Settings,
  payments: Wallet,
  users: UserCog,
  activity: Activity,
  tools: Wrench,
  store: ShoppingBag,
  boxes: Boxes,
};

export type ShellProps = {
  user: { name: string; email: string; roleLabel: string };
  nav: AdminNavGroup[];
  badges: Partial<Record<"orders" | "leads" | "comments" | "tickets", number>>;
  siteName: string;
  children: React.ReactNode;
};

function isActive(pathname: string, href: string, all: string[]) {
  if (href === "/admin") return pathname === "/admin";
  if (!(pathname === href || pathname.startsWith(`${href}/`))) return false;
  // prefer the most specific match (e.g. /admin/settings/theme over /admin/settings)
  return !all.some((other) => other !== href && other.startsWith(href) && (pathname === other || pathname.startsWith(`${other}/`)));
}

export function AdminShell({ user, nav, badges, siteName, children }: ShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const all = nav.flatMap((g) => g.items.map((i) => i.href));
  useEffect(() => setOpen(false), [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 px-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-white font-display text-[1rem] font-black text-ink">{siteName.slice(0, 1) || "د"}</span>
          <span className="leading-tight">
            <b className="block text-[0.95rem] text-white">{siteName}</b>
            <small className="text-[0.7rem] text-white/50">پنل مدیریت</small>
          </span>
        </Link>
        <button type="button" className="grid size-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="بستن منو">
          <X className="size-5" />
        </button>
      </div>
      <nav className="admin-scroll flex-1 overflow-y-auto px-3 pb-6" aria-label="منوی مدیریت">
        {nav.map((group, gi) => (
          <div key={gi} className={cn(gi > 0 && "mt-5")}>
            {group.label ? <p className="mb-1.5 px-3 text-[0.68rem] font-bold tracking-wide text-white/35">{group.label}</p> : null}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon] ?? Boxes;
                const active = isActive(pathname, item.href, all);
                const count = item.badge ? badges[item.badge] ?? 0 : 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex h-10 items-center gap-3 rounded-xl px-3 text-[0.86rem] font-medium transition-colors",
                        active ? "bg-white text-ink shadow-[0_6px_20px_-8px_rgba(0,0,0,0.5)]" : "text-white/70 hover:bg-white/[0.07] hover:text-white",
                      )}
                    >
                      <Icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-white/45 group-hover:text-white/80")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {count > 0 ? (
                        <span className={cn("num min-w-5 rounded-full px-1.5 text-center text-[0.68rem] leading-5 font-bold", active ? "bg-action text-white" : "bg-action/90 text-white")}>
                          {count > 99 ? "۹۹+" : count.toLocaleString("fa-IR")}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary font-bold text-white">{user.name.slice(0, 1)}</span>
          <span className="min-w-0 flex-1 leading-tight">
            <b className="block truncate text-[0.85rem] text-white">{user.name}</b>
            <small className="block truncate text-[0.7rem] text-white/45">{user.roleLabel}</small>
          </span>
          <form action={logoutStaffAction}>
            <button type="submit" className="grid size-9 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white" aria-label="خروج" title="خروج">
              <LogOut className="size-[18px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="admin min-h-[100svh] bg-[#F3F4F7] text-fg lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-[100svh] bg-ink lg:block">{sidebar}</aside>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setOpen(false)} aria-label="بستن" />
          <aside className="anim-slide-in absolute inset-y-0 right-0 w-[min(300px,86vw)] bg-ink shadow-3">{sidebar}</aside>
        </div>
      ) : null}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur-md md:px-6">
          <button type="button" className="grid size-10 place-items-center rounded-xl border border-line bg-white lg:hidden" onClick={() => setOpen(true)} aria-label="باز کردن منو">
            <Menu className="size-5" />
          </button>
          <form action="/admin/search" className="relative hidden max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
            <input name="q" placeholder="جستجوی سفارش، محصول، مشتری…" className="input !min-h-10 !rounded-xl !bg-sunken !pr-9 !text-[0.88rem]" />
          </form>
          <div className="flex-1 md:hidden" />
          <Link href="/" target="_blank" className="btn btn-outline btn-sm">
            <ExternalLink className="size-4" />
            <span className="hidden sm:inline">مشاهده سایت</span>
          </Link>
        </header>
        <main className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
