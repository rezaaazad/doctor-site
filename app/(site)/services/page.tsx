import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/home-view";
import { getLocale, getSiteSafe, sectionOn } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { tr, tx } from "@/lib/text";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSafe();
  return pageMetadata(site.seo.find((entry) => entry.id === "services"), site.settings, "/services");
}

export default async function ServicesPage() {
  const [site, locale] = await Promise.all([getSiteSafe(), getLocale()]);
  const intro = sectionOn(site, "services", "servicesIntro");
  const pricing = sectionOn(site, "home", "pricing");
  const content = intro?.content ?? {};
  return (
    <div className="page">
      <PageHero
        crumb={tx(content, "kicker", locale, "خدمات")}
        headline={tx(content, "display", locale, tx(content, "title", locale, "خدمات"))}
        title={tx(content, "title", locale, "خدمات و شروع قیمت")}
        body={tx(content, "body", locale)}
      />
      <div className="rows">
        {site.services.map((service, index) => (
          <article key={service.id} className="row">
            <p className="giant">{String(index + 1).padStart(2, "0")}</p>
            <h2>{tr(locale, service.title, service.titleEn)}</h2>
            {service.titleEn && !/^(web design|store|app|seo|branding|content hub)$/i.test(service.titleEn.trim()) ? <p className="sub">{service.titleEn}</p> : null}
            <p style={{ maxWidth: 640 }}>{tr(locale, service.summary, service.summaryEn)}</p>
            {service.body ? <p className="muted" style={{ maxWidth: 640 }}>{tr(locale, service.body, service.bodyEn)}</p> : null}
            {service.includes.length ? <ul className="ticks">{service.includes.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            {service.priceLabel ? <p className="price">{service.priceLabel}</p> : null}
            <Link className="pill" href="/contact" style={{ marginTop: 16 }}>{tx(content, "linkLabel", locale, "درخواست")}</Link>
          </article>
        ))}
      </div>
      {site.packages.length ? (
        <section id="pricing" style={{ marginTop: 36 }}>
          <p className="eyebrow">{pricing ? tx(pricing.content, "kicker", locale, "تعرفه") : "تعرفه"}</p>
          <h2 style={{ fontSize: 32, margin: "8px 0 16px" }}>{pricing ? tx(pricing.content, "title", locale, "شروع قیمت") : "شروع قیمت"}</h2>
          <div className="cards prices">
            {site.packages.map((item) => (
              <article key={item.id} className={`card ${item.highlighted ? "hot" : ""}`}>
                <h3 style={{ margin: 0, fontSize: 22 }}>{item.name}</h3>
                <p className="price">{item.price}</p>
                <p className="muted">{item.summary}</p>
                <ul className="ticks">{item.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
                <Link className="pill" href="/contact" style={{ marginTop: 14 }}>درخواست این پکیج</Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
