import type { Metadata } from "next";
import { siteUrl } from "@/lib/utils";
import type { SeoEntry, Settings } from "@/lib/site";

export function pageMetadata(seo: SeoEntry | undefined, settings: Settings, path: string): Metadata {
  const rawTitle = seo?.title || settings.siteName;
  const title = rawTitle.includes(settings.siteName) ? rawTitle : `${rawTitle} | ${settings.siteName}`;
  const description = seo?.description || settings.description;
  const image = seo?.ogImage || undefined;
  const url = `${siteUrl()}${path === "/" ? "" : path}`;
  return {
    title: { absolute: title },
    description,
    keywords: seo?.keywords
      ? seo.keywords.split(",").map((item) => item.trim()).filter(Boolean)
      : undefined,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      alternateLocale: ["en_US"],
      url,
      siteName: settings.siteName,
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
