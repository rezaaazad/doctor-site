import { readAddons, type Addon } from "./addons";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { asObject, asStringArray } from "@/lib/utils";

export type Spec = { name: string; value: string };
export type ProductOption = { name: string; values: string[] };

export type ProductCard = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  type: string;
  price: number;
  compareAt: number;
  saleEndsAt: string | null;
  image: string;
  images: string[];
  badge: string;
  category: { id: string; slug: string; name: string };
  inStock: boolean;
  stockLeft: number | null;
  ratingAvg: number;
  ratingCount: number;
  salesCount: number;
  installments: boolean;
  hasAddons?: boolean;
  hasVariants: boolean;
  featured: boolean;
  brand: string;
};

export type VariantView = {
  id: string;
  title: string;
  sku: string;
  values: Record<string, string>;
  price: number;
  compareAt: number;
  stock: number;
  inStock: boolean;
  imageUrl: string;
};

export type ProductDetail = ProductCard & {
  description: string;
  blocks: unknown;
  specs: Spec[];
  options: ProductOption[];
  tags: string[];
  guarantee: string;
  sku: string;
  variants: VariantView[];
  stock: number;
  maxPerOrder: number;
  manageStock: boolean;
  allowBackorder: boolean;
  weightGrams: number;
  turnaroundLabel: string;
  addons: Addon[];
  licenseNote: string;
  seoTitle: string;
  seoDescription: string;
  createdAt: string;
  updatedAt: string;
};

export const productInclude = {
  category: { select: { id: true, slug: true, name: true } },
  variants: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.StoreProductInclude;

type ProductRow = Prisma.StoreProductGetPayload<{ include: typeof productInclude }>;

export function readSpecs(value: unknown): Spec[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = asObject(item);
      return { name: String(row.name ?? "").trim(), value: String(row.value ?? "").trim() };
    })
    .filter((item) => item.name && item.value);
}

export function readOptions(value: unknown): ProductOption[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = asObject(item);
      return { name: String(row.name ?? "").trim(), values: asStringArray(row.values).map((v) => v.trim()).filter(Boolean) };
    })
    .filter((item) => item.name && item.values.length);
}

function variantView(variant: ProductRow["variants"][number], manageStock: boolean, allowBackorder: boolean): VariantView {
  const values = Object.fromEntries(Object.entries(asObject(variant.values)).map(([k, v]) => [k, String(v)]));
  return {
    id: variant.id,
    title: variant.title,
    sku: variant.sku,
    values,
    price: Number(variant.priceRial),
    compareAt: Number(variant.compareAtRial ?? 0),
    stock: variant.stock,
    inStock: variant.active && (!manageStock || allowBackorder || variant.stock > 0),
    imageUrl: variant.imageUrl,
  };
}

export function toCard(row: ProductRow, lowStockThreshold = 3): ProductCard {
  const images = asStringArray(row.images);
  const variants = row.variants.filter((v) => v.active).map((v) => variantView(v, row.manageStock, row.allowBackorder));
  const hasVariants = variants.length > 0;
  const prices = hasVariants ? variants.map((v) => v.price) : [Number(row.priceRial)];
  const price = Math.min(...prices);
  const compareSource = hasVariants ? variants.find((v) => v.price === price)?.compareAt ?? 0 : Number(row.compareAtRial ?? 0);
  const saleActive = !row.saleEndsAt || row.saleEndsAt.getTime() > Date.now();
  const totalStock = hasVariants ? variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0) : row.stock;
  const inStock = hasVariants ? variants.some((v) => v.inStock) : !row.manageStock || row.allowBackorder || row.stock > 0;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    summary: row.summary,
    type: row.type,
    price,
    compareAt: saleActive && compareSource > price ? compareSource : 0,
    saleEndsAt: saleActive && row.saleEndsAt ? row.saleEndsAt.toISOString() : null,
    image: images[0] || "",
    images,
    badge: row.badge,
    category: row.category,
    inStock,
    stockLeft: row.manageStock && inStock && totalStock > 0 && totalStock <= lowStockThreshold ? totalStock : null,
    ratingAvg: row.ratingAvg,
    ratingCount: row.ratingCount,
    salesCount: row.salesCount,
    installments: row.installments,
    hasAddons: readAddons(row.addons).length>0,
    hasVariants,
    featured: row.featured,
    brand: row.brand,
  };
}

