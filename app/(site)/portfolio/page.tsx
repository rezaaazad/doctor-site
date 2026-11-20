import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/home-view";
import { getLocale, getSiteSafe, sectionOn } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { tr, tx } from "@/lib/text";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSafe();
  return pageMetadata(site.seo.find((entry) => entry.id === "portfolio"), site.settings, "/portfolio");
}

export default async function PortfolioPage() {
  const [site, locale] = await Promise.all([getSiteSafe(), getLocale()]);
  const intro = sectionOn(site, "portfolio", "portfolioIntro");
  const content = intro?.visible ? intro.content : {};
  return (
    <div className="page">
      <PageHero
        crumb={tx(content, "kicker", locale, "نمونه‌کار")}
        headline={tx(content, "display", locale, tx(content, "title", locale, "نمونه‌کارها"))}
        title={tx(content, "title", locale, "از ایده تا واقعیت")}
        body={tx(content, "body", locale)}
      />
      <div className="rail" style={{ paddingInline: 0 }}>
        {site.projects.map((project) => (
          <Link key={project.id} href={`/portfolio/${project.slug}`} className="shot">
            {project.coverUrl ? <img src={project.coverUrl} alt="" /> : <div className="ph" />}
            <div className="cap">
              <b>{tr(locale, project.title, project.titleEn)}</b>
              <span>{project.tags[0] || project.client}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
