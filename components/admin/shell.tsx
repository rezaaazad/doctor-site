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
import { Drawer } from "@/components/ui/drawer";

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
  const [collapsed,setCollapsed]=useState(false);
  const [query,setQuery]=useState("");
  const matches=nav.flatMap(g=>g.items).filter(i=>i.label.includes(query.trim())).slice(0,8);
  const alerts=nav.flatMap(g=>g.items).filter(i=>i.badge&&!!badges[i.badge]);
  const all = nav.flatMap((g) => g.items.map((i) => i.href));
  useEffect(() => setOpen(false), [pathname]);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center justify-between gap-3 px-5">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-white font-display text-[1rem] font-black text-ink">{siteName.slice(0, 1) || "د"}</span>
          <span className={cn("leading-tight",collapsed&&"lg:hidden")}>
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
            {group.label ? <p className={cn("mb-1.5 px-3 text-[0.68rem] font-bold tracking-wide text-white/65",collapsed&&"lg:hidden")}>{group.label}</p> : null}
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
                      title={item.label}
                      className={cn(
                        "group flex h-10 items-center gap-3 rounded-xl px-3 text-[0.86rem] font-medium transition-colors",
                        active ? "bg-white text-ink shadow-[0_6px_20px_-8px_rgba(0,0,0,0.5)]" : "text-white/70 hover:bg-white/[0.07] hover:text-white",
                      )}
                    >
                      <Icon className={cn("size-[18px] shrink-0", active ? "text-primary" : "text-white/45 group-hover:text-white/80")} />
                      <span className={cn("flex-1 truncate",collapsed&&"lg:hidden")}>{item.label}</span>
                      {count > 0 ? (
                        <span className={cn("num min-w-5 rounded-full bg-primary px-1.5 text-center text-[0.68rem] leading-5 font-bold text-white",collapsed&&"lg:hidden")}>
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
          <span className={cn("min-w-0 flex-1 leading-tight",collapsed&&"lg:hidden")}>
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
    <div className={cn("admin min-h-[100svh] bg-bg text-fg lg:grid",collapsed?"lg:grid-cols-[76px_minmax(0,1fr)]":"lg:grid-cols-[264px_minmax(0,1fr)]")}>
      <aside className="sticky top-0 hidden h-[100svh] bg-ink lg:block">{sidebar}</aside>
      <Drawer open={open} onOpenChange={setOpen} title="منوی مدیریت" className="!bg-ink">{sidebar}</Drawer>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur-md md:px-6">
          <button type="button" className="grid size-10 place-items-center rounded-xl border border-line bg-white lg:hidden" onClick={() => setOpen(true)} aria-label="باز کردن منو">
            <Menu className="size-5" />
          </button>
          <button type="button" className="btn btn-ghost btn-icon hidden lg:inline-flex" onClick={()=>setCollapsed(v=>!v)} aria-label={collapsed?"گسترش منو":"جمع کردن منو"} aria-expanded={!collapsed}><Menu className="size-5"/></button>
          <form action="/admin/search" className="relative hidden max-w-md flex-1 md:block" onSubmit={e=>{if(matches.length&&query.trim()){e.preventDefault();const link=e.currentTarget.querySelector<HTMLAnchorElement>("[data-search-match]");link?.click();}}}>
            <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" />
            <input name="q" value={query} onChange={e=>setQuery(e.target.value)} aria-label="جستجوی مدیریت" placeholder="جستجوی بخش‌های مدیریت…" className="input !min-h-10 !rounded-xl !bg-sunken !pr-9 !text-[0.88rem]" />
            {query.trim()&&matches.length>0&&<div className="card-raised absolute inset-x-0 top-full z-40 mt-2 p-2">{matches.map(i=><Link data-search-match key={i.href} href={i.href} onClick={()=>setQuery("")} className="block rounded-lg p-2 text-sm hover:bg-sunken">{i.label}</Link>)}</div>}
          </form>
          <div className="flex-1 md:hidden" />
          <details className="relative"><summary className="btn btn-outline btn-sm list-none" aria-label="اعلان‌های مدیریت"><Inbox className="size-4"/><span className="num">{alerts.reduce((n,i)=>n+(i.badge?badges[i.badge]??0:0),0).toLocaleString("fa-IR")}</span></summary><div className="card-raised absolute left-0 top-full z-50 mt-2 w-56 p-3">{alerts.length?alerts.map(i=><Link key={i.href} href={i.href} className="flex justify-between p-2 text-sm hover:bg-sunken">{i.label}<b>{i.badge&&badges[i.badge]?.toLocaleString("fa-IR")}</b></Link>):<p className="text-sm text-muted">اعلان جدیدی ندارید.</p>}</div></details>
          <span className="hidden text-sm font-semibold text-muted sm:block">{user.name}</span>
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
