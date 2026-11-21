import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { queryCatalog, storeCategories } from "@/lib/store/catalog";
import { buildMetadata } from "@/lib/seo";
import { getCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { ProductGrid } from "@/components/store/product-card";
import { CatalogToolbar } from "@/components/store/catalog-toolbar";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/store", title: "فروشگاه", description: "محصولات دیجیتال و فیزیکی دکتر سایت — قالب، افزونه، دوره و پکیج" });
}

export default async function StorePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const sort = typeof sp.sort === "string" ? sp.sort : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const page = Math.max(1, Number(sp.page) || 1);
  const [catalog, categories, customer] = await Promise.all([
    queryCatalog({ q, sort, category, page, perPage: 24, onSale: sp.sale === "1" || undefined, inStock: sp.stock === "1" || undefined }),
    storeCategories(),
    getCustomer().catch(() => null),
  ]);
  const wishlist = customer
    ? (await prisma.wishlistItem.findMany({ where: { customerId: customer.id }, select: { productId: true } }).catch(() => [])).map((w) => w.productId)
    : [];

  return (
    <div className="wrap pad pb-20">
      <div className="mb-8 max-w-2xl" data-reveal>
        <p className="kicker">فروشگاه دکتر سایت</p>
        <h1 className="mt-2 font-display text-[2rem] font-extrabold md:text-[2.6rem]">هر آنچه برای فروش آنلاین نیاز دارید</h1>
        <p className="mt-3 text-[0.95rem] leading-7 text-muted">قالب‌های آماده، افزونه، دوره آموزشی و پکیج راه‌اندازی — با پشتیبانی فارسی و اتصال به درگاه‌های ایرانی.</p>
      </div>

      <Suspense fallback={<div className="h-24 animate-pulse rounded-xl bg-sunken" />}>
        <CatalogToolbar categories={categories} total={catalog.total} />
      </Suspense>

      {catalog.products.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-bold">محصولی با این فیلتر پیدا نشد.</p>
          <Link href="/store" className="btn btn-outline mt-4">
            نمایش همه محصولات
          </Link>
        </div>
      ) : (
        <ProductGrid products={catalog.products} wishlist={wishlist} />
      )}

      {catalog.pages > 1 ? (
        <nav className="mt-10 flex justify-center gap-2" aria-label="صفحه‌بندی">
          {page > 1 ? (
            <Link href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(sort ? { sort } : {}), ...(category ? { category } : {}), page: String(page - 1) }).toString()}`} className="btn btn-outline btn-sm">
              قبلی
            </Link>
          ) : null}
          <span className="flex items-center px-3 text-[0.85rem] text-muted">
            صفحه <span className="num mx-1 font-bold text-fg">{page}</span> از {catalog.pages}
          </span>
          {page < catalog.pages ? (
            <Link href={`?${new URLSearchParams({ ...(q ? { q } : {}), ...(sort ? { sort } : {}), ...(category ? { category } : {}), page: String(page + 1) }).toString()}`} className="btn btn-outline btn-sm">
              بعدی
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}