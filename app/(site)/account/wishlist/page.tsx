import type { Metadata } from "next";
import { requireCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { buildMetadata } from "@/lib/seo";
import { toCard, productInclude } from "@/lib/store/catalog";
import { ProductGrid } from "@/components/store/product-card";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/account/wishlist", title: "علاقه‌مندی‌ها" });
}

export default async function WishlistPage() {
  const customer = await requireCustomer("/account/wishlist");
  const rows = await prisma.wishlistItem.findMany({
    where: { customerId: customer.id },
    include: { product: { include: productInclude } },
    orderBy: { createdAt: "desc" },
  });
  const products = rows.filter((r) => r.product.published).map((r) => toCard(r.product));
  return (
    <section>
      <h1 className="mb-4 font-display text-[1.35rem] font-extrabold">علاقه‌مندی‌ها</h1>
      {products.length === 0 ? <p className="text-muted">لیست خالی است.</p> : <ProductGrid products={products} wishlist={products.map((p) => p.id)} />}
    </section>
  );
}