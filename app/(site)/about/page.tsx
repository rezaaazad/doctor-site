import type { Metadata } from "next";
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
  const process = sectionOn(site, "home", "process");
  const storyContent = story?.visible ? story.content : {};
  return (
    <div className="page">
      <PageHero
        crumb={tx(storyContent, "kicker", "fa", "درباره")}
        headline={tx(storyContent, "display", "fa", site.settings.siteName)}
        title={tx(storyContent, "title", "fa", site.settings.siteName)}
      />
      <div style={{ display: "grid", gap: 12, maxWidth: 720 }}>
        {paragraphs(tx(storyContent, "body", "fa")).map((p) => <p key={p.slice(0, 24)}>{p}</p>)}
      </div>
      {site.steps.length ? (
        <section style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 28 }}>{process ? tx(process.content, "title", "fa", "روند کار") : "روند کار"}</h2>
          <div className="steps" style={{ marginTop: 12 }}>
            {site.steps.map((step) => (
              <article key={step.id} className="step">
                <b>{step.number}</b>
                <div><h3 style={{ margin: 0 }}>{step.title}</h3><p className="muted">{step.body}</p></div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
      <section style={{ marginTop: 36 }}>
        <h2 style={{ fontSize: 28 }}>{principles ? tx(principles.content, "title", "fa", "چرا دکتر سایت") : "چرا دکتر سایت"}</h2>
        <ul className="ticks" style={{ marginTop: 12 }}>
          {txPairs(principles?.content ?? {}, "items", "fa").map((item) => <li key={item.title}>{item.title}</li>)}
        </ul>
        <div className="stats" style={{ marginTop: 16 }}>
          {site.stats.map((stat) => (
            <div key={stat.id} className="stat"><strong>{stat.value}</strong><span className="muted">{stat.label}</span></div>
          ))}
        </div>
        <Link className="pill" href="/contact" style={{ marginTop: 18 }}>مشاوره رایگان</Link>
      </section>
    </div>
  );
}
