import Link from "next/link";
import { ArrowLeft, BadgeCheck, CreditCard, Download, Star, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { listOf, str } from "@/lib/sections";
import type { ProductCard } from "@/lib/store/catalog";
import { Price } from "@/components/ui/price";
import { ProductImage } from "@/components/store/product-card";
import { AddToCartButton } from "@/components/store/add-to-cart";

export function StoreHero({ content, spotlight, dark, installmentsOn }: { content: Record<string, unknown>; spotlight: ProductCard | null; dark: boolean; installmentsOn: boolean }) {
  const stats = listOf(content.stats).slice(0, 4);
  const image = str(content.spotlightImage);
  return (
    <section className="container-x pt-3 md:pt-5">
      <div className={cn("relative overflow-hidden rounded-[calc(var(--r)*1.6)]", dark ? "surface-ink grain" : "border border-line bg-surface shadow-2")}>
        {dark ? <div className="grid-lines pointer-events-none absolute inset-0 opacity-70" aria-hidden /> : null}
        <div className="relative grid items-center gap-10 px-5 pt-9 pb-10 md:px-10 md:pt-14 md:pb-14 lg:grid-cols-[1.08fr_1fr] lg:gap-6 lg:px-14 lg:py-16">
          <div className="max-w-[620px]">
            <span className={cn("anim-rise inline-flex items-center gap-2 rounded-full py-1.5 pr-2 pl-3.5 text-[0.78rem] font-bold", dark ? "bg-white/8 text-white/85 ring-1 ring-white/12" : "bg-primary-soft text-primary")}>
              <span className="live-dot" />
              {str(content.eyebrow)}
            </span>
            <h1 className={cn("anim-rise h-display mt-5 text-[2.05rem] sm:text-[2.6rem] lg:text-[3.35rem] xl:text-[3.7rem]", dark && "text-white")} style={{ ["--d" as string]: 1 }}>
              {str(content.title)}{" "}
              <span className="relative inline-block whitespace-nowrap">
                <span className={cn("relative z-[1]", dark ? "text-transparent bg-clip-text bg-[linear-gradient(100deg,#fff_0%,color-mix(in_oklab,var(--gold)_80%,white)_45%,color-mix(in_oklab,var(--action)_65%,white)_100%)]" : "text-action")}>
                  {str(content.highlight)}
                </span>
                <svg viewBox="0 0 300 18" className="absolute -bottom-2 left-0 h-3 w-full" preserveAspectRatio="none" aria-hidden>
                  <path d="M3 13C60 5 140 3 297 9" fill="none" stroke="var(--action)" strokeWidth="5" strokeLinecap="round" opacity={dark ? 0.85 : 0.35} />
                </svg>
              </span>
            </h1>
            <p className={cn("anim-rise lead mt-6 max-w-[540px]", dark && "!text-white/72")} style={{ ["--d" as string]: 2 }}>
              {str(content.body)}
            </p>
            <div className="anim-rise mt-8 flex flex-wrap items-center gap-3" style={{ ["--d" as string]: 3 }}>
              <Link href={str(content.primaryHref, "/store")} className="btn btn-action btn-lg">
                {str(content.primaryLabel, "مشاهده محصولات")}
                <ArrowLeft className="size-[18px]" aria-hidden />
              </Link>
              {str(content.secondaryLabel) ? (
                <Link href={str(content.secondaryHref, "/contact")} className={cn("btn btn-lg", dark ? "btn-light" : "btn-outline")}>
                  {str(content.secondaryLabel)}
                </Link>
              ) : null}
            </div>
            <div className={cn("anim-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-4", dark ? "text-white/70" : "text-muted")} style={{ ["--d" as string]: 4 }}>
              {str(content.rating) ? (
                <span className="flex items-center gap-2.5">
                  <span className="flex -space-x-2 space-x-reverse" aria-hidden>
                    {["م", "س", "ر", "ن"].map((c, i) => (
                      <span key={c} className={cn("grid size-8 place-items-center rounded-full text-[0.72rem] font-black ring-2", dark ? "ring-ink" : "ring-surface")} style={{ background: ["#3B5BDB", "#D04A0D", "#047857", "#7C3AED"][i], color: "#fff" }}>
                        {c}
                      </span>
                    ))}
                  </span>
                  <span className="leading-5">
                    <b className={cn("flex items-center gap-1 text-[0.95rem]", dark ? "text-white" : "text-fg")}>
                      <Star className="size-4 fill-gold text-gold" aria-hidden /> {str(content.rating)}
                    </b>
                    <small className="text-[0.75rem]">{str(content.ratingLabel)}</small>
                  </span>
                </span>
              ) : null}
              {stats.map((s) => (
                <span key={s.label} className="leading-5">
                  <b className={cn("block font-display text-[1.05rem]", dark ? "text-white" : "text-fg")}>{s.value}</b>
                  <small className="text-[0.75rem]">{s.label}</small>
                </span>
              ))}
            </div>
          </div>

          {spotlight ? (
            <div className="relative mx-auto w-full max-w-[460px] lg:mr-auto lg:ml-0">
              <div className="anim-rise relative" style={{ ["--d" as string]: 2 }}>
                <div className="absolute -inset-6 rounded-[40px] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_45%,transparent),transparent)] blur-2xl" aria-hidden />
                <Link
                  href={`/store/${spotlight.slug}`}
                  className="group relative block overflow-hidden rounded-[calc(var(--r)*1.4)] bg-surface p-2.5 text-fg shadow-[0_40px_80px_-30px_rgba(0,0,0,0.65)] ring-1 ring-black/5 transition-transform duration-500 hover:-translate-y-1 md:rotate-[-1.5deg] md:hover:rotate-0"
                >
                  <span className="relative block aspect-[5/4] overflow-hidden rounded-[var(--r)] bg-sunken">
                    {image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={image} alt={spotlight.title} className="size-full object-cover" />
                    ) : (
                      <ProductImage product={spotlight} priority sizes="(min-width: 1024px) 460px, 90vw" className="transition-transform duration-700 group-hover:scale-[1.03]" />
                    )}
                    <span className="badge badge-gold absolute top-3 right-3">{str(content.spotlightNote, "پیشنهاد ویژه")}</span>
                  </span>
                  <span className="flex items-end justify-between gap-3 p-3 pt-4">
                    <span className="min-w-0">
                      <small className="text-[0.74rem] text-muted">{spotlight.category.name}</small>
                      <b className="mt-0.5 line-clamp-2 block text-[1rem] leading-7">{spotlight.title}</b>
                    </span>
                    <Price value={spotlight.price} compareAt={spotlight.compareAt} size="lg" />
                  </span>
                </Link>
                {!spotlight.hasVariants && spotlight.inStock ? (
                  <div className="absolute bottom-[5.6rem] left-5 z-[2]">
                    <AddToCartButton
                      variant="action"
                      className="shadow-[0_14px_30px_-10px_var(--action)]"
                      label="خرید سریع"
                      line={{ productId: spotlight.id, variantId: null, title: spotlight.title, variantTitle: "", slug: spotlight.slug, image: spotlight.image, price: spotlight.price, compareAt: spotlight.compareAt, type: spotlight.type, max: spotlight.stockLeft ?? 99 }}
                    />
                  </div>
                ) : null}

                <span className="anim-float absolute top-8 -left-3 hidden items-center gap-2 rounded-2xl bg-surface px-3 py-2.5 text-[0.78rem] font-bold text-fg shadow-2 ring-1 ring-black/5 sm:flex md:-left-8">
                  <span className="grid size-8 place-items-center rounded-xl bg-success-soft text-success">
                    {spotlight.type === "digital" ? <Download className="size-4" aria-hidden /> : <Zap className="size-4" aria-hidden />}
                  </span>
                  {spotlight.type === "digital" ? "تحویل فوری بعد از پرداخت" : "ارسال از فردا"}
                </span>
                {installmentsOn ? (
                  <span className="anim-float absolute -right-3 bottom-24 hidden items-center gap-2 rounded-2xl bg-surface px-3 py-2.5 text-[0.78rem] font-bold text-fg shadow-2 ring-1 ring-black/5 sm:flex md:-right-8" style={{ animationDelay: "1.2s" }}>
                    <span className="grid size-8 place-items-center rounded-xl bg-primary-soft text-primary">
                      <CreditCard className="size-4" aria-hidden />
                    </span>
                    خرید اقساطی بدون ضامن
                  </span>
                ) : (
                  <span className="anim-float absolute -right-3 bottom-24 hidden items-center gap-2 rounded-2xl bg-surface px-3 py-2.5 text-[0.78rem] font-bold text-fg shadow-2 ring-1 ring-black/5 sm:flex md:-right-8" style={{ animationDelay: "1.2s" }}>
                    <span className="grid size-8 place-items-center rounded-xl bg-primary-soft text-primary">
                      <BadgeCheck className="size-4" aria-hidden />
                    </span>
                    ضمانت بازگشت وجه
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
