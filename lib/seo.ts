import type { Metadata } from "next";
import { siteUrl } from "@/lib/utils";
import { getGroup } from "@/lib/options";
import { getSiteSafe, type SeoEntry, type Settings } from "@/lib/site";

export type MetaInput = {
  path: string;
  title?: string;
  description?: string;
  image?: string;
  type?: "website" | "article";
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
};

function absolute(url: string) {
  if (!url) return "";
  return /^https?:\/\//.test(url) ? url : `${siteUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Metadata for any public page. Per-path overrides from "SEO pages" in admin (PageSeo) win over the
 * page's own defaults, which win over global settings.
 */
export async function buildMetadata(input: MetaInput): Promise<Metadata> {
  const [site, seo] = await Promise.all([getSiteSafe(), getGroup("seo")]);
  const override = site.seo.find((entry) => entry.path === input.path) as (SeoEntry & { noindex?: boolean }) | undefined;
  const name = site.settings.siteName;
  const sep = String(seo.titleSeparator || "|");
  const raw = override?.title || input.title || site.settings.tagline || name;
  const title = raw.includes(name) ? raw : `${raw} ${sep} ${name}`;
  const description = (override?.description || input.description || site.settings.description || "").slice(0, 300);
  const image = absolute(override?.ogImage || input.image || String(seo.defaultOgImage || "/images/og/default.webp"));
  const url = `${siteUrl()}${input.path === "/" ? "" : input.path}`;
  const noindex = Boolean(input.noindex || override?.noindex);
  return {
    title: { absolute: title },
    description,
    keywords: override?.keywords ? override.keywords.split(/[,،]/).map((k) => k.trim()).filter(Boolean) : undefined,
    alternates: { canonical: input.path },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: input.type ?? "website",
      locale: "fa_IR",
      url,
      siteName: name,
      title,
      description,
      images: image ? [{ url: image }] : undefined,
      publishedTime: input.publishedTime,
      modifiedTime: input.modifiedTime,
    },
    twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
  };
}

/** Backwards-compatible helper used by older pages. */
export async function pageMetadata(seo: SeoEntry | undefined, settings: Settings, path: string): Promise<Metadata> {
  const [options, site] = await Promise.all([getGroup("seo"), getSiteSafe()]);
  const override = site.seo.find(entry => entry.path === path);
  const image = absolute(override?.ogImage || seo?.ogImage || String(options.defaultOgImage || "/images/og/default.webp"));
  const rawTitle = seo?.title || settings.siteName;
  const title = rawTitle.includes(settings.siteName) ? rawTitle : `${rawTitle} | ${settings.siteName}`;
  const description = seo?.description || settings.description;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    openGraph: { type: "website", locale: "fa_IR", url: `${siteUrl()}${path === "/" ? "" : path}`, siteName: settings.siteName, title, description, images: [{ url: image }] },
  };
}
