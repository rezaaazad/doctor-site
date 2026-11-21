// Torob Product API v3 + product webhook (https://github.com/torob/Torob-Sync).

import { createPublicKey, verify } from "crypto";
import { prisma } from "@/lib/db";
import { fetchWithTimeout, readJson } from "@/lib/http";
import { getGroup } from "@/lib/options";
import { siteUrl, asObject, asStringArray } from "@/lib/utils";
import { readSpecs } from "@/lib/store/catalog";

export const TOROB_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAt6Mu4T0pBORY11W+QeM35UsmLO3vsf+6yKpFDEImFk0=
-----END PUBLIC KEY-----`;

export const TOROB_PAGE_SIZE = 100;
export const TOROB_SORTS = ["date_added_desc", "date_updated_desc", "product_id_desc"] as const;

function b64urlDecode(value: string) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export type TokenCheck = { ok: true } | { ok: false; reason: string };

/** Verifies an EdDSA (Ed25519) JWT from the X-Torob-Token header: signature, exp, nbf and aud. */
export function verifyTorobToken(token: string, audience: string, opts: { publicKey?: string; now?: number } = {}): TokenCheck {
  const parts = token.trim().split(".");
  if (parts.length !== 3) return { ok: false, reason: "malformed token" };
  const [h, p, s] = parts;
  let header: Record<string, unknown>;
  let payload: Record<string, unknown>;
  try {
    header = asObject(JSON.parse(b64urlDecode(h).toString("utf8")));
    payload = asObject(JSON.parse(b64urlDecode(p).toString("utf8")));
  } catch {
    return { ok: false, reason: "malformed token" };
  }
  if (header.alg !== "EdDSA") return { ok: false, reason: "unexpected alg" };
  let valid = false;
  try {
    valid = verify(null, Buffer.from(`${h}.${p}`), createPublicKey(opts.publicKey ?? TOROB_PUBLIC_KEY), b64urlDecode(s));
  } catch {
    valid = false;
  }
  if (!valid) return { ok: false, reason: "bad signature" };
  const now = Math.floor((opts.now ?? Date.now()) / 1000);
  if (typeof payload.exp !== "number" || now > payload.exp) return { ok: false, reason: "expired" };
  if (typeof payload.nbf === "number" && now < payload.nbf) return { ok: false, reason: "not yet valid" };
  const aud = payload.aud;
  const audiences = Array.isArray(aud) ? aud.map(String) : [String(aud ?? "")];
  if (!audiences.includes(audience)) return { ok: false, reason: "audience mismatch" };
  return { ok: true };
}

export function expectedAudience(configured: string, hostHeader: string | null) {
  if (configured.trim()) return configured.trim();
  try {
    return new URL(siteUrl()).host;
  } catch {
    return hostHeader ?? "";
  }
}

export type TorobProduct = {
  page_unique: string;
  page_url: string;
  title: string;
  subtitle?: string;
  product_group_id?: string;
  current_price: number;
  old_price?: number;
  availability: boolean;
  category_name?: string;
  image_links: string[];
  short_desc?: string;
  spec: Record<string, string>;
  guarantee?: string;
  date_added: string;
  date_updated?: string;
};

type Entry = TorobProduct & { _code: number; _added: number; _updated: number };

function absolute(url: string) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${siteUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function productUrl(slug: string, variantId?: string) {
  return `${siteUrl()}/store/${encodeURIComponent(slug)}${variantId ? `?v=${encodeURIComponent(variantId)}` : ""}`;
}

const toman = (rial: bigint | null | undefined) => (rial ? Math.floor(Number(rial) / 10) : 0);
const clip = (value: string, max: number) => (value.length > max ? value.slice(0, max) : value);

async function buildEntries(): Promise<Entry[]> {
  const cfg = await getGroup("torob");
  const rows = await prisma.storeProduct.findMany({
    where: { published: true, torobEnabled: true },
    include: { category: true, variants: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });
  const entries: Entry[] = [];
  for (const row of rows) {
    const images = asStringArray(row.images).map(absolute).filter(Boolean);
    const imageLinks = images.length ? images : [`${siteUrl()}/media/cover/${encodeURIComponent(row.slug)}`];
    const spec = Object.fromEntries(readSpecs(row.specs).map((item) => [clip(item.name, 100), clip(item.value, 300)]));
    const saleActive = !row.saleEndsAt || row.saleEndsAt.getTime() > Date.now();
    const base = {
      title: clip(row.title, 500),
      subtitle: row.subtitle ? clip(row.subtitle, 500) : undefined,
      category_name: clip(row.category.torobName || row.category.name, 200),
      short_desc: row.summary ? clip(row.summary, 500) : undefined,
      guarantee: row.guarantee ? clip(row.guarantee, 200) : undefined,
      date_added: row.createdAt.toISOString(),
      date_updated: row.updatedAt.toISOString(),
      _code: row.code,
      _added: row.createdAt.getTime(),
      _updated: row.updatedAt.getTime(),
    };
    if (row.variants.length) {
      for (const variant of row.variants) {
        const available = !row.manageStock || row.allowBackorder || variant.stock > 0;
        if (!available && !cfg.includeOutOfStock) continue;
        const price = toman(variant.priceRial);
        const old = saleActive ? toman(variant.compareAtRial) : 0;
        const values = Object.fromEntries(Object.entries(asObject(variant.values)).map(([k, v]) => [k, String(v)]));
        entries.push({
          ...base,
          title: clip(`${row.title} - ${variant.title}`, 500),
          page_unique: `${row.code}_${variant.id}`,
          page_url: productUrl(row.slug, variant.id),
          product_group_id: String(row.code),
          current_price: available ? price : 0,
          old_price: available && old > price ? old : undefined,
          availability: available,
          image_links: variant.imageUrl ? [absolute(variant.imageUrl), ...imageLinks] : imageLinks,
          spec: { ...spec, ...values },
        });
      }
    } else {
      const available = !row.manageStock || row.allowBackorder || row.stock > 0;
      if (!available && !cfg.includeOutOfStock) continue;
      const price = toman(row.priceRial);
      const old = saleActive ? toman(row.compareAtRial) : 0;
      entries.push({
        ...base,
        page_unique: String(row.code),
        page_url: productUrl(row.slug),
        current_price: available ? price : 0,
        old_price: available && old > price ? old : undefined,
        availability: available,
        image_links: imageLinks,
        spec,
      });
    }
  }
  return entries;
}

function strip(entry: Entry): TorobProduct {
  const { _code: _c, _added: _a, _updated: _u, ...rest } = entry;
  return rest;
}

export type TorobRequest = Record<string, unknown>;
export type TorobResponse = { status: number; body: Record<string, unknown> };

export async function torobProducts(body: TorobRequest): Promise<TorobResponse> {
  const base = { api_version: "torob_api_v3" };
  const pageUrls = Array.isArray(body.page_urls) ? body.page_urls.map(String).slice(0, 200) : null;
  const pageUniques = Array.isArray(body.page_uniques) ? body.page_uniques.map(String).slice(0, 200) : null;

  if (pageUrls || pageUniques) {
    const entries = await buildEntries();
    const wanted = new Set((pageUrls ?? pageUniques ?? []).map((v) => v.trim()));
    const normalized = (url: string) => {
      try {
        const u = new URL(url);
        return `${u.pathname.replace(/\/+$/, "")}${u.searchParams.get("v") ? `?v=${u.searchParams.get("v")}` : ""}`;
      } catch {
        return url;
      }
    };
    const wantedPaths = new Set([...wanted].map(normalized));
    const products = entries.filter((e) => (pageUniques ? wanted.has(e.page_unique) : wantedPaths.has(normalized(e.page_url)) || wanted.has(e.page_url))).map(strip);
    return { status: 200, body: { ...base, current_page: 1, total: products.length, max_pages: 1, products } };
  }

  const sort = typeof body.sort === "string" ? body.sort : "";
  if (!sort) return { status: 400, body: { error: "sort parameter is not provided" } };
  if (!(TOROB_SORTS as readonly string[]).includes(sort)) return { status: 400, body: { error: "sort parameter is not valid" } };

  const entries = await buildEntries();
  if (sort === "product_id_desc" || "cursor" in body) {
    if ("page" in body || "limit" in body || "size" in body) {
      if ("cursor" in body) return { status: 400, body: { error: "page, limit and size are not allowed with cursor" } };
    }
    if (sort === "product_id_desc" && !("page" in body)) {
      const ordered = entries.sort((a, b) => b._code - a._code || b.page_unique.localeCompare(a.page_unique));
      let start = 0;
      if (body.cursor !== undefined && body.cursor !== null) {
        const cursor = String(body.cursor);
        if (!/^\d+$/.test(cursor)) return { status: 400, body: { error: "cursor is not valid" } };
        start = Number(cursor);
      }
      const slice = ordered.slice(start, start + TOROB_PAGE_SIZE);
      const next = start + TOROB_PAGE_SIZE < ordered.length ? String(start + TOROB_PAGE_SIZE) : null;
      return { status: 200, body: { ...base, total: ordered.length, max_pages: Math.max(1, Math.ceil(ordered.length / TOROB_PAGE_SIZE)), next_cursor: next, products: slice.map(strip) } };
    }
  }

  const page = Number(body.page ?? 1);
  if (!Number.isInteger(page) || page < 1) return { status: 400, body: { error: "page parameter is not valid" } };
  const ordered = entries.sort((a, b) =>
    sort === "date_updated_desc" ? b._updated - a._updated || b._code - a._code : sort === "product_id_desc" ? b._code - a._code : b._added - a._added || b._code - a._code,
  );
  const maxPages = Math.max(1, Math.ceil(ordered.length / TOROB_PAGE_SIZE));
  const slice = ordered.slice((page - 1) * TOROB_PAGE_SIZE, page * TOROB_PAGE_SIZE).map(strip);
  return { status: 200, body: { ...base, current_page: page, total: ordered.length, max_pages: maxPages, products: slice } };
}

/** Tells Torob that products changed so it re-fetches them sooner. Silently no-ops when disabled. */
export async function pingTorob(productIds: string[]) {
  const cfg = await getGroup("torob");
  if (!cfg.enabled || !cfg.webhookEnabled || !cfg.webhookToken || !productIds.length) return { ok: false, skipped: true };
  const rows = await prisma.storeProduct.findMany({
    where: { id: { in: productIds }, published: true, torobEnabled: true },
    include: { variants: { where: { active: true } } },
  });
  const items = rows.flatMap((row) =>
    row.variants.length
      ? row.variants.map((v) => ({ page_url: productUrl(row.slug, v.id), page_unique: `${row.code}_${v.id}` }))
      : [{ page_url: productUrl(row.slug), page_unique: String(row.code) }],
  );
  for (let i = 0; i < items.length; i += 100) {
    const response = await fetchWithTimeout("https://api.torob.com/update/webhook/v1/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.webhookToken}` },
      body: JSON.stringify({ items: items.slice(i, i + 100) }),
    }).catch(() => null);
    if (!response?.ok) {
      console.error("torob webhook failed", response?.status, response ? await readJson(response) : "network");
      return { ok: false, skipped: false };
    }
  }
  return { ok: true, skipped: false };
}
