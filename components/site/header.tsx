"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, LayoutGrid, Menu, Phone, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/money";
import { useCart } from "@/components/store/cart";

export type NavLink = { id: string; label: string; href: string; highlight?: boolean; newTab?: boolean; children?: NavLink[] };
export type NavCategory = { slug: string; name: string; count: number; icon: string; description: string };

export type HeaderProps = {
  siteName: string;
  logoUrl: string;
  links: NavLink[];
  categories: NavCategory[];
  phone: string;
  phoneHref: string;
  showPhone: boolean;
  cta: { label: string; href: string };
  signedIn: boolean;
};

export function Logo({ siteName, logoUrl, light = false }: { siteName: string; logoUrl: string; light?: boolean }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={siteName} className="h-9 w-auto md:h-10" />;
  }
  return (
    <span className="flex items-center gap-2.5">
      <span className={cn("relative grid size-9 place-items-center overflow-hidden rounded-[11px] md:size-10", light ? "bg-white text-ink" : "bg-ink text-white")}>
        <svg viewBox="0 0 32 32" className="size-5 md:size-6" fill="none" aria-hidden>
          <path d="M9 7h7.5a9 9 0 0 1 0 18H9z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="16.5" cy="16" r="2.6" fill="var(--action)" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <b className={cn("font-display text-[1.06rem] font-black tracking-tight md:text-[1.15rem]", light && "text-white")}>{siteName}</b>
        <small className={cn("mt-1 text-[0.62rem] font-semibold", light ? "text-white/60" : "text-muted")}>فروشگاه و استودیو دیجیتال</small>
      </span>
    </span>
  );
}

function CartButton() {
  const { count, setOpen, ready } = useCart();
  return (
    <button type="button" onClick={() => setOpen(true)} className="btn btn-ghost btn-icon relative" aria-label={`سبد خرید، ${count} کالا`}>
      <ShoppingBag className="size-[21px]" aria-hidden />
      {ready && count > 0 ? (
        <span key={count} className="anim-pop num absolute -top-0.5 -left-0.5 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-action px-1 text-[0.68rem] font-black text-white ring-2 ring-surface">
          {formatNumber(count)}
        </span>
      ) : null}
    </button>
  );
}

function SearchBox({ className, autoFocus, onDone }: { className?: string; autoFocus?: boolean; onDone?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      role="search"
      action="/store"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(q.trim() ? `/store?q=${encodeURIComponent(q.trim())}` : "/store");
        onDone?.();
      }}
      className={cn("relative", className)}
    >
      <Search className="pointer-events-none absolute top-1/2 right-3.5 size-[18px] -translate-y-1/2 text-muted" aria-hidden />
      <input
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        placeholder="جست‌وجوی محصول، دسته یا برند…"
        aria-label="جست‌وجو در فروشگاه"
        className="input !min-h-[44px] !rounded-full !bg-sunken !pr-10 !shadow-none hover:!bg-surface focus:!bg-surface"
      />
    </form>
  );
}

