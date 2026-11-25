// Read-only seller catalog for Snapp Shop, compatible with the official "SnappShop Sellers" connector contract:
// GET status, products (paged), products/{code}, resolve?url=, categories, attributes. Responses: { status, data }.

import { timingSafeEqual } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGroup } from "@/lib/options";
import { siteUrl, asObject, asStringArray } from "@/lib/utils";
import { readSpecs, readOptions } from "@/lib/store/catalog";

export const SNAPPSHOP_BASE = "/api/snappshop/v1";

export function ok(data: unknown, init: ResponseInit = {}) {
  return Response.json({ status: true, data }, { ...init, headers: { "Cache-Control": "private, no-store", Vary: "Authorization", ...(init.headers ?? {}) } });
}

export function fail(message: string, status: number) {
  return Response.json({ status: false, data: null, message }, { status, headers: { "Cache-Control": "private, no-store", Vary: "Authorization" } });
}

export async function authorizeSnappshop(request: Request): Promise<Response | null> {
  const cfg = await getGroup("snappshop");
  if (!cfg.enabled) return fail("اتصال اسنپ‌شاپ غیرفعال است.", 404);
  if (!cfg.requireToken) return null;
  const header = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) return fail("توکن دسترسی Bearer الزامی است.", 401);
  const expected = Buffer.from(String(cfg.token || ""));
  const provided = Buffer.from(match[1].trim());
  if (!expected.length || expected.length !== provided.length || !timingSafeEqual(expected, provided)) return fail("توکن دسترسی معتبر نیست.", 403);
  return null;
}

const include = { category: true, variants: { orderBy: { sortOrder: "asc" } } } satisfies Prisma.StoreProductInclude;
type Row = Prisma.StoreProductGetPayload<{ include: typeof include }>;

function stockOf(row: Row) {
  if (row.variants.length) return row.variants.filter((v) => v.active).reduce((sum, v) => sum + Math.max(0, v.stock), 0);
  if (!row.manageStock) return 1;
  return Math.max(0, row.stock);
}

function apiUrl(code: number) {
  return `${siteUrl()}${SNAPPSHOP_BASE}/products/${code}`;
}

export function listItem(row: Row) {
  const stock = stockOf(row);
  return { id: row.code, code: row.code, active: row.published && stock > 0, stock, url: apiUrl(row.code), price: Number(row.priceRial) / 10 };
}

function absolute(url: string) {
  return /^https?:\/\//i.test(url) ? url : `${siteUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function detail(row: Row) {
  const images = asStringArray(row.images);
  const medias = (images.length ? images : [`/media/cover/${row.slug}`]).map((url, index) => ({ code: `m${index + 1}`, type: "image", url: absolute(url) }));
  const specs = readSpecs(row.specs).map((s) => ({ name: s.name, value: [s.value] }));
  specs.push({ name: "نوع محصول", value: [row.type === "digital" ? "دیجیتال" : "اجرای تخصصی پروژه"] });
  if (row.weightGrams > 0) specs.push({ name: "وزن", value: [`${row.weightGrams} گرم`] });
  const options = readOptions(row.options);
  const stock = stockOf(row);
  return {
    id: row.code,
    code: row.code,
    title: row.title,
    description: (row.description || row.summary).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    specs,
    category: { code: row.category.slug, name: row.category.name },
    categories: [row.category.name],
    brand: row.brand || "متفرقه",
    stock,
    active: row.published && stock > 0,
    is_fake: false,
    price: Number(row.priceRial) / 10,
    old_price: row.compareAtRial ? Number(row.compareAtRial) / 10 : null,
    guarantee: row.guarantee,
    variations: row.variants.map((v) => {
      const values = asObject(v.values);
      return {
        id: v.sortOrder + 1,
        sku: v.sku,
        active: v.active && (!row.manageStock || v.stock > 0),
        stock: Math.max(0, v.stock),
        price: Number(v.priceRial) / 10,
        specs: (options.length ? options.map((o) => o.name) : Object.keys(values)).filter((k) => values[k] !== undefined).map((name) => ({ name, value: String(values[name]) })),
        medias: v.imageUrl ? [`v${v.sortOrder + 1}`] : medias.slice(0, 1).map((m) => m.code),
      };
    }),
    medias,
    cover_image: medias[0].code,
    url: `${siteUrl()}/store/${row.slug}`,
  };
}

