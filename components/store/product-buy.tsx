"use client";

import {licenseHost} from "@/lib/licenses/domain";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ShieldCheck, BriefcaseBusiness } from "lucide-react";
import type { ProductDetail, VariantView } from "@/lib/store/catalog";
import { cn } from "@/lib/utils";
import { Price } from "@/components/ui/price";
import { Stars } from "@/components/ui/stars";
import { Countdown } from "@/components/ui/countdown";
import { AddToCartButton } from "@/components/store/add-to-cart";
import { ProductGallery } from "./product-gallery";
import { WishlistButton } from "@/components/store/wishlist-button";

function pickVariant(variants: VariantView[], selected: Record<string, string>): VariantView | null {
  if (!variants.length) return null;
  const match = variants.find((v) => Object.entries(v.values).every(([k, val]) => selected[k] === val));
  return match ?? variants.find((v) => v.inStock) ?? variants[0] ?? null;
}

function matchingVariant(variants: VariantView[], selected: Record<string, string>, name: string, value: string) {
  const candidates = variants.filter((variant) => variant.inStock && variant.values[name] === value);
  return (
    candidates.find((variant) =>
      Object.entries(selected).every(([key, choice]) => key === name || variant.values[key] === choice),
    ) ?? candidates[0]
  );
}

export function ProductBuy({
  product, renewal,
  wished,
  guarantee,
}: {
  product: ProductDetail;renewal?:{id:string;host:string;variantId:string};
  wished?: boolean;
  guarantee?: string;
}) {
  const options = product.options;
  const [selected, setSelected] = useState<Record<string, string>>(() => {
    const first = product.variants.find(v=>v.id===renewal?.variantId) ?? product.variants.find((v) => v.inStock) ?? product.variants[0];
    if (first) return first.values;
    const initial: Record<string, string> = {};
    for (const opt of options) initial[opt.name] = opt.values[0] ?? "";
    return initial;
  });
  const [quantity, setQuantity] = useState(1);

  const variant = useMemo(() => pickVariant(product.variants, selected), [product.variants, selected]);
  const [addonIds, setAddonIds] = useState<string[]>(product.addons.filter(a => a.required).map(a => a.id));
  const addons = product.addons.filter(a => addonIds.includes(a.id));
  const price = (variant?.price ?? product.price) + addons.reduce((sum,a) => sum + Number(a.priceRial), 0);
  const compareAt = variant ? variant.compareAt : product.compareAt;
  const inStock = variant ? variant.inStock : product.inStock;
  const image = variant?.imageUrl || product.image;
  const stockLimit =
    product.manageStock && !product.allowBackorder
      ? Math.max(1, variant?.stock ?? product.stock)
      : product.maxPerOrder || 99;

  const [rawHost,setRawHost]=useState(renewal?.host || "");
  const host=licenseHost(rawHost);
  const maxQty = product.licensedPlugin?1:Math.min(product.maxPerOrder || 99, stockLimit);
  const line = {
    host:product.licensedPlugin?host:undefined,renewalId:renewal?.id,
    addonIds, addonTitles: addons.map(a => a.title),
    productId: product.id,
    variantId: variant?.id ?? null,
    title: product.title,
    variantTitle: variant?.title ?? "",
    slug: product.slug,
    image,
    price,
    compareAt,
    type: product.type,
    max: maxQty,
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-10">
      <div className="relative overflow-hidden rounded-[var(--r)] border border-line bg-sunken shadow-1">
        <ProductGallery key={image} product={product} image={image} />
        <WishlistButton productId={product.id} initial={wished} className="absolute top-3 left-3 z-[2]" />
      </div>
      <div className="flex flex-col gap-4" data-reveal>
        <div className="flex flex-wrap items-center gap-2 text-[0.8rem] text-muted">
          <Link
            href={`/store/category/${product.category.slug}`}
            className="font-semibold text-primary hover:underline"
          >
            {product.category.name}
          </Link>
          {product.badge ? <span className="badge badge-gold">{product.badge}</span> : null}
          {product.saleEndsAt ? (
            <Countdown endsAt={product.saleEndsAt} compact tone="light" className="badge badge-urgency" />
          ) : null}
        </div>
        <h1 className="font-display text-[1.65rem] leading-tight font-extrabold md:text-[2.1rem]">
          {product.title}
        </h1>
        {product.subtitle ? <p className="text-[0.95rem] text-muted">{product.subtitle}</p> : null}
        {product.ratingCount > 0 ? <Stars value={product.ratingAvg} count={product.ratingCount} /> : null}
        {product.salesCount > 0 ? (
          <p className="text-[0.8rem] font-semibold text-muted">
            {product.salesCount.toLocaleString("fa-IR")} نفر این محصول را خریده‌اند
          </p>
        ) : null}

        <div className="detail-price">
          <small>قیمت محصول</small>
          <Price value={price} compareAt={compareAt} size="lg" />
        </div>
        {product.installments ? (
          <p className="text-[0.85rem] font-bold text-primary">قابل خرید اقساطی با اسنپ‌پی و ترب‌پی</p>
        ) : null}

        {variant && product.variants.length > 1 ? (
          <p className="rounded-xl bg-sunken px-3 py-2 text-[0.82rem] font-semibold text-muted">
            گزینه انتخاب‌شده: <span className="text-fg">{variant.title}</span>
            {variant.sku ? (
              <span className="ms-2 font-normal" dir="ltr">
                ({variant.sku})
              </span>
            ) : null}
          </p>
        ) : null}

        {options.map((opt) => (
          <div key={opt.name} role="group" aria-label={opt.name}>
            <p className="mb-2 text-[0.82rem] font-bold">{opt.name}</p>
            <div className="flex flex-wrap gap-2">
              {opt.values.map((val) => {
                const available = matchingVariant(product.variants, selected, opt.name, val);
                const active = selected[opt.name] === val;
                return (
                  <button
                    key={val}
                    type="button"
                    disabled={!available || !!renewal}
                    aria-pressed={active}
                    onClick={() => {
                      if (available) {
                        setQuantity(1);
                        setSelected(available.values);
                      }
                    }}
                    className={cn(
                      "min-h-[44px] rounded-full border px-3.5 py-2 text-[0.82rem] font-semibold transition",
                      active
                        ? "border-primary bg-primary-soft text-primary ring-2 ring-primary/25"
                        : "border-line bg-surface hover:border-primary/40",
                      !available &&
                        "cursor-not-allowed border-line/60 bg-sunken/80 text-muted line-through opacity-55",
                    )}
                  >
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {product.turnaroundLabel && <p>زمان تحویل: {product.turnaroundLabel}</p>}
        {product.licensedPlugin && <section className="card grid gap-3 p-4"><h2>مجوز نصب روی یک دامنه</h2><p>نیازمند ووکامرس است. هزینه مصرف مدل و پیامک با خریدار است. پس از پرداخت، ZIP اختصاصی را از دانلودهای حساب خود بگیرید.</p><p>مدت اعتبار: {variant?.pluginDays.toLocaleString("fa-IR")} روز</p><label>دامنه فروشگاه ووکامرسی شما<input className="field w-full" dir="ltr" placeholder="shop.example.com" value={rawHost} readOnly={!!renewal} onChange={e=>setRawHost(e.target.value)}/></label><small>همان دامنه‌ای را وارد کنید که در آدرس اصلی وردپرس ثبت شده است.</small>{rawHost && !host && <p role="alert">دامنه معتبر وارد کنید؛ مسیر، پورت یا ایمیل قابل قبول نیست.</p>}<Link href={"/account/login?next="+encodeURIComponent("/store/"+product.slug)}>ورود به حساب برای دریافت لایسنس</Link></section>}
        {product.addons.length > 0 && <fieldset className="grid gap-2"><legend>خدمات تکمیلی</legend>{product.addons.map(a => <label key={a.id} className="flex min-h-[44px] items-center gap-3 rounded-xl border border-line p-3"><input type="checkbox" checked={addonIds.includes(a.id)} disabled={a.required} onChange={e => setAddonIds(ids => e.target.checked ? [...ids,a.id] : ids.filter(id => id !== a.id))}/><span>{a.title} {a.required && " (الزامی)"}<small className="block">{a.description}</small></span><span className="ms-auto">+{(Number(a.priceRial)/10).toLocaleString("fa-IR")} تومان</span></label>)}<output aria-live="polite">جمع: {((price * quantity)/10).toLocaleString("fa-IR")} تومان</output></fieldset>}
        {!inStock ? (
          <p className="rounded-xl bg-urgency-soft px-4 py-3 text-[0.88rem] font-bold text-urgency">
            این ترکیب فعلاً موجود نیست.
          </p>
        ) : product.stockLeft ? (
          <p className="text-[0.82rem] font-bold text-urgency">فقط {product.stockLeft} عدد باقی مانده</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <label className="grid gap-1 text-[0.78rem] font-semibold text-muted">
            تعداد
            <input
              type="number"
              min={1}
              max={maxQty}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(maxQty, Math.max(1, Math.floor(Number(e.target.value)) || 1)))}
              className="field w-20 text-center"
              dir="ltr"
            />
          </label>
          <AddToCartButton
            variant="action"
            line={line}
            quantity={quantity}
            disabled={!inStock || (product.licensedPlugin && (!host || !variant?.pluginTier))}
            size="lg"
            className="flex-1 min-w-[200px]"
            label={inStock ? "افزودن به سبد" : "ناموجود"}
          />
        </div>

        <ul className="purchase-assurances">
          <li>
            <ShieldCheck size={16} /> اصالت محصول
          </li>
          <li className="flex items-center gap-2">
            {product.type === "digital" ? (
              <ShieldCheck className="size-4 text-success" aria-hidden />
            ) : (
              <BriefcaseBusiness className="size-4 text-success" aria-hidden />
            )}
            {product.type === "digital" ? "تحویل فوری لینک دانلود پس از پرداخت" : "تحویل آنلاین + پشتیبانی"}
          </li>
          {guarantee ? <li>{guarantee}</li> : null}
          {product.guarantee ? <li>{product.guarantee}</li> : null}
          {product.licenseNote ? <li>{product.licenseNote}</li> : null}
        </ul>
      </div>

      <div
        className="fixed inset-x-0 z-[45] border-t border-line bg-surface/95 p-3 shadow-3 backdrop-blur-md lg:hidden"
        style={{ bottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="wrap flex items-center gap-3">
          <Price value={price} compareAt={compareAt} showPercent={false} className="min-w-0 flex-1" />
          <AddToCartButton
            variant="action"
            line={line}
            quantity={quantity}
            disabled={!inStock || (product.licensedPlugin && (!host || !variant?.pluginTier))}
            size="lg"
            className="shrink-0"
          />
        </div>
      </div>
    </div>
  );
}