export function SiteHeader(props: HeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const catsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setCatsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  useEffect(() => {
    if (!catsOpen) return;
    const close = (event: MouseEvent) => {
      if (catsRef.current && !catsRef.current.contains(event.target as Node)) setCatsOpen(false);
    };
    const esc = (event: KeyboardEvent) => event.key === "Escape" && setCatsOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [catsOpen]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0].split("?")[0]));

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300",
          scrolled ? "border-line bg-surface/85 shadow-[0_8px_30px_-18px_rgba(11,21,48,0.35)] backdrop-blur-xl" : "border-transparent bg-bg",
        )}
      >
        <div className="container-x flex h-[var(--header-h)] items-center gap-3 lg:gap-6">
          <button type="button" className="btn btn-ghost btn-icon -mr-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="باز کردن منو" aria-expanded={menuOpen}>
            <Menu className="size-[22px]" aria-hidden />
          </button>
          <Link href="/" className="shrink-0" aria-label={`${props.siteName} — صفحه اصلی`}>
            <Logo siteName={props.siteName} logoUrl={props.logoUrl} />
          </Link>

          <div ref={catsRef} className="relative hidden lg:block">
            <button
              type="button"
              onClick={() => setCatsOpen((v) => !v)}
              aria-expanded={catsOpen}
              className={cn("btn btn-sm gap-1.5 !px-3.5", catsOpen ? "btn-ink" : "btn-outline")}
            >
              <LayoutGrid className="size-4" aria-hidden />
              دسته‌بندی‌ها
              <ChevronDown className={cn("size-4 transition-transform", catsOpen && "rotate-180")} aria-hidden />
            </button>
            {catsOpen ? (
              <div className="card-raised anim-rise absolute top-[calc(100%+10px)] right-0 z-50 w-[560px] p-3">
                <div className="grid grid-cols-2 gap-1">
                  {props.categories.map((cat) => (
                    <Link key={cat.slug} href={`/store/category/${cat.slug}`} className="group flex items-start gap-3 rounded-xl p-3 hover:bg-sunken">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft font-display text-sm font-black text-primary">
                        {cat.icon || cat.name.slice(0, 1)}
                      </span>
                      <span className="min-w-0">
                        <b className="block text-[0.92rem] group-hover:text-primary">{cat.name}</b>
                        <small className="line-clamp-1 text-[0.75rem] text-muted">{cat.description || `${formatNumber(cat.count)} محصول`}</small>
                      </span>
                    </Link>
                  ))}
                </div>
                <Link href="/store" className="mt-2 flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-[0.88rem] font-bold text-white">
                  همه محصولات فروشگاه
                  <span aria-hidden>←</span>
                </Link>
              </div>
            ) : null}
          </div>

          <SearchBox className="hidden max-w-md flex-1 md:block" />

          <nav aria-label="منوی اصلی" className="hidden items-center gap-0.5 xl:flex">
            {props.links.slice(0, 6).map((link) => (
              <Link
                key={link.id}
                href={link.href}
                target={link.newTab ? "_blank" : undefined}
                className={cn(
                  "rounded-full px-3 py-2 text-[0.9rem] font-semibold transition-colors hover:bg-sunken",
                  isActive(link.href) ? "text-primary" : "text-fg/80",
                  link.highlight && "text-action",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mr-auto flex items-center gap-0.5 md:gap-1">
            <button type="button" className="btn btn-ghost btn-icon md:hidden" onClick={() => setSearchOpen((v) => !v)} aria-label="جست‌وجو" aria-expanded={searchOpen}>
              <Search className="size-[21px]" aria-hidden />
            </button>
            {props.showPhone && props.phoneHref ? (
              <a href={props.phoneHref} className="hidden items-center gap-2 rounded-full px-3 py-2 text-[0.88rem] font-bold hover:bg-sunken 2xl:flex">
                <Phone className="size-4 text-success" aria-hidden />
                <span className="ltr num">{props.phone}</span>
              </a>
            ) : null}
            <Link href="/account/wishlist" className="btn btn-ghost btn-icon hidden md:inline-flex" aria-label="علاقه‌مندی‌ها">
              <Heart className="size-[21px]" aria-hidden />
            </Link>
            <Link href={props.signedIn ? "/account" : "/account/login"} className="btn btn-ghost btn-icon" aria-label={props.signedIn ? "حساب کاربری" : "ورود یا ثبت‌نام"}>
              <User className="size-[21px]" aria-hidden />
            </Link>
            <CartButton />
            {props.cta.label ? (
              <Link href={props.cta.href} className="btn btn-action btn-sm mr-1 hidden lg:inline-flex">
                {props.cta.label}
              </Link>
            ) : null}
          </div>
        </div>
        {searchOpen ? (
          <div className="container-x anim-rise pb-3 md:hidden">
            <SearchBox autoFocus onDone={() => setSearchOpen(false)} />
          </div>
        ) : null}
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="منو">
          <button type="button" className="absolute inset-0 bg-ink/50 backdrop-blur-sm" style={{ animation: "fade .2s both" }} onClick={() => setMenuOpen(false)} aria-label="بستن منو" />
          <div className="absolute inset-y-0 right-0 flex w-[min(88vw,380px)] flex-col overflow-y-auto bg-surface shadow-3" style={{ animation: "slide-in-right .32s var(--ease-out) both" }}>
            <div className="flex items-center justify-between border-b border-line p-4">
              <Logo siteName={props.siteName} logoUrl={props.logoUrl} />
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setMenuOpen(false)} aria-label="بستن">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="p-4">
              <SearchBox onDone={() => setMenuOpen(false)} />
            </div>
            <p className="px-5 pt-1 pb-2 text-[0.75rem] font-bold text-muted">دسته‌بندی‌ها</p>
            <div className="grid grid-cols-2 gap-2 px-4">
              {props.categories.slice(0, 8).map((cat) => (
                <Link key={cat.slug} href={`/store/category/${cat.slug}`} className="rounded-xl border border-line p-3 text-[0.85rem] font-bold">
                  {cat.name}
                  <small className="mt-0.5 block text-[0.7rem] font-medium text-muted">{formatNumber(cat.count)} محصول</small>
                </Link>
              ))}
            </div>
            <p className="px-5 pt-5 pb-2 text-[0.75rem] font-bold text-muted">صفحه‌ها</p>
            <nav className="flex flex-col px-2" aria-label="منوی موبایل">
              {props.links.map((link) => (
                <Link key={link.id} href={link.href} className={cn("rounded-xl px-3 py-3 text-[0.98rem] font-bold", isActive(link.href) ? "bg-primary-soft text-primary" : "hover:bg-sunken")}>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto space-y-2 border-t border-line p-4">
              {props.phoneHref ? (
                <a href={props.phoneHref} className="btn btn-outline btn-block">
                  <Phone className="size-4 text-success" aria-hidden />
                  تماس: <span className="ltr num">{props.phone}</span>
                </a>
              ) : null}
              {props.cta.label ? (
                <Link href={props.cta.href} className="btn btn-action btn-block">
                  {props.cta.label}
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
