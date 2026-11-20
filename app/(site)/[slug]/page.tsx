import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, breadcrumbLd, organizationLd } from "@/components/site/json-ld";
import { prisma } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";
import { getSiteSafe } from "@/lib/site";
import { siteUrl } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

function blocks(body: string) {
  return body.split(/\n(?=## )/).map((chunk) => {
    const lines = chunk.trim().split("\n");
    const heading = lines[0]?.startsWith("## ") ? lines[0].replace(/^## /, "") : "";
    const text = (heading ? lines.slice(1) : lines).join("\n").trim();
    const paragraphs = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
    return { heading, paragraphs };
  }).filter((block) => block.heading || block.paragraphs.length);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.landingPage.findUnique({ where: { slug } });
  if (!page || !page.published) return {};
  const site = await getSiteSafe();
  return pageMetadata({
    id: page.slug,
    path: `/${page.slug}`,
    title: page.seoTitle || page.title,
    description: page.seoDescription || page.excerpt,
    ogImage: "",
    keywords: page.keywords,
  }, site.settings, `/${page.slug}`);
}

export default async function LandingRoute({ params }: Params) {
  const { slug } = await params;
  const page = await prisma.landingPage.findUnique({ where: { slug } });
  if (!page || !page.published) notFound();
  const site = await getSiteSafe();
  const faqs = Array.isArray(page.faqs) ? page.faqs.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { q?: string; a?: string };
    return row.q && row.a ? [{ q: row.q, a: row.a }] : [];
  }) : [];
  const url = `${siteUrl()}/${page.slug}`;
  return (
    <article className="page">
      <JsonLd data={breadcrumbLd([{ name: "خانه", path: "/" }, { name: page.title, path: `/${page.slug}` }])} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name: page.title,
        description: page.excerpt,
        url,
        provider: organizationLd(site.settings),
        areaServed: "IR",
      }} />
      {faqs.length ? (
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }} />
      ) : null}
      <p className="crumb"><Link href="/">خانه</Link> <span aria-hidden> ‹ </span> <b>{page.title}</b></p>
      <h1 className="grad" style={{ fontSize: "clamp(32px, 6vw, 64px)" }}>{page.h1}</h1>
      <p className="hero-sub" style={{ marginTop: 12 }}>{page.excerpt}</p>
      <div style={{ display: "grid", gap: 18, maxWidth: 760, marginTop: 28 }}>
        {blocks(page.body).map((block) => (
          <section key={block.heading || block.paragraphs[0]}>
            {block.heading ? <h2 style={{ fontSize: 26, margin: "8px 0" }}>{block.heading}</h2> : null}
            {block.paragraphs.map((paragraph) => <p key={paragraph.slice(0, 32)}>{paragraph}</p>)}
          </section>
        ))}
      </div>
      {faqs.length ? (
        <section className="faq" style={{ maxWidth: 760, marginTop: 20 }}>
          <h2>پرسش‌های رایج</h2>
          {faqs.map((item) => (
            <details key={item.q} open>
              <summary>{item.q}</summary>
              <p className="muted">{item.a}</p>
            </details>
          ))}
        </section>
      ) : null}
      <p style={{ marginTop: 24 }}>
        <Link className="pill solid" href="/contact">مشاوره رایگان</Link>
        {" "}
        <Link className="pill" href="/services">همه خدمات</Link>
      </p>
    </article>
  );
}
