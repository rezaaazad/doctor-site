"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, LayoutGrid, Menu, Phone, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/money";
import { useCart } from "@/components/store/cart";
import { searchPublishedProducts } from "./search-products";
import { Drawer } from "@/components/ui/drawer";

export type NavLink = { id: string; label: string; href: string; highlight?: boolean; newTab?: boolean; children?: NavLink[] };
export type NavCategory = { slug: string; name: string; count: number; icon: string; description: string; children: {slug: string; name: string}[] };

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

import { PhotoSlot } from "@/components/ui/photo-slot";

export function Logo({ siteName, logoUrl, light = false }: { siteName: string; logoUrl: string; light?: boolean }) {
  if (logoUrl) {
    return <span className="relative block h-9 w-32 md:h-10 md:w-36"><PhotoSlot
      src={light && logoUrl === "/images/brand/logo.webp" ? "/images/brand/logo-on-dark.webp" : logoUrl}
      alt={siteName} sizes="144px" className="object-contain" fallback={<b>{siteName}</b>} /></span>;
  }
  return (
    <span className="flex items-center gap-2.5">
      <span className={cn("relative grid size-9 place-items-center overflow-hidden rounded-[11px] md:size-10", light ? "bg-white text-ink" : "bg-ink text-white")}>
        <svg viewBox="0 0 32 32" className="size-5 md:size-6" fill="none" aria-hidden>
          <path d="M9 7h7.5a9 9 0 0 1 0 18H9z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="16.5" cy="16" r="2.6" fill="var(--primary)" />
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
        <span key={count} className="anim-pop num absolute -top-0.5 -left-0.5 grid h-[19px] min-w-[19px] place-items-center rounded-full bg-primary px-1 text-[0.68rem] font-black text-white ring-2 ring-surface">
          {formatNumber(count)}
        </span>
      ) : null}
    </button>
  );
}

function SearchBox({ className, autoFocus, onDone, categories=[] }: { className?: string; autoFocus?: boolean; onDone?: () => void; categories?:NavCategory[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [focused,setFocused]=useState(false);
  const [products, setProducts] = useState<{slug:string; title:string}[]>([]);
  useEffect(() => {
    setProducts([]);
    if (!focused || q.trim().length < 2) return;
    let active = true;
    const timeout = window.setTimeout(() => {
      searchPublishedProducts(q).then(rows => { if (active) setProducts(rows); }).catch(() => {});
    }, 250);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [q, focused]);
  const matches=q.trim()?categories.filter(c=>c.name.includes(q.trim())).slice(0,5):[];
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
      onFocus={()=>setFocused(true)}
      onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setFocused(false)}}
      onKeyDown={e=>{if(e.key==="Escape")setFocused(false)}}
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
      {focused&&q.trim()&&<div className="card-raised absolute inset-x-0 top-full z-50 mt-2 grid p-2">
        {products.map(product => <Link key={product.slug} href={`/store/${product.slug}`} onClick={()=>{setFocused(false);onDone?.()}} className="flex gap-2 rounded-lg p-2 text-sm hover:bg-sunken"><ShoppingBag size={16}/>{product.title}</Link>)}
        {matches.map(c=><Link key={c.slug} href={`/store/category/${c.slug}`} onClick={()=>{setFocused(false);onDone?.()}} className="rounded-lg p-2 text-sm hover:bg-sunken">{c.name}</Link>)}
        <button type="submit" className="rounded-lg bg-primary-soft p-2 text-start text-sm font-bold text-primary">جست‌وجوی «{q.trim()}» در محصولات</button>
      </div>}
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

  useEffect(() => {
    const open = () => setMenuOpen(true);
    window.addEventListener("store:categories", open);
    return () => window.removeEventListener("store:categories", open);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href.split("#")[0].split("?")[0]));

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300",
          scrolled ? "border-line bg-surface/85 shadow-[0_8px_30px_-18px_rgba(11,21,48,0.35)] backdrop-blur-xl" : "border-transparent bg-bg",
        )}
      >
        <div className={cn("shop-mast container-x flex items-center gap-1.5 sm:gap-3 lg:gap-6", scrolled?"h-[60px]":"h-[var(--header-h)]")}>
          <button type="button" className="btn btn-ghost btn-icon -mr-2 lg:hidden" onClick={() => setMenuOpen(true)} aria-label="باز کردن منو" aria-expanded={menuOpen}>
            <Menu className="size-[22px]" aria-hidden />
          </button>
          <Link href="/" className="shrink-0" aria-label={`${props.siteName} — صفحه اصلی`}>
            <Logo siteName={props.siteName} logoUrl={props.logoUrl} />
          </Link>

          <SearchBox categories={props.categories} className="hidden min-w-0 max-w-3xl flex-1 md:block" />

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
            <div className="group relative"><Link href={props.signedIn ? "/account" : "/account/login"} className="btn btn-ghost btn-icon" aria-label={props.signedIn ? "حساب کاربری" : "ورود یا ثبت‌نام"}>
              <User className="size-[21px]" aria-hidden />
            </Link>
            {props.signedIn&&<div className="card-raised absolute left-0 top-full z-50 hidden min-w-48 p-2 group-hover:grid group-focus-within:grid">{[["/account","پیشخوان حساب"],["/account/orders","سفارش‌ها"],["/account/wishlist","علاقه‌مندی‌ها"]].map(([href,label])=><Link key={href} href={href} className="rounded-lg p-2 text-sm hover:bg-sunken">{label}</Link>)}</div>}</div>
            <CartButton />
            {props.cta.label ? (
              <Link href={props.cta.href} className="btn btn-primary btn-sm mr-1 hidden lg:inline-flex">
                {props.cta.label}
              </Link>
            ) : null}
          </div>
        </div>
        <div className="shop-nav"><div className="container-x flex items-center gap-5">          <div ref={catsRef} className="relative hidden lg:block">
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
              <div className="card-raised anim-rise absolute top-[calc(100%+10px)] right-0 z-50 mega-panel w-[min(760px,80vw)] p-4">
                <div className="mega-layout"><Link aria-label="ورود به فروشگاه" className="mega-feature" href="/store"><span>ویترین فروشگاه ←</span></Link><div className="grid grid-cols-2 gap-1">
                  {props.categories.map((cat) => (
                    <div key={cat.slug}><Link href={`/store/category/${cat.slug}`} className="group flex items-start gap-3 rounded-xl p-3 hover:bg-sunken">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft font-display text-sm font-black text-primary">
                        {cat.icon || cat.name.slice(0, 1)}
                      </span>
                      <span className="min-w-0">
                        <b className="block text-[0.92rem] group-hover:text-primary">{cat.name}</b>
                        <small className="line-clamp-1 text-[0.75rem] text-muted">{cat.description || `${formatNumber(cat.count)} محصول`}</small>
                      </span>
                    </Link>
                    {cat.children.map(child => <Link key={child.slug} className="mega-child" href={`/store/category/${child.slug}`}>{child.name}</Link>)}
                    </div>
                  ))}
                </div></div>
                <Link href="/store" className="mt-2 flex items-center justify-between rounded-xl bg-ink px-4 py-3 text-[0.88rem] font-bold text-white">
                  همه محصولات فروشگاه
                  <span aria-hidden>←</span>
                </Link>
              </div>
            ) : null}
          </div>

          <nav aria-label="منوی اصلی" className="hidden items-center gap-0.5 lg:flex">
            {props.links.slice(0, 6).map((link) => (
              <div key={link.id} className="group relative">
              <Link
                key={link.id}
                href={link.href}
                target={link.newTab ? "_blank" : undefined}
                aria-current={isActive(link.href)?"page":undefined}
                className={cn(
                  "rounded-full px-3 py-2 text-[0.9rem] font-semibold transition-colors hover:bg-sunken",
                  isActive(link.href) ? "text-primary" : "text-fg/80",
                  link.highlight && "text-primary",
                )}
              >
                {link.label}
              </Link>
              {!!link.children?.length&&<div className="card-raised absolute top-full right-0 hidden min-w-48 p-2 group-hover:grid group-focus-within:grid">{link.children.map(child=><Link key={child.id} href={child.href} target={child.newTab?"_blank":undefined} className="rounded-lg p-2 text-sm hover:bg-sunken">{child.label}</Link>)}</div>}
              </div>
            ))}
          </nav>

</div></div>
        {searchOpen ? (
          <div className="container-x anim-rise pb-3 md:hidden">
            <SearchBox categories={props.categories} autoFocus onDone={() => setSearchOpen(false)} />
          </div>
        ) : null}
      </header>

      <Drawer open={menuOpen} onOpenChange={setMenuOpen} title="منوی اصلی" className="flex flex-col">
            <div className="flex items-center justify-between border-b border-line p-4">
              <Logo siteName={props.siteName} logoUrl={props.logoUrl} />
              <button type="button" className="btn btn-ghost btn-icon" onClick={() => setMenuOpen(false)} aria-label="بستن">
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="p-4">
              <SearchBox categories={props.categories} onDone={() => setMenuOpen(false)} />
            </div>
            <div className="drawer-categories">
              <h2 className="px-4 text-sm font-bold">دسته‌بندی محصولات</h2>
              {props.categories.map(cat => cat.children.length ? <details key={cat.slug}>
                <summary>{cat.name}</summary>
                <Link href={`/store/category/${cat.slug}`} onClick={()=>setMenuOpen(false)}>همه محصولات {cat.name}</Link>
                {cat.children.map(child=><Link href={`/store/category/${child.slug}`} key={child.slug} onClick={()=>setMenuOpen(false)}>{child.name}</Link>)}
              </details> : <Link key={cat.slug} href={`/store/category/${cat.slug}`} onClick={()=>setMenuOpen(false)}>{cat.name}</Link>)}
            </div>
            <p className="px-5 pt-5 pb-2 text-[0.75rem] font-bold text-muted">صفحه‌ها</p>
            <nav className="flex flex-col px-2" aria-label="منوی موبایل">
              {props.links.map((link) => (
                <div key={link.id}><Link href={link.href} onClick={()=>setMenuOpen(false)} className={cn("block rounded-xl px-3 py-3 text-[0.98rem] font-bold", isActive(link.href) ? "bg-primary-soft text-primary" : "hover:bg-sunken")}>
                  {link.label}
                </Link>{link.children?.map(child=><Link key={child.id} href={child.href} onClick={()=>setMenuOpen(false)} className="block py-2 ps-6 text-sm text-muted">{child.label}</Link>)}</div>
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
                <Link href={props.cta.href} className="btn btn-primary btn-block">
                  {props.cta.label}
                </Link>
              ) : null}
            </div>
      </Drawer>
    </>
  );
}
