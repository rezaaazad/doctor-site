import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { prisma } from "@/lib/db";
import { queryCatalog, storeCategories } from "@/lib/store/catalog";
import { buildMetadata } from "@/lib/seo";
import { getCustomer } from "@/lib/customer-auth";
import { ProductGrid } from "@/components/store/product-card";
import { CatalogToolbar } from "@/components/store/catalog-toolbar";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await prisma.storeCategory.findUnique({ where: { slug } });
  if (!cat) return { title: "دسته پیدا نشد" };
  return buildMetadata({
    path: `/store/category/${slug}`,
    title: cat.seoTitle || cat.name,
    description: cat.seoDescription || cat.description || cat.name,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const cat = await prisma.storeCategory.findUnique({ where: { slug, visible: true } });
  if (!cat) notFound();
  const page = Math.max(1, Number(sp.page) || 1);
  const sort = typeof sp.sort === "string" ? sp.sort : "";
  const q = typeof sp.q === "string" ? sp.q : "";
  const [catalog, categories, customer] = await Promise.all([
    queryCatalog({ category: slug, sort, q, page, perPage: 24 }),
    storeCategories(),
    getCustomer().catch(() => null),
  ]);
  const wishlist = customer
    ? (await prisma.wishlistItem.findMany({ where: { customerId: customer.id }, select: { productId: true } }).catch(() => [])).map((w) => w.productId)
    : [];

  return (
    <div className="wrap pad pb-20">
      <div className="mb-8 max-w-2xl" data-reveal>
        <Link href="/store" className="text-[0.82rem] font-semibold text-primary hover:underline">
          همه محصولات
        </Link>
        <h1 className="mt-3 font-display text-[2rem] font-extrabold md:text-[2.4rem]">{cat.name}</h1>
        {cat.description ? <p className="mt-3 text-[0.95rem] leading-7 text-muted">{cat.description}</p> : null}
      </div>
      <Suspense>
        <CatalogToolbar categories={categories} total={catalog.total} />
      </Suspense>
      <ProductGrid products={catalog.products} wishlist={wishlist} />
    </div>
  );
}