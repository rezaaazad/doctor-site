import Link from "next/link";
import { prisma } from "@/lib/db";
import type { Metadata } from "next";
import { HomeView } from "@/components/site/home-view";
import { getLocale, getSiteSafe } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSafe();
  return pageMetadata(site.seo.find((entry) => entry.id === "home"), site.settings, "/");
}

export default async function HomePage() {
  const [site, locale] = await Promise.all([getSiteSafe(), getLocale()]);
  const products = await prisma.storeProduct.findMany({
    where: { published: true },
    orderBy: [{ title: "asc" }, { id: "asc" }],
    take: 4,
    select: { slug: true, title: true, priceRial: true, category: { select: { name: true } } },
  }).catch(() => []);
  const catalog = products.length > 0 && (
    <section className="studio-catalog wrap pad">
      <h2>محصولات فروشگاه</h2>
      <ul>{products.map((p) => (
        <li key={p.slug}><Link href={"/store/" + encodeURIComponent(p.slug)}>
          <small>{p.category.name}</small><strong>{p.title}</strong>
          <span>{p.priceRial.toLocaleString("fa-IR")} ریال</span>
        </Link></li>
      ))}</ul>
    </section>
  );
  return <HomeView site={site} locale={locale} catalog={catalog} />;
}
