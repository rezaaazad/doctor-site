"use client";

import Link from "next/link";
import { Drawer } from "@/components/ui/drawer";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/money";
import { Price } from "@/components/ui/price";
import { ProductArt } from "@/components/ui/product-art";
import { useCart, type CartLine } from "@/components/store/cart";

export function LineThumb({ line, className }: { line: Pick<CartLine, "image" | "slug" | "title" | "type">; className?: string }) {
  return (
    <span className={cn("block shrink-0 overflow-hidden rounded-xl bg-sunken", className)}>
      {line.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={line.image} alt="" className="size-full object-cover" loading="lazy" />
      ) : (
        <ProductArt seed={line.slug} title={line.title} type={line.type} className="size-full" />
      )}
    </span>
  );
}

export function QuantityStepper({ value, max, onChange, size = "md" }: { value: number; max: number; onChange: (value: number) => void; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-8" : "h-10";
  return (
    <span className={cn("inline-flex items-center rounded-full border border-line bg-surface", h)}>
      <button type="button" className={cn("grid aspect-square place-items-center rounded-full hover:bg-sunken disabled:opacity-30", h)} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="افزایش تعداد">
        <Plus className="size-3.5" aria-hidden />
      </button>
      <b className="num min-w-6 text-center text-[0.9rem]" aria-live="polite">
        {formatNumber(value)}
      </b>
      <button type="button" className={cn("grid aspect-square place-items-center rounded-full hover:bg-sunken", h)} onClick={() => onChange(value - 1)} aria-label={value <= 1 ? "حذف از سبد" : "کاهش تعداد"}>
        {value <= 1 ? <Trash2 className="size-3.5 text-urgency" aria-hidden /> : <Minus className="size-3.5" aria-hidden />}
      </button>
    </span>
  );
}

export function CartDrawer() {
  const { open, setOpen, lines, subtotal, savings, setQuantity, count } = useCart();

  return (
    <Drawer open={open} onOpenChange={setOpen} title="سبد خرید" className="!inset-y-auto !inset-x-0 bottom-0 flex !w-full max-h-[88dvh] flex-col rounded-t-card md:!inset-y-0 md:!right-auto md:!left-0 md:!w-[440px] md:max-h-none md:rounded-none">
        <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-line md:hidden" />
        <div className="flex items-center justify-between px-5 pt-3 pb-4 md:pt-5">
          <h2 className="font-display text-lg font-extrabold">
            سبد خرید <span className="num text-muted">({formatNumber(count)})</span>
          </h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => setOpen(false)} aria-label="بستن">
            <X className="size-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <span className="grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary">
                <ShoppingBag className="size-7" aria-hidden />
              </span>
              <p className="mt-4 font-display text-lg font-extrabold">سبد شما خالی است</p>
              <p className="mt-1 text-[0.9rem] text-muted">پرفروش‌ها را ببینید؛ بیشتر سفارش‌ها همان روز آماده می‌شوند.</p>
              <Link href="/store" onClick={() => setOpen(false)} className="btn btn-ink mt-5">
                رفتن به فروشگاه
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {lines.map((line) => (
                <li key={JSON.stringify([line.productId,line.variantId,line.addonIds])} className="flex gap-3 py-4">
                  <Link href={`/store/${line.slug}`} onClick={() => setOpen(false)}>
                    <LineThumb line={line} className="size-[76px]" />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link href={`/store/${line.slug}`} onClick={() => setOpen(false)} className="line-clamp-2 text-[0.9rem] leading-6 font-bold">
                      {line.title}
                    </Link>
                    {line.addonTitles?.join("، ")} {line.variantTitle ? <span className="text-[0.75rem] text-muted">{line.variantTitle}</span> : null}
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <QuantityStepper size="sm" value={line.quantity} max={line.max || 99} onChange={(q) => setQuantity(line.productId, line.variantId, q, line.addonIds)} />
                      <Price value={line.price * line.quantity} size="sm" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {lines.length ? (
          <div className="space-y-3 border-t border-line p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {savings > 0 ? (
              <p className="flex justify-between text-[0.85rem] font-bold text-success">
                <span>سود شما از این خرید</span>
                <span className="num">{formatNumber(Math.floor(savings / 10))} تومان</span>
              </p>
            ) : null}
            <p className="flex items-baseline justify-between">
              <span className="text-[0.9rem] text-muted">جمع سبد</span>
              <Price value={subtotal} size="lg" />
            </p>
            <div className="grid grid-cols-[1fr_1.4fr] gap-2">
              <Link href="/cart" onClick={() => setOpen(false)} className="btn btn-outline">
                مشاهده سبد
              </Link>
              <Link href="/checkout" onClick={() => setOpen(false)} className="btn btn-action">
                ادامه و پرداخت
              </Link>
            </div>
            <p className="text-center text-[0.72rem] text-muted">تخفیف سفارش در مرحله بعد محاسبه می‌شود.</p>
          </div>
        ) : null}
    </Drawer>
  );
}
