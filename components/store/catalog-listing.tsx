import Link from "next/link";
import { PhotoSlot } from "@/components/ui/photo-slot";

import { prisma } from "@/lib/db";
import { getCustomer } from "@/lib/customer-auth";
import { queryCatalog, storeCategories } from "@/lib/store/catalog";
import { ProductGrid } from "./product-card";
import { CatalogToolbar } from "./catalog-toolbar";

export type Search = Record<string, string | string[] | undefined>;
export async function CatalogListing({
  search,
  category,
}: {
  search: Search;
  category?: { slug: string; name: string; description: string };
}) {
  const params = new URLSearchParams();
  for (const key of ["type","sort", "category", "stock", "sale", "q", "min", "max"]) {
    const value = search[key];
    if (typeof value === "string" && value) params.set(key, value);
  }
  if (category) params.delete("category");
  const readPrice = (key: string) => {
    const value = params.get(key);
    return value && /^\d{1,14}$/.test(value) ? Number(value) : undefined;
  };
  const page = Math.min(1000000, Math.max(1, Math.floor(Number(search.page) || 1)));
  const [catalog, categories, customer] = await Promise.all([
    queryCatalog({
      type: params.get("type") || "",
      q: params.get("q") || "",
      category: category?.slug || params.get("category") || "",
      sort: params.get("sort") || "",
      min: readPrice("min"),
      max: readPrice("max"),
      inStock: params.get("stock") === "1",
      onSale: params.get("sale") === "1",
      page,
      perPage: 24,
    }),
    storeCategories(),
    getCustomer().catch(() => null),
  ]);
  const wished = customer
    ? await prisma.wishlistItem.findMany({
        where: { customerId: customer.id, productId: { in: catalog.products.map((p) => p.id) } },
        select: { productId: true },
      })
    : [];
  const base = category ? `/store/category/${category.slug}` : "/store";
  function pageUrl(n: number) {
    const query = new URLSearchParams(params);
    query.set("page", String(n));
    return base + "?" + query;
  }
  return (
    <div className="container-x catalog-page">
      <header className="catalog-intro">
        <Link href="/">خانه</Link> / <Link href="/store">فروشگاه</Link>
        <h1>{category?.name || "فروشگاه دکتر سایت"}</h1>
        <p>{category?.description || "پروژه طراحی یا توسعه سایت خود را سفارش دهید، یا با قالب و افزونه آماده شروع کنید."}</p>
      <nav aria-label="دسته‌های فروشگاه" className="mt-4 flex flex-wrap gap-2">{categories.filter(c=>c.count>0).map(c=><Link className="btn btn-outline btn-sm" aria-current={category?.slug===c.slug?"page":undefined} key={c.id} href={"/store/category/"+c.slug}>{c.name}</Link>)}</nav>
      </header>
      <CatalogToolbar categories={categories} total={catalog.total} category={category?.slug}>
        {catalog.products.length ? (
          <ProductGrid
            products={catalog.products}
            wishlist={wished.map((row) => row.productId)}
            className="lg:grid-cols-3"
          />
        ) : (
          <div className="catalog-empty">
            <div className="relative mx-auto aspect-[3/2] w-40"><PhotoSlot src="/images/empty/store.webp" alt="نتیجه‌ای پیدا نشد" sizes="160px" /></div>
            <h2>محصولی پیدا نشد</h2>
            <p>محدوده قیمت یا عبارت جست‌وجو را تغییر دهید.</p>
            <Link href="/store" className="btn btn-outline">
              نمایش همه محصولات
            </Link>
          </div>
        )}
        {(page > 1 || catalog.pages > 1) && (
          <nav className="catalog-pages" aria-label="صفحه‌بندی">
            {page > 1 && <Link href={pageUrl(Math.min(page - 1, catalog.pages))}>صفحه قبل</Link>}
            <span>
              صفحه {page.toLocaleString("fa-IR")} از {catalog.pages.toLocaleString("fa-IR")}
            </span>
            {page < catalog.pages && <Link href={pageUrl(page + 1)}>صفحه بعد</Link>}
          </nav>
        )}
      </CatalogToolbar>
    </div>
  );
}
