import Link from "next/link";
import Image from "next/image";
import { Download, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/money";
import type { ProductCard as Card } from "@/lib/store/catalog";
import { Price } from "@/components/ui/price";
import { Stars } from "@/components/ui/stars";
import { ProductArt } from "@/components/ui/product-art";
import { AddToCartButton } from "@/components/store/add-to-cart";
import { WishlistButton } from "@/components/store/wishlist-button";

export function ProductImage({ product, className, sizes = "(min-width: 1024px) 25vw, 50vw", priority = false }: { product: Pick<Card, "image" | "slug" | "title" | "type">; className?: string; sizes?: string; priority?: boolean }) {
  if (product.image) {
    if(/^\/media\/[a-zA-Z0-9._-]+\.(?:jpg|jpeg|png|webp|avif)$/i.test(product.image))return <span className="relative block size-full"><Image src={product.image} alt={product.title} fill sizes={sizes} priority={priority} className={cn("object-cover",className)} /></span>;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={product.image}
        alt={product.title}
        sizes={sizes}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn("size-full object-cover", className)}
      />
    );
  }
  return <ProductArt seed={product.slug} title={product.title} type={product.type} className={cn("size-full", className)} />;
}

export function ProductCard({ product, className, priority = false, wished = false }: { product: Card; className?: string; priority?: boolean; wished?: boolean }) {
  const href = `/store/${product.slug}`;
  const pct = product.compareAt > product.price ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100) : 0;
  return (
    <article className={cn("group card card-hover relative flex flex-col overflow-hidden", className)}>
      <Link href={href} className="relative block aspect-square overflow-hidden bg-sunken" aria-label={product.title}>
        <ProductImage product={product} priority={priority} className="transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.04]" />
        <span className="absolute top-3 right-3 flex flex-col items-start gap-1.5">
          {pct >= 5 ? <span className="badge badge-urgency num">٪{formatNumber(pct)} تخفیف</span> : null}
          {product.badge ? <span className="badge badge-gold">{product.badge}</span> : null}
          {!product.inStock ? <span className="badge badge-ink">ناموجود</span> : null}
        </span>
      </Link>
      <WishlistButton productId={product.id} initial={wished} className="absolute top-3 left-3" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 md:p-4">
        <div className="flex items-center justify-between gap-2 text-[0.72rem] text-muted">
          <span className="truncate">{product.category.name}</span>
          <span className="flex shrink-0 items-center gap-1">
            {product.type === "digital" ? <Download className="size-3.5" aria-hidden /> : <Truck className="size-3.5" aria-hidden />}
            {product.type === "digital" ? "تحویل فوری" : "ارسال فیزیکی"}
          </span>
        </div>
        <h3 className="line-clamp-2 min-h-[3.1em] text-[0.93rem] leading-[1.6] font-bold md:text-[0.98rem]">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] hover:text-primary">
            {product.title}
          </Link>
        </h3>
        {product.ratingCount > 0 ? <Stars value={product.ratingAvg} count={product.ratingCount} size={12} /> : <span className="h-[18px]" />}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-1">
          <Price value={product.price} compareAt={product.compareAt} showPercent={false} />
          {product.hasVariants || !product.inStock ? (
            <Link href={href} className="btn btn-outline btn-sm relative z-[1]">
              {product.inStock ? "انتخاب" : "مشاهده"}
            </Link>
          ) : (
            <AddToCartButton
              iconOnly
              variant="action"
              className="relative z-[1] !size-10 !min-h-10"
              label={`افزودن ${product.title} به سبد`}
              line={{
                productId: product.id,
                variantId: null,
                title: product.title,
                variantTitle: "",
                slug: product.slug,
                image: product.image,
                price: product.price,
                compareAt: product.compareAt,
                type: product.type,
                max: product.stockLeft ?? 99,
              }}
            />
          )}
        </div>
        {product.stockLeft ? <p className="text-[0.75rem] font-bold text-urgency">فقط {formatNumber(product.stockLeft)} عدد باقی مانده</p> : null}
        {product.installments ? <p className="text-[0.72rem] font-semibold text-primary">قابل خرید اقساطی</p> : null}
      </div>
    </article>
  );
}

export function ProductGrid({ products, className, wishlist = [] }: { products: Card[]; className?: string; wishlist?: string[] }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-4", className)}>
      {products.map((product, index) => (
        <ProductCard key={product.id} product={product} priority={index < 4} wished={wishlist.includes(product.id)} />
      ))}
    </div>
  );
}
