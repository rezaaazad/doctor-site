import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, ArrowLeft, Award, BadgeCheck, Check, Clock, CreditCard, Headset, Quote as QuoteIcon, RotateCcw, ShieldCheck, Truck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber, formatToman } from "@/lib/money";
import { faShortDate } from "@/lib/iran";
import { lines, listOf, str } from "@/lib/sections";
import type { CategoryView, ProductCard as Card } from "@/lib/store/catalog";
import type { FaqItem, LogoItem, PostCard, PricePackage, ProjectCard, Quote, ServiceItem, Step } from "@/lib/site";
import { SectionHead } from "@/components/ui/bits";
import { Stars } from "@/components/ui/stars";
import { Countdown } from "@/components/ui/countdown";
import { ProductArt } from "@/components/ui/product-art";
import { ProductCard, ProductGrid } from "@/components/store/product-card";
import { LeadForm } from "@/components/site/forms";
import { JsonLd } from "@/components/site/json-ld";

type C = Record<string, unknown>;

const ICONS: Record<string, React.ReactNode> = {
  zap: <Zap className="size-5" aria-hidden />,
  shield: <ShieldCheck className="size-5" aria-hidden />,
  rotate: <RotateCcw className="size-5" aria-hidden />,
  headset: <Headset className="size-5" aria-hidden />,
  truck: <Truck className="size-5" aria-hidden />,
  card: <CreditCard className="size-5" aria-hidden />,
  award: <Award className="size-5" aria-hidden />,
  clock: <Clock className="size-5" aria-hidden />,
};

const action = (c: C) => (str(c.ctaLabel) ? { label: str(c.ctaLabel), href: str(c.ctaHref, "/store") } : undefined);

