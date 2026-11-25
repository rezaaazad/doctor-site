import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { PageHero, fallbackBudgets, fallbackTypes } from "@/components/site/home-view";
import { getLocale, getSiteSafe, sectionOn } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { telegramHref, telHref, whatsappHref } from "@/lib/reach";
import { tx, txLines } from "@/lib/text";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSafe();
  return pageMetadata(site.seo.find((entry) => entry.id === "contact"), site.settings, "/contact");
}

export default async function ContactPage() {
  const [site, locale] = await Promise.all([getSiteSafe(), getLocale()]);
  const intro = sectionOn(site, "contact", "contactIntro");
  const content = intro?.visible ? intro.content : {};
  const types = txLines(content, "projectTypes", locale);
  const budgets = txLines(content, "budgets", locale);
  const tel = telHref(site.settings.phone);
  const wa = whatsappHref(site.settings.socials.whatsapp);
  const tg = telegramHref(site.settings.socials.telegram);
  return (
    <div className="pb-16">
      <PageHero
        crumb={tx(content, "kicker", locale, "تماس")}
        headline={tx(content, "display", locale, "گفتگو")}
        title={tx(content, "title", locale, "درخواست مشاوره رایگان")}
        body={tx(content, "body", locale)}
      />
      <div className="container-x grid items-start gap-6 md:grid-cols-[0.8fr_1.2fr]">
        <div className="card grid gap-4 p-6">
          {tel ? <a className="btn btn-primary" href={tel}>تماس {site.settings.phone}</a> : null}
          {wa ? <a className="btn btn-outline" href={wa}>واتساپ</a> : null}
          {tg ? <a className="btn btn-outline" href={tg}>تلگرام</a> : null}
          {site.settings.email ? <a href={`mailto:${site.settings.email}`}>{site.settings.email}</a> : null}
          {site.settings.address ? <p>{site.settings.address}</p> : null}
          {site.settings.hours ? <p className="muted">{site.settings.hours}</p> : null}
        </div>
        <ContactForm
          submitLabel={tx(content, "submitLabel", locale, "ثبت درخواست")}
          types={types.length ? types : fallbackTypes}
          budgets={budgets.length ? budgets : fallbackBudgets}
        />
      </div>
    </div>
  );
}
