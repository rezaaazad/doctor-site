import type { Metadata } from "next";
import { PortfolioStrip } from "@/components/home/sections";
import { PageHero } from "@/components/site/home-view";
import { getLocale, getSiteSafe, sectionOn } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { tx } from "@/lib/text";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSafe();
  return pageMetadata(site.seo.find((entry) => entry.id === "portfolio"), site.settings, "/portfolio");
}

export default async function PortfolioPage() {
  const [site, locale] = await Promise.all([getSiteSafe(), getLocale()]);
  const intro = sectionOn(site, "portfolio", "portfolioIntro");
  const content = intro?.visible ? intro.content : {};
  return (
    <div className="pb-16">
      <PageHero
        crumb={tx(content, "kicker", locale, "نمونه‌کار")}
        headline={tx(content, "display", locale, tx(content, "title", locale, "نمونه‌کارها"))}
        title={tx(content, "title", locale, "از ایده تا واقعیت")}
        body={tx(content, "body", locale)}
      />
      <PortfolioStrip content={{ title: "پروژه‌های استودیو", limit: site.projects.length }} projects={site.projects} />
    </div>
  );
}
