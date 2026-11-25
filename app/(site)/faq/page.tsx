import type { Metadata } from "next";
import { getSiteSafe, sectionOn } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/home-view";
import { tx } from "@/lib/text";
import { FaqList } from "@/components/home/sections";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSafe();
  return pageMetadata(site.seo.find((entry) => entry.id === "faq"), site.settings, "/faq");
}

export default async function FaqPage() {
  const site = await getSiteSafe();
  const head = sectionOn(site, "home", "faq");
  return (
    <div className="pb-16">
      <PageHero crumb="راهنمای مشتری" title={tx(head?.content ?? {}, "title", "fa", "پرسش‌های رایج")} />
      <FaqList content={{title:"پرسش و پاسخ", limit:site.faqs.length}} faqs={site.faqs} />
    </div>
  );
}
