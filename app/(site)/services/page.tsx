import type { Metadata } from "next";
import Link from "next/link";
import { MarketingHero } from "@/components/site/marketing-hero";
import { PricingGuide } from "@/components/site/pricing-guide";
import { PhotoSlot } from "@/components/ui/photo-slot";
import { whatsappHref, telHref } from "@/lib/reach";
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
  const content = intro?.content ?? {};
  const wa = whatsappHref(site.settings.socials.whatsapp);
  const phone = telHref(site.settings.phone);
  return <>
    <MarketingHero kicker={tx(content,"kicker",locale,"خدمات استودیو")} title={tx(content,"title",locale,"خدمات دکتر سایت")}
      body={tx(content,"body",locale,"خدمات، محدوده کار و هزینه شروع هر پروژه را بررسی کنید.")}
      image="/images/services/hero.webp" secondary={wa ? {href:wa,label:"گفتگو در واتساپ"} : phone ? {href:phone,label:"تماس تلفنی"} : undefined} />
    <section className="container-x mt-12 grid gap-6 md:grid-cols-2" aria-label="خدمات">
      {site.services.map(service => <article className="card flex flex-col overflow-hidden" key={service.id}>
        <div className="relative aspect-[4/3]"><PhotoSlot src={service.imageUrl} alt={service.title} sizes="(min-width:768px) 45vw, 100vw" /></div>
        <div className="flex flex-1 flex-col items-start gap-4 p-6">
          <span className="font-display text-3xl font-black text-primary">{service.number}</span>
          <h2 className="font-display text-2xl font-bold">{tr(locale,service.title,service.titleEn)}</h2>
          <p>{tr(locale,service.summary,service.summaryEn)}</p><p className="leading-8 text-muted">{tr(locale,service.body,service.bodyEn)}</p>
          <ul className="list-inside list-disc space-y-2 marker:text-primary">{service.includes.map(f => <li key={f}>{f}</li>)}</ul>
          <b className="mt-auto">{service.priceLabel}</b>
          <Link className="btn btn-outline" href={service.href && service.href !== "/services" ? service.href : "/contact"}>{tx(content,"linkLabel",locale,"درخواست مشاوره")}</Link>
        </div>
      </article>)}
    </section><PricingGuide site={site}/>
  </>;
}
