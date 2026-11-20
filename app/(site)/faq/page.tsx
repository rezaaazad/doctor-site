import type { Metadata } from "next";
import { getSiteSafe, sectionOn } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { PageHero } from "@/components/site/home-view";
import { tx } from "@/lib/text";
import { JsonLd } from "@/components/site/json-ld";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSafe();
  return pageMetadata(site.seo.find((entry) => entry.id === "faq"), site.settings, "/faq");
}

export default async function FaqPage() {
  const site = await getSiteSafe();
  const head = sectionOn(site, "home", "faq");
  return (
    <div className="wrap pad pb-16">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: site.faqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }} />
      <PageHero
        crumb={head ? tx(head.content, "kicker", "fa", "پرسش‌ها") : "پرسش‌ها"}
        headline={head ? tx(head.content, "title", "fa", "پرسش‌های رایج") : "پرسش‌های رایج"}
        title={head ? tx(head.content, "kicker", "fa", "پرسش‌ها") : "پرسش‌ها"}
      />
      <div className="faq mt-6">
        {site.faqs.map((item) => (
          <details key={item.id} open>
            <summary>{item.question}</summary>
            <p className="muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
