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
import { ProductGrid } from "@/components/store/product-card";
import { Breadcrumbs } from "@/components/ui/bits";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "محصول پیدا نشد" };
  return buildMetadata({
    path: `/store/${slug}`,
    title: product.seoTitle || product.title,
    description: product.seoDescription || product.summary,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const [customer, options, related] = await Promise.all([
    getCustomer().catch(() => null),
    getOptions(),
    productCards({ categoryId: product.category.id, id: { not: product.id } }, [{ salesCount: "desc" }], 4),
  ]);
  const wished = customer ? !!(await prisma.wishlistItem.findUnique({ where: { customerId_productId: { customerId: customer.id, productId: product.id } } }).catch(() => null)) : false;
  const blocks = parseBlocks(product.blocks);
  const specs = product.specs;

  return (
    <div className="wrap pad pb-[calc(10rem+env(safe-area-inset-bottom))] lg:pb-16">
      <Breadcrumbs className="mb-5 pt-5" items={[{label:"خانه",href:"/"},{label:"فروشگاه",href:"/store"},{label:product.category.name,href:`/store/category/${product.category.slug}`},{label:product.title}]}/>
      <ProductBuy product={product} wished={wished} guarantee={String(options.store.guaranteeText || "")} />
      <nav aria-label="جزئیات محصول" className="card mt-8 flex flex-wrap gap-2 p-2"><a href="#description" className="btn btn-ghost">توضیحات</a>{specs.length>0&&<a href="#specifications" className="btn btn-ghost">مشخصات</a>}{related.length>0&&<a href="#related" className="btn btn-ghost">محصولات مرتبط</a>}</nav>
      <section id="description" className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]" data-reveal>
        <div>
          {product.description ? (
            <div className="mb-8 whitespace-pre-line text-[0.95rem] leading-8 text-muted">{product.description}</div>
          ) : null}
          {blocks.length ? <Blocks blocks={blocks} /> : null}
        </div>
        {specs.length ? (
          <aside id="specifications" className="card h-fit p-4">
            <h2 className="mb-3 font-bold">مشخصات</h2>
            <dl className="divide-y divide-line text-[0.85rem]">
              {specs.map((s) => (
                <div key={s.name} className="flex justify-between gap-3 py-2.5">
                  <dt className="text-muted">{s.name}</dt>
                  <dd className="font-semibold">{s.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        ) : null}
      </section>

      {related.length ? (
        <section id="related" className="mt-16" data-reveal>
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="font-display text-[1.35rem] font-extrabold">محصولات مرتبط</h2>
            <Link href={`/store/category/${product.category.slug}`} className="text-[0.82rem] font-semibold text-primary hover:underline">
              همه {product.category.name}
            </Link>
          </div>
          <ProductGrid products={related} className="lg:grid-cols-4" />
        </section>
      ) : null}
    </div>
  );
}
