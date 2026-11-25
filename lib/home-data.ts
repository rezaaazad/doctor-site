import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getOptions } from "@/lib/options";
import { getSiteSafe } from "@/lib/site";
import { lines, mergeContent, sectionDef, str } from "@/lib/sections";
import { productCards, storeCategories, toCard, productInclude, type ProductCard } from "@/lib/store/catalog";

export type HomeSection = { id: string; key: string; content: Record<string, unknown>; products?: ProductCard[] };

const ORDERS: Record<string, Prisma.StoreProductOrderByWithRelationInput[]> = {
  featured: [{ featured: "desc" }, { sortOrder: "asc" }, { salesCount: "desc" }],
  bestseller: [{ salesCount: "desc" }, { ratingAvg: "desc" }],
  newest: [{ createdAt: "desc" }],
  sale: [{ saleEndsAt: "asc" }, { salesCount: "desc" }],
  rating: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
};

export async function productsFor(content: Record<string, unknown>, fallbackLimit: number) {
  const source = str(content.source, "featured");
  const limit = Math.min(24, Math.max(1, Number(content.limit) || fallbackLimit));
  const where: Prisma.StoreProductWhereInput = {};
  const category = str(content.category).trim();
  if (category) where.category = { slug: category };
  if (source === "manual") {
    const slugs = lines(content.slugs);
    if (!slugs.length) return [];
    const rows = await productCards({ slug: { in: slugs } }, [{ sortOrder: "asc" }], 24);
    return slugs.map((s) => rows.find((r) => r.slug === s)).filter((r): r is ProductCard => Boolean(r)).slice(0, limit);
  }
  if (source === "featured") {
    const featured = await productCards({ ...where, featured: true }, ORDERS.featured, limit);
    if (featured.length >= limit) return featured;
    const fill = await productCards({ ...where, id: { notIn: featured.map((p) => p.id) } }, ORDERS.bestseller, limit - featured.length);
    return [...featured, ...fill];
  }
  if (source === "sale") where.compareAtRial = { not: null };
  return productCards(where, ORDERS[source] ?? ORDERS.featured, limit);
}

export async function dealProduct(slug: string) {
  const now = new Date();
  const where: Prisma.StoreProductWhereInput = slug
    ? { slug, published: true }
    : { published: true, compareAtRial: { not: null }, saleEndsAt: { gt: now } };
  const row = await prisma.storeProduct.findFirst({ where:{...where,type:{in:["service","digital"]}}, include: productInclude, orderBy: { saleEndsAt: "asc" } });
  if (!row) return null;
  const card = toCard(row);
  if (!card.saleEndsAt || card.compareAt <= card.price) return null;
  return { ...card, stock: row.manageStock ? row.stock : null };
}

export async function loadHome() {
  const { promoteDueLandingPages } = await import("@/lib/editorial-public");
  await promoteDueLandingPages();
  const [site, options] = await Promise.all([getSiteSafe(), getOptions()]);
  const rows = site.sections.filter((s) => s.page === "home" && s.visible && !(s.key === "pricing" && site.sections.some(other => other.page === "home" && other.key === "pricingPlans")) && sectionDef("home", s.key)).sort((a, b) => a.sortOrder - b.sortOrder);
  const sections: HomeSection[] = await Promise.all(
    rows.map(async (row) => {
      const def = sectionDef("home", row.key);
      const content = mergeContent(def, row.content);
      const section: HomeSection = { id: row.id, key: def?.key ?? row.key, content };
      if (["featuredProducts", "bestsellers", "newArrivals"].includes(row.key)) {
        section.products = await productsFor(content, Number(def?.defaults.limit) || 8).catch(() => []);
      }
      if (row.key === "dealOfDay") {
        const candidates = await productCards({saleEndsAt:{gt:new Date()},compareAtRial:{not:null}}, ORDERS.sale, 16).catch(() => []);
        section.products = candidates.filter(product => product.inStock && product.compareAt > product.price);
      }
      return section;
    }),
  );
  if (site.packages.length && !site.sections.some(s => s.page === "home" && ["pricing", "pricingPlans"].includes(s.key))) {
    sections.push({ id: "default-pricing", key: "pricingPlans", content: mergeContent(sectionDef("home", "pricingPlans"), {}) });
  }
  const needs = new Set(sections.map((s) => s.key));
  const [categories, spotlight, deal, reviewStats, reviews] = await Promise.all([
    needs.has("categoryGrid") || needs.has("storeHero") ? storeCategories().catch(() => []) : Promise.resolve([]),
    needs.has("storeHero") ? heroProduct(str(sections.find((s) => s.key === "storeHero")?.content.spotlight)) : Promise.resolve(null),
    needs.has("dealOfDay") ? dealProduct(str(sections.find((s) => s.key === "dealOfDay")?.content.product)).catch(() => null) : Promise.resolve(null),
    prisma.comment.aggregate({ where: { targetType: "product", status: "approved", rating: { not: null } }, _avg: { rating: true }, _count: { _all: true } }).catch(() => null),
    needs.has("socialProof")
      ? prisma.comment.findMany({ where: { targetType: "product", status: "approved", rating: { gte: 4 } }, orderBy: { createdAt: "desc" }, take: 6 }).catch(() => [])
      : Promise.resolve([]),
  ]);
  const productTitles = reviews.length
    ? new Map((await prisma.storeProduct.findMany({ where: { id: { in: reviews.map((r) => r.targetId) } }, select: { id: true, title: true, slug: true } })).map((p) => [p.id, p]))
    : new Map<string, { id: string; title: string; slug: string }>();
  return {
    site,
    options,
    sections,
    categories,
    spotlight,
    deal,
    reviewStats: { avg: reviewStats?._avg.rating ?? 0, count: reviewStats?._count._all ?? 0 },
    reviews: reviews.map((r) => ({ id: r.id, name: r.name, body: r.body, rating: r.rating ?? 5, verified: r.verified, product: productTitles.get(r.targetId) ?? null })),
    installmentsOn: Boolean(options.pay_snapppay.enabled || options.pay_torobpay.enabled),
  };
}

async function heroProduct(slug: string) {
  const rows = await productCards(slug ? { slug } : { featured: true }, [{ sortOrder: "asc" }, { salesCount: "desc" }], 1).catch(() => []);
  if (rows[0]) return rows[0];
  const any = await productCards({}, [{ salesCount: "desc" }], 1).catch(() => []);
  return any[0] ?? null;
}

export type HomeData = Awaited<ReturnType<typeof loadHome>>;
