import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, productCards } from "@/lib/store/catalog";
import { buildMetadata } from "@/lib/seo";
import { getCustomer } from "@/lib/customer-auth";
import { getOptions } from "@/lib/options";
import { prisma } from "@/lib/db";
import { parseBlocks } from "@/lib/blocks";
import { Blocks } from "@/components/content/blocks";
import { ProductBuy } from "@/components/store/product-buy";
import { DetailTabs } from "@/components/store/detail-tabs";
import { JsonLd } from "@/components/site/json-ld";
import { siteUrl } from "@/lib/utils";
import { ProductCard } from "@/components/store/product-card";
import { Breadcrumbs } from "@/components/ui/bits";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return buildMetadata({
    path: `/store/${slug}`,
    image: product.image,
    title: product.seoTitle || product.title,
    description: product.seoDescription || product.summary,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const [customer, options, related, reviews] = await Promise.all([
    getCustomer().catch(() => null),
    getOptions(),
    productCards({ categoryId: product.category.id, id: { not: product.id } }, [{ salesCount: "desc" }], 8),
    prisma.comment.findMany({
      where: { targetType: "product", targetId: product.id, status: "approved" },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);
  const wished = customer
    ? !!(await prisma.wishlistItem
        .findUnique({ where: { customerId_productId: { customerId: customer.id, productId: product.id } } })
        .catch(() => null))
    : false;
  const blocks = parseBlocks(product.blocks);
  const specs = product.specs;

  return (
    <div className="wrap pad pb-[calc(10rem+env(safe-area-inset-bottom))] lg:pb-16">
      <Breadcrumbs
        className="mb-5 pt-5"
        items={[
          { label: "خانه", href: "/" },
          { label: "فروشگاه", href: "/store" },
          { label: product.category.name, href: `/store/category/${product.category.slug}` },
          { label: product.title },
        ]}
      />
      <ProductBuy product={product} wished={wished} guarantee={String(options.store.guaranteeText || "")} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          description: product.summary,
          brand: product.brand ? {"@type":"Brand",name:product.brand} : undefined,
          category: product.category.name,
          sku: product.sku || undefined,
          image: [...new Set([product.image, ...product.images].filter(Boolean))].map(
            (src) => new URL(src, siteUrl()).href,
          ),
          offers: {
            ...(product.variants.length > 1 ? {"@type":"AggregateOffer", offerCount:product.variants.length, lowPrice:Math.min(...product.variants.map(v=>v.price)), highPrice:Math.max(...product.variants.map(v=>v.price))} : {"@type":"Offer",price:product.variants[0]?.price ?? product.price}),
            url: siteUrl() + "/store/" + product.slug,
            priceCurrency: "IRR",
            availability: "https://schema.org/" + (product.inStock ? "InStock" : "OutOfStock"),
          },
          aggregateRating: product.ratingCount
            ? { "@type": "AggregateRating", ratingValue: product.ratingAvg, ratingCount: product.ratingCount }
            : undefined,
        }}
      />
      <DetailTabs
        panels={[
          <div key="description">
            <p className="whitespace-pre-line">{product.description || product.summary}</p>
            {blocks.length > 0 && <Blocks blocks={blocks} />}
          </div>,
          specs.length ? (
            <dl key="specs">
              {specs.map((spec, i) => (
                <div className="detail-spec" key={i}>
                  <dt>{spec.name}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            "مشخصاتی برای این محصول ثبت نشده است."
          ),
          reviews.length ? (
            <ul key="reviews">
              {reviews.map((r) => (
                <li className="detail-review" key={r.id}>
                  <b>{r.name}</b> {r.rating ? <span>{r.rating.toLocaleString("fa-IR")} از ۵</span> : null}
                  <p>{r.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            "هنوز دیدگاهی برای این محصول منتشر نشده است."
          ),
        ]}
      />

      {related.length ? (
        <section id="related" className="mt-16" data-reveal>
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="font-display text-[1.35rem] font-extrabold">محصولات مرتبط</h2>
            <Link
              href={`/store/category/${product.category.slug}`}
              className="text-[0.82rem] font-semibold text-primary hover:underline"
            >
              همه {product.category.name}
            </Link>
          </div>
          <div className="related-rail" tabIndex={0} role="region" aria-label="مرور محصولات مرتبط">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
