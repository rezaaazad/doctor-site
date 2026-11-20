import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "فروشگاه محصولات دیجیتال",
  description: "افزونه‌ها و ابزارهای اتوماسیون دکتر سایت برای کسب‌وکارهای آنلاین",
};

const price = new Intl.NumberFormat("fa-IR");

export default async function StorePage() {
  const products = await prisma.storeProduct.findMany({
    where: { published: true },
    select: { id: true, slug: true, title: true, summary: true, priceRial: true, category: { select: { name: true } } },
    orderBy: [{ title: "asc" }, { id: "asc" }],
  });

  return (
    <div className="wrap pad pb-16">
      <header className="studio-store-banner"><h1>فروشگاه محصولات دیجیتال</h1></header>
      {products.length === 0 && <p>هنوز محصولی برای فروش منتشر نشده است.</p>}
      <ul className="grid gap-6 sm:grid-cols-2">
        {products.map((product) => (
          <li key={product.id} className="rounded-xl border p-6">
            <span className="muted">{product.category.name}</span>
            <h2 className="my-2 text-xl font-bold">
              <Link href={"/store/" + encodeURIComponent(product.slug)}>{product.title}</Link>
            </h2>
            <p>{product.summary}</p>
            <p className="mt-4">{price.format(product.priceRial)} ریال</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