export function TrustBar({ content }: { content: C }) {
  const items = listOf(content.items).slice(0, 6);
  if (!items.length) return null;
  return (
    <section className="container-x benefits-shelf relative z-[2]">
      <div className="mx-auto grid grid-cols-2 gap-x-3 gap-y-5 p-4 md:max-w-[1100px] md:grid-cols-4 md:p-6">
        {items.map((item, i) => (
          <div key={`${item.title}-${i}`} data-reveal style={{ ["--d" as string]: i }} className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">{ICONS[item.icon] ?? ICONS.shield}</span>
            <span className="min-w-0">
              <b className="block text-[0.88rem] leading-6">{item.title}</b>
              <small className="block text-[0.74rem] leading-5 text-muted">{item.body}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CategoryGrid({ content, categories }: { content: C; categories: CategoryView[] }) {
  const roots = categories.filter((c) => !c.parentId);
  const featured = roots.filter((c) => c.featured);
  const list = (featured.length ? featured : roots).slice(0, Math.max(1, Number(content.limit) || 6));
  if (!list.length) return null;
  return <section className="container-x category-shelf">
    <SectionHead title={str(content.title)} body={str(content.body)} action={{label:"همه دسته‌ها",href:"/store"}}/>
    <div className="category-track">{list.map(cat=><Link key={cat.id} href={`/store/category/${cat.slug}`}>
      <span className="category-disc">
        {cat.imageUrl ? <Image unoptimized src={cat.imageUrl} fill sizes="96px" alt=""/> : cat.icon || <LayoutGrid/>}
      </span>
      <strong>{cat.name}</strong><small>{formatNumber(cat.count)} محصول</small>
    </Link>)}</div>
  </section>;
}

export function DealOfDay({ content, deal, products }: { content: C; deal: Card | null; products: Card[] }) {
  const active = deal?.saleEndsAt && new Date(deal.saleEndsAt).getTime() > Date.now() && deal.inStock ? deal : null;
  const offers = active ? [active, ...products.filter(item => item.id !== active.id)] : products;
  if (!offers.length) return null;
  return <section className="container-x offers">
    <div className="offer-heading">
      <div><span>{str(content.eyebrow)}</span><h2>{str(content.title)}</h2></div>
      <Link href="/store?sale=1">همه تخفیف‌ها ←</Link>
    </div>
    <div className="offer-rail" tabIndex={0} role="region" aria-label="محصولات تخفیف‌دار">
      {offers.map(item => <div key={item.id} className="offer-item">
        <ProductCard product={item}/>
        {item.saleEndsAt && <div className="offer-time"><Clock size={14}/> زمان باقی‌مانده <Countdown endsAt={item.saleEndsAt} compact/></div>}
      </div>)}
    </div>
  </section>;
}

export function ProductsSection({ content, products, layout = "grid" }: { content: C; products: Card[]; layout?: "grid" | "row" }) {
  if (!products.length) return null;
  return (
    <section className="mt-14 md:mt-20">
      <div className="container-x">
        <SectionHead eyebrow={str(content.eyebrow)} title={str(content.title)} body={str(content.body)} action={action(content)} />
      </div>
      {layout === "row" ? (
        <div className="container-x">
          <div className="snap-row -mx-4 grid-cols-none px-4 pb-2 md:-mx-7 md:px-7 [grid-auto-columns:minmax(200px,46%)] md:[grid-auto-columns:minmax(240px,23.5%)]">
            {products.map((product, i) => (
              <div key={product.id} className="relative pr-7 md:pr-9">
                <span
                  className="num pointer-events-none absolute right-0 bottom-28 z-0 font-display text-[4.6rem] leading-none font-black text-transparent [-webkit-text-stroke:2px_color-mix(in_oklab,var(--ink)_70%,transparent)] md:text-[6rem]"
                  aria-hidden
                >
                  {formatNumber(i + 1)}
                </span>
                <ProductCard product={product} className="relative z-[1] h-full" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="container-x">
          <ProductGrid products={products} />
        </div>
      )}
    </section>
  );
}

export function InstallmentsBanner({ content, enabled }: { content: C; enabled: boolean }) {
  if (!enabled) return null;
  const example = 24_000_000;
  const parts = 4;
  return (
    <section className="container-x mt-14 md:mt-20">
      <div data-reveal className="relative overflow-hidden rounded-[calc(var(--r)*1.4)] bg-primary text-white shadow-3">
        <div className="absolute inset-0 bg-[radial-gradient(70%_90%_at_0%_100%,rgba(255,255,255,0.18),transparent),radial-gradient(50%_60%_at_100%_0%,rgba(11,21,48,0.45),transparent)]" aria-hidden />
        <div className="relative grid items-center gap-8 p-6 md:grid-cols-[1.2fr_1fr] md:p-10 lg:p-14">
          <div>
            <span className="eyebrow !text-white/80">{str(content.eyebrow)}</span>
            <h2 className="h-section mt-2 text-white">{str(content.title)}</h2>
            <p className="mt-3 max-w-xl text-[0.98rem] leading-8 text-white/80">{str(content.body)}</p>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {lines(content.bullets).map((b) => (
                <li key={b} className="flex items-center gap-2 text-[0.9rem] font-semibold">
                  <span className="grid size-6 place-items-center rounded-full bg-white/15">
                    <Check className="size-3.5" aria-hidden />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              {str(content.ctaLabel) ? (
                <Link href={str(content.ctaHref, "/store")} className="btn btn-lg bg-white text-primary hover:bg-white/90">
                  {str(content.ctaLabel)}
                </Link>
              ) : null}
              <span className="flex items-center gap-2 text-[0.8rem] font-bold text-white/80">
                <span className="rounded-lg bg-white/12 px-2.5 py-1">اسنپ‌پی</span>
                <span className="rounded-lg bg-white/12 px-2.5 py-1">ترب‌پی</span>
              </span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[340px]">
            <div className="rounded-[28px] bg-white p-5 text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)] md:rotate-[2deg]">
              <p className="text-[0.75rem] font-bold text-muted">نمونه برای خرید {formatToman(example)}</p>
              <p className="mt-1 font-display text-[1.6rem] font-black">
                <span className="num">{formatNumber(Math.round(example / 10 / parts))}</span> <small className="text-[0.8rem] font-bold text-muted">تومان در ماه</small>
              </p>
              <ol className="mt-4 space-y-2.5">
                {Array.from({ length: parts }).map((_, i) => (
                  <li key={i} className="flex items-center justify-between rounded-2xl bg-sunken px-3.5 py-2.5 text-[0.82rem]">
                    <span className="flex items-center gap-2.5">
                      <span className={cn("grid size-7 place-items-center rounded-full text-[0.72rem] font-black", i === 0 ? "bg-success text-white" : "bg-surface text-muted ring-1 ring-line")}>
                        {i === 0 ? <Check className="size-3.5" aria-hidden /> : formatNumber(i + 1)}
                      </span>
                      {i === 0 ? "قسط اول هنگام خرید" : `قسط ${["", "دوم", "سوم", "چهارم"][i]} — ${formatNumber(i)} ماه بعد`}
                    </span>
                    <b className="num">{formatNumber(Math.round(example / 10 / parts))}</b>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-center text-[0.7rem] text-muted">شرایط دقیق در صفحه پرداخت سرویس اقساطی نمایش داده می‌شود.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SocialProof({
  content,
  testimonials,
  reviews,
  stats,
}: {
  content: C;
  testimonials: Quote[];
  reviews: { id: string; name: string; body: string; rating: number; verified: boolean; product: { title: string; slug: string } | null }[];
  stats: { avg: number; count: number };
}) {
  const cards = [
    ...reviews.map((r) => ({ id: r.id, name: r.name, role: r.product ? `خریدار «${r.product.title}»` : "خریدار", quote: r.body, rating: r.rating, verified: r.verified })),
    ...testimonials.map((t) => ({ id: t.id, name: t.name, role: t.role, quote: t.quote, rating: t.rating || 5, verified: false })),
  ].slice(0, 6);
  if (!cards.length) return null;
  const avg = stats.count ? stats.avg : cards.reduce((s, c) => s + c.rating, 0) / cards.length;
  return (
    <section className="container-x mt-14 md:mt-20">
      <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:gap-12">
        <div className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
          <SectionHead eyebrow={str(content.eyebrow)} title={str(content.title)} body={str(content.body)} className="!mb-6" />
          <div className="card-raised p-5">
            <p className="flex items-end gap-2">
              <b className="num font-display text-[3rem] leading-none font-black">{avg.toLocaleString("fa-IR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })}</b>
              <span className="pb-1.5 text-[0.85rem] text-muted">از ۵</span>
            </p>
            <Stars value={avg} size={18} showValue={false} className="mt-2" />
            <p className="mt-3 text-[0.85rem] text-muted">
              {stats.count ? (
                <>
                  بر اساس <b className="num text-fg">{formatNumber(stats.count)}</b> نظر تأییدشده خریداران
                </>
              ) : (
                "بر اساس نظر مشتری‌های پروژه‌های تحویل‌شده"
              )}
            </p>
          </div>
        </div>
        <div className="columns-1 gap-4 sm:columns-2 [&>*]:mb-4">
          {cards.map((card, i) => (
            <figure key={card.id} data-reveal style={{ ["--d" as string]: i }} className="card break-inside-avoid p-5">
              <div className="flex items-center justify-between">
                <Stars value={card.rating} size={14} showValue={false} />
                <QuoteIcon className="size-6 text-line" aria-hidden />
              </div>
              <blockquote className="mt-3 text-[0.95rem] leading-8">{card.quote}</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-ink font-display text-[0.85rem] font-black text-white">{card.name.slice(0, 1)}</span>
                <span className="min-w-0 leading-5">
                  <b className="flex items-center gap-1.5 text-[0.88rem]">
                    {card.name}
                    {card.verified ? <BadgeCheck className="size-4 text-success" aria-label="خریدار تأییدشده" /> : null}
                  </b>
                  <small className="line-clamp-1 text-[0.75rem] text-muted">{card.role}</small>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ServicesStrip({ content, services }: { content: C; services: ServiceItem[] }) {
  if (!services.length) return null;
  return (
    <section className="container-x mt-14 md:mt-20">
      <SectionHead eyebrow={str(content.eyebrow)} title={str(content.title)} body={str(content.body)} action={action(content)} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {services.slice(0, 8).map((s, i) => (
          <Link key={s.id} href={s.href || "/services"} data-reveal style={{ ["--d" as string]: i }} className="group card card-hover flex flex-col p-5">
            <span className="flex items-center justify-between">
              <span className="num font-display text-[0.85rem] font-black text-primary">{s.number || formatNumber(i + 1).padStart(2, "۰")}</span>
              <ArrowLeft className="size-4 text-muted transition-transform group-hover:-translate-x-1 group-hover:text-primary" aria-hidden />
            </span>
            <b className="mt-5 font-display text-[1.15rem] leading-8">{s.title}</b>
            <p className="mt-2 line-clamp-3 text-[0.88rem] leading-7 text-muted">{s.summary}</p>
            {s.priceLabel ? <p className="mt-auto pt-5 text-[0.82rem] font-bold text-fg">{s.priceLabel}</p> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PortfolioStrip({ content, projects }: { content: C; projects: ProjectCard[] }) {
  const list = projects.slice(0, Math.max(1, Number(content.limit) || 3));
  if (!list.length) return null;
  return (
    <section className="container-x mt-14 md:mt-20">
      <SectionHead eyebrow={str(content.eyebrow)} title={str(content.title)} body={str(content.body)} action={action(content)} />
      <div className="grid gap-4 md:grid-cols-3">
        {list.map((p, i) => (
          <Link key={p.id} href={`/portfolio/${p.slug}`} data-reveal style={{ ["--d" as string]: i }} className="group card card-hover overflow-hidden">
            <span className="block aspect-[4/3] overflow-hidden bg-sunken">
              {p.coverUrl && !p.coverUrl.endsWith(".svg") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.coverUrl} alt={p.title} loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              ) : (
                <ProductArt seed={p.slug} title={p.title} type="digital" kind="article" label="نمونه‌کار" className="size-full" />
              )}
            </span>
            <span className="block p-5">
              <small className="text-[0.75rem] text-muted">{[p.client, p.year].filter(Boolean).join(" · ")}</small>
              <b className="mt-1 block font-display text-[1.1rem]">{p.title}</b>
              <span className="mt-1 line-clamp-2 block text-[0.86rem] leading-7 text-muted">{p.subtitle || p.excerpt}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function ProcessSteps({ content, steps }: { content: C; steps: Step[] }) {
  if (!steps.length) return null;
  return (
    <section className="container-x mt-14 md:mt-20">
      <div className="surface-ink grain rounded-[calc(var(--r)*1.4)] p-6 md:p-10 lg:p-14">
        <SectionHead eyebrow={str(content.eyebrow)} title={str(content.title)} body={str(content.body)} tone="light" />
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.id} data-reveal style={{ ["--d" as string]: i }} className="relative rounded-[var(--r)] bg-white/6 p-5 ring-1 ring-white/10">
              <span className="num grid size-11 place-items-center rounded-2xl bg-primary font-display text-[1.05rem] font-black text-white">{formatNumber(i + 1)}</span>
              <b className="mt-5 block font-display text-[1.08rem] text-white">{s.title}</b>
              <p className="mt-2 text-[0.88rem] leading-7 text-white/65">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function PricingPlans({ content, packages }: { content: C; packages: PricePackage[] }) {
  if (!packages.length) return null;
  return (
    <section id="pricing" className="container-x mt-14 md:mt-20">
      <SectionHead eyebrow={str(content.eyebrow)} title={str(content.title)} body={str(content.body)} align="center" />
      <div className={cn("mx-auto grid gap-4", packages.length >= 3 ? "lg:grid-cols-3" : "md:grid-cols-2", "max-w-[1100px]")}>
        {packages.map((p, i) => (
          <div
            key={p.id}
            data-reveal
            style={{ ["--d" as string]: i }}
            className={cn("relative flex flex-col rounded-[calc(var(--r)*1.2)] p-6 md:p-7", p.highlighted ? "surface-ink shadow-3 lg:-my-3 lg:py-10" : "card")}
          >
            {p.highlighted || p.badge ? <span className="badge badge-gold absolute top-5 left-5">{p.badge || "محبوب‌ترین"}</span> : null}
            <b className={cn("font-display text-[1.15rem]", p.highlighted && "text-white")}>{p.name}</b>
            <p className={cn("mt-1 text-[0.86rem] leading-7", p.highlighted ? "text-white/65" : "text-muted")}>{p.summary}</p>
            <p className={cn("mt-5 font-display text-[1.6rem] font-black", p.highlighted && "text-white")}>{p.price}</p>
            <ul className="mt-5 space-y-2.5">
              {p.features.map((f) => (
                <li key={f} className={cn("flex items-start gap-2.5 text-[0.88rem] leading-7", p.highlighted ? "text-white/85" : "")}>
                  <Check className={cn("mt-1.5 size-4 shrink-0", p.highlighted ? "text-gold" : "text-success")} aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Link href={p.ctaHref || "/contact"} className={cn("btn mt-auto w-full", p.highlighted ? "btn-primary" : "btn-outline", "mt-7")}>
              {p.ctaLabel || "درخواست مشاوره"}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ClientLogos({ content, logos }: { content: C; logos: LogoItem[] }) {
  if (!logos.length) return null;
  const row = [...logos, ...logos];
  return (
    <section className="brand-strip mt-14 overflow-hidden md:mt-20" aria-label={str(content.title)}>
      <p className="container-x mb-6 text-center text-[0.85rem] font-bold text-muted">{str(content.title)}</p>
      <div className="relative [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="marquee-track">
          {row.map((logo, i) => (
            <span key={`${logo.id}-${i}`} className="flex h-12 shrink-0 items-center opacity-60 grayscale transition hover:opacity-100 hover:grayscale-0" aria-hidden={i >= logos.length}>
              {logo.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo.imageUrl} alt={logo.name} className="h-9 w-auto" loading="lazy" />
              ) : (
                <b className="font-display text-[1.25rem] font-black whitespace-nowrap text-ink/70">{logo.name}</b>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqList({ content, faqs }: { content: C; faqs: FaqItem[] }) {
  const list = faqs.slice(0, Math.max(1, Number(content.limit) || 8));
  if (!list.length) return null;
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: list.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) };
  return (
    <section className="container-x mt-14 md:mt-20">
      <JsonLd data={ld} />
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
        <SectionHead eyebrow={str(content.eyebrow)} title={str(content.title)} body={str(content.body)} action={{ label: "همه پرسش‌ها", href: "/faq" }} className="lg:flex-col lg:items-start lg:justify-start" />
        <div className="space-y-2.5">
          {list.map((f, i) => (
            <details key={f.id} className="group card overflow-hidden open:shadow-2" open={i === 0}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 text-[0.95rem] font-bold md:p-5 [&::-webkit-details-marker]:hidden">
                {f.question}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-sunken text-lg leading-none transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="px-4 pb-5 text-[0.92rem] leading-8 text-muted md:px-5">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LeadSection({ content, phone, phoneHref }: { content: C; phone: string; phoneHref: string }) {
  return (
    <section id="lead" className="container-x mt-14 md:mt-20">
      <div className="surface-ink grain relative overflow-hidden rounded-[calc(var(--r)*1.4)]">
        <div className="relative grid gap-8 p-6 md:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:p-14">
          <div>
            <span className="eyebrow !text-white/75">{str(content.eyebrow)}</span>
            <h2 className="h-section mt-2 text-white">{str(content.title)}</h2>
            <p className="mt-3 text-[0.98rem] leading-8 text-white/70">{str(content.body)}</p>
            <ul className="mt-6 space-y-3">
              {lines(content.bullets).map((b) => (
                <li key={b} className="flex items-center gap-3 text-[0.92rem] font-semibold text-white/85">
                  <span className="grid size-7 place-items-center rounded-full bg-success/25 text-[#7ee2b8]">
                    <Check className="size-4" aria-hidden />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
            {phoneHref ? (
              <a href={phoneHref} className="mt-7 inline-flex items-center gap-3 rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/12 transition hover:bg-white/12">
                <span className="live-dot" />
                <span className="text-[0.82rem] text-white/70">یا همین الان تماس بگیرید:</span>
                <b className="ltr num text-white">{phone}</b>
              </a>
            ) : null}
          </div>
          <div className="rounded-[var(--r)] bg-surface p-5 text-fg shadow-3 md:p-7">
            <LeadForm types={lines(content.types)} budgets={lines(content.budgets)} submitLabel={str(content.submitLabel, "درخواست تماس")} source="home" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function BlogLatest({ content, posts }: { content: C; posts: PostCard[] }) {
  const list = posts.slice(0, Math.max(1, Number(content.limit) || 3));
  if (!list.length) return null;
  return (
    <section className="container-x mt-14 md:mt-20">
      <SectionHead eyebrow={str(content.eyebrow)} title={str(content.title)} body={str(content.body)} action={action(content)} />
      <div className="journal-grid grid gap-4 md:grid-cols-3">
        {list.map((post, i) => (
          <Link key={post.id} href={`/blog/${post.slug}`} data-reveal style={{ ["--d" as string]: i }} className="group card card-hover flex flex-col overflow-hidden">
            <span className="block aspect-[16/9] overflow-hidden bg-sunken">
              {post.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverUrl} alt="" loading="lazy" className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              ) : (
                <ProductArt seed={post.slug} title={post.title} type="digital" kind="article" label="مقاله" className="size-full" />
              )}
            </span>
            <span className="flex flex-1 flex-col p-5">
              <small className="text-[0.75rem] text-muted">{faShortDate(post.publishedAt)}</small>
              <b className="mt-1.5 line-clamp-2 font-display text-[1.05rem] leading-8 group-hover:text-primary">{post.title}</b>
              <span className="mt-2 line-clamp-2 text-[0.86rem] leading-7 text-muted">{post.excerpt}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