export function toDetail(row: ProductRow, lowStockThreshold = 3): ProductDetail {
  return {
    ...toCard(row, lowStockThreshold),
    description: row.description,
    blocks: row.blocks,
    specs: readSpecs(row.specs),
    options: readOptions(row.options),
    tags: asStringArray(row.tags),
    guarantee: row.guarantee,
    sku: row.sku,
    variants: row.variants.filter((v) => v.active).map((v) => variantView(v, row.manageStock, row.allowBackorder)),
    stock: row.stock,
    maxPerOrder: row.maxPerOrder,
    manageStock: row.manageStock,
    allowBackorder: row.allowBackorder,
    weightGrams: row.weightGrams,
    turnaroundLabel: row.turnaroundLabel,
    addons: readAddons(row.addons),
    licenseNote: row.licenseNote,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type CatalogQuery = {
  category?: string;
  q?: string;
  type?: string;
  sort?: string;
  inStock?: boolean;
  min?: number;
  max?: number;
  onSale?: boolean;
  page?: number;
  perPage?: number;
};

export function catalogOrder(sort: string | undefined): Prisma.StoreProductOrderByWithRelationInput[] {
  switch (sort) {
    case "cheap":
      return [{ priceRial: "asc" }];
    case "expensive":
      return [{ priceRial: "desc" }];
    case "bestseller":
      return [{ salesCount: "desc" }, { createdAt: "desc" }];
    case "rating":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    default:
      return [{ featured: "desc" }, { sortOrder: "asc" }, { salesCount: "desc" }, { createdAt: "desc" }];
  }
}

export async function categoryTreeIds(slug: string) {
  const all = await prisma.storeCategory.findMany({ select: { id: true, slug: true, parentId: true } });
  const root = all.find((item) => item.slug === slug);
  if (!root) return [];
  const ids = [root.id];
  for (let i = 0; i < ids.length; i++) for (const item of all) if (item.parentId === ids[i]) ids.push(item.id);
  return ids;
}

export async function queryCatalog(query: CatalogQuery) {
  const perPage = Math.min(60, Math.max(1, query.perPage ?? 24));
  const page = Math.max(1, query.page ?? 1);
  const where: Prisma.StoreProductWhereInput = { published: true, type: { in: ["service","digital"] } };
  if (query.category) where.categoryId = { in: await categoryTreeIds(query.category) };
  if (query.type === "digital" || query.type === "service") where.type = query.type;
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: "insensitive" } },
      { summary: { contains: query.q, mode: "insensitive" } },
      { sku: { equals: query.q } },
      { brand: { contains: query.q, mode: "insensitive" } },
    ];
  }
  const conditions: Prisma.StoreProductWhereInput[] = [];
  if (query.min !== undefined || query.max !== undefined) {
    const gte = query.min === undefined ? undefined : BigInt(query.min) * BigInt(10);
    const lte = query.max === undefined ? undefined : BigInt(query.max) * BigInt(10);
    // Variable product cards advertise the lowest active variant price.
    conditions.push({ OR: [
      { variants: { none: { active: true } }, priceRial: { gte, lte } },
      { variants: {
        some: { active: true, priceRial: { lte } },
        ...(gte === undefined ? {} : { none: { active: true, priceRial: { lt: gte } } }),
      } },
    ] });
  }
  if (query.onSale) {
    conditions.push(
      { OR: [{ saleEndsAt: null }, { saleEndsAt: { gt: new Date() } }] },
      { OR: [
        { variants: { none: { active: true } }, compareAtRial: { gt: prisma.storeProduct.fields.priceRial } },
        { variants: { some: { active: true, compareAtRial: { gt: prisma.productVariant.fields.priceRial } } } },
      ] },
    );
  }
  if (query.inStock) conditions.push({ OR: [
    { manageStock: false }, { allowBackorder: true },
    { variants: { none: { active: true } }, stock: { gt: 0 } },
    { variants: { some: { active: true, stock: { gt: 0 } } } },
  ] });
  if (conditions.length) where.AND = conditions;
  const [total, rows] = await Promise.all([
    prisma.storeProduct.count({ where }),
    prisma.storeProduct.findMany({ where, include: productInclude, orderBy: catalogOrder(query.sort), skip: (page - 1) * perPage, take: perPage }),
  ]);
  return { total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)), products: rows.map((row) => toCard(row)) };
}

export async function productCards(where: Prisma.StoreProductWhereInput, orderBy: Prisma.StoreProductOrderByWithRelationInput[], take: number) {
  const rows = await prisma.storeProduct.findMany({ where: { published: true, type: { in: ["digital","service"] }, ...where }, include: productInclude, orderBy, take });
  return rows.map((row) => toCard(row));
}

export async function getProduct(slug: string) {
  const row = await prisma.storeProduct.findUnique({ where: { slug }, include: productInclude });
  if (!row || !row.published || !["digital","service"].includes(row.type)) return null;
  return toDetail(row);
}

export async function storeCategories() {
  const rows = await prisma.storeCategory.findMany({
    where: { visible: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { published: true,type:{in:["service","digital"]} } } } } },
  });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.imageUrl,
    icon: row.icon,
    parentId: row.parentId,
    featured: row.featured,
    count: row._count.products,
  }));
}

export type CategoryView = Awaited<ReturnType<typeof storeCategories>>[number];
