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
  return <HomeView site={site} locale={locale} />;
}
