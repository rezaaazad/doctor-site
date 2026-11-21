"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { useCart } from "@/components/store/cart";
import { ProductImage } from "@/components/store/product-card";
import { Price } from "@/components/ui/price";
import { formatNumber, formatToman } from "@/lib/money";

export function CartPageClient() {
  const { lines, ready, subtotal, savings, setQuantity, remove } = useCart();
  if (!ready) return <p className="text-muted">در حال بارگذاری سبد…</p>;
  if (!lines.length) {
    return (
      <div className="card p-10 text-center">
        <p className="font-bold">سبد شما خالی است.</p>
        <Link href="/store" className="btn btn-action mt-4">
          مشاهده فروشگاه
        </Link>
      </div>
    );
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <ul className="card divide-y divide-line">
        {lines.map((line) => (
          <li key={`${line.productId}:${line.variantId ?? ""}`} className="flex flex-wrap gap-4 p-4 md:flex-nowrap">
            <Link href={`/store/${line.slug}`} className="size-24 shrink-0 overflow-hidden rounded-xl bg-sunken">
              <ProductImage product={{ image: line.image, slug: line.slug, title: line.title, type: line.type }} className="size-full" sizes="96px" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/store/${line.slug}`} className="font-bold hover:text-primary">
                {line.title}
              </Link>
              {line.variantTitle ? <p className="mt-0.5 text-[0.8rem] text-muted">{line.variantTitle}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-[0.8rem] font-semibold">
                  تعداد
                  <input
                    type="number"
                    min={1}
                    max={line.max}
                    value={line.quantity}
                    onChange={(e) => setQuantity(line.productId, line.variantId, Number(e.target.value) || 1)}
                    className="field w-16 text-center text-base"
                    dir="ltr"
                  />
                </label>
                <button type="button" onClick={() => remove(line.productId, line.variantId)} className="btn btn-ghost btn-sm text-urgency" aria-label="حذف">
                  <Trash2 className="size-4" />
                  حذف
                </button>
              </div>
            </div>
            <Price value={line.price * line.quantity} compareAt={line.compareAt > line.price ? line.compareAt * line.quantity : 0} className="shrink-0" />
          </li>
        ))}
      </ul>
      <aside className="card h-fit p-5">
        <h2 className="mb-4 font-bold">جمع سبد</h2>
        <dl className="space-y-2 text-[0.88rem]">
          <div className="flex justify-between">
            <dt className="text-muted">جمع</dt>
            <dd className="num font-bold">{formatToman(subtotal)}</dd>
          </div>
          {savings > 0 ? (
            <div className="flex justify-between text-success">
              <dt>سود شما از تخفیف</dt>
              <dd className="num">{formatToman(savings)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t border-line pt-3 text-[1rem] font-extrabold">
            <dt>قابل پرداخت تقریبی</dt>
            <dd className="num">{formatToman(subtotal)}</dd>
          </div>
        </dl>
        <p className="mt-2 text-[0.78rem] text-muted">{formatNumber(lines.reduce((s, l) => s + l.quantity, 0))} قلم کالا</p>
        <Link href="/checkout" className="btn btn-action btn-lg mt-5 w-full">
          ادامه و تسویه
        </Link>
      </aside>
    </div>
  );
}