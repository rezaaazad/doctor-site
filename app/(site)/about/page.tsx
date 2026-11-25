import type { Metadata } from "next";
import { PhotoSlot } from "@/components/ui/photo-slot";
import { ProcessSteps } from "@/components/home/sections";
import Link from "next/link";
import { PageHero } from "@/components/site/home-view";
import { getSiteSafe, sectionOn } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { paragraphs, tx, txPairs } from "@/lib/text";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSafe();
  return pageMetadata(site.seo.find((entry) => entry.id === "about"), site.settings, "/about");
}

export default async function AboutPage() {
  const site = await getSiteSafe();
  const story = sectionOn(site, "about", "story");
  const principles = sectionOn(site, "about", "principles");
  const process = sectionOn(site, "home", "processSteps") ?? sectionOn(site, "home", "process");
  const storyContent = story?.visible ? story.content : {};
  return (
    <div className="pb-16">
      <PageHero
        crumb={tx(storyContent, "kicker", "fa", "درباره")}
        headline={tx(storyContent, "display", "fa", site.settings.siteName)}
        title={tx(storyContent, "title", "fa", site.settings.siteName)}
      />
      <div className="container-x grid items-center gap-8 md:grid-cols-2"><div className="relative aspect-[8/5] overflow-hidden rounded-[var(--r)]"><PhotoSlot src="/images/about/studio.webp" alt="فضای کار استودیوی طراحی" sizes="(min-width:768px) 50vw,100vw" priority /></div><div className="space-y-4 leading-8">
        {paragraphs(tx(storyContent, "body", "fa")).map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
      </div></div>
      <ProcessSteps steps={site.steps} content={{title:"روند کار", ...process?.content}} />
      <section className="container-x mt-12">
        <h2 style={{ fontSize: 28 }}>{principles ? tx(principles.content, "title", "fa", "چرا دکتر سایت") : "چرا دکتر سایت"}</h2>
        <ul className="list-inside list-disc space-y-2" style={{ marginTop: 12 }}>
          {txPairs(principles?.content ?? {}, "items", "fa").map((item) => <li key={item.title}>{item.title}</li>)}
        </ul>
        <div className="grid gap-4 sm:grid-cols-3" style={{ marginTop: 16 }}>
          {site.stats.map((stat) => (
            <div key={stat.id} className="card grid gap-2 p-6 text-xl"><strong>{stat.value}</strong><span className="muted">{stat.label}</span></div>
          ))}
        </div>
        <Link className="btn btn-primary" href="/contact" style={{ marginTop: 18 }}>مشاوره رایگان</Link>
      </section>
    </div>
  );
}