export async function listProducts(params: URLSearchParams) {
  const page = Math.max(1, Number(params.get("page") || params.get("current_page") || 1) || 1);
  const perRaw = Number(params.get("per_page") || 0);
  const perPage = perRaw > 0 ? Math.min(100, perRaw) : 24;
  const where: Prisma.StoreProductWhereInput = { published: true, type:{in:["digital","service"]}, snappEnabled: true };
  const category = params.get("category");
  if (category) where.category = { slug: { in: category.split(",").map((c) => c.trim()).filter(Boolean) } };
  const search = params.get("search");
  if (search) where.title = { contains: search, mode: "insensitive" };
  if (params.get("stock_status") === "instock") where.OR = [{ manageStock: false }, { stock: { gt: 0 } }, { variants: { some: { stock: { gt: 0 }, active: true } } }];
  const min = Number(params.get("min_price") || 0);
  const max = Number(params.get("max_price") || 0);
  if (min || max) where.priceRial = { ...(min ? { gte: BigInt(Math.round(min * 10)) } : {}), ...(max ? { lte: BigInt(Math.round(max * 10)) } : {}) };
  const orderby = params.get("orderby") || "date";
  const dir = (params.get("order") || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const orderBy: Prisma.StoreProductOrderByWithRelationInput =
    orderby === "price" ? { priceRial: dir } : orderby === "popularity" ? { salesCount: dir } : orderby === "title" ? { title: dir } : orderby === "id" ? { code: dir } : orderby === "modified" ? { updatedAt: dir } : { createdAt: dir };
  const [total, rows] = await Promise.all([
    prisma.storeProduct.count({ where }),
    prisma.storeProduct.findMany({ where, include, orderBy, skip: (page - 1) * perPage, take: perPage }),
  ]);
  return { products: rows.map(listItem), current_page: page, per_page: perPage, total_items: total, total_pages: Math.ceil(total / perPage) };
}

export async function productByCode(code: number) {
  if (!Number.isInteger(code) || code <= 0) return null;
  const row = await prisma.storeProduct.findUnique({ where: { code }, include });
  if (!row || !row.published || !row.snappEnabled || !["service","digital"].includes(row.type)) return null;
  return detail(row);
}

export async function resolveUrl(raw: string) {
  let url: URL;
  try {
    url = new URL(raw, siteUrl());
  } catch {
    return null;
  }
  if (url.host !== new URL(siteUrl()).host) return null;
  const path = decodeURIComponent(url.pathname).replace(/\/+$/, "");
  const productMatch = /^\/store\/([^/]+)$/.exec(path);
  if (productMatch) {
    const row = await prisma.storeProduct.findUnique({ where: { slug: productMatch[1] }, select: { code: true, published: true,type:true,snappEnabled:true } });
    if (row?.published && row.snappEnabled && ["digital","service"].includes(row.type)) return { type: "product", api_url: apiUrl(row.code) };
    const category = await prisma.storeCategory.findUnique({ where: { slug: productMatch[1] }, select: { slug: true } });
    if (category) return { type: "category", api_url: `${siteUrl()}${SNAPPSHOP_BASE}/products?category=${encodeURIComponent(category.slug)}` };
    return null;
  }
  const categoryMatch = /^\/store\/category\/([^/]+)$/.exec(path);
  if (categoryMatch) return { type: "category", api_url: `${siteUrl()}${SNAPPSHOP_BASE}/products?category=${encodeURIComponent(categoryMatch[1])}` };
  if (path === "/store" || path === "") return { type: "shop", api_url: `${siteUrl()}${SNAPPSHOP_BASE}/products` };
  return null;
}

export async function categories() {
  const rows = await prisma.storeCategory.findMany({
    where: { products: { some: { published: true, type:{in:["digital","service"]}, snappEnabled: true } } },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true, sortOrder: true },
  });
  return rows.map((row, index) => ({ id: index + 1, code: row.slug, name: row.name }));
}

export async function attributes() {
  const attrs = await prisma.productAttribute.findMany({ orderBy: { sortOrder: "asc" } });
  return attrs.map((a, index) => ({
    id: index + 1,
    code: a.slug,
    name: a.name,
    options: asStringArray(a.values).map((v) => ({ code: v, name: v })),
  }));
}
