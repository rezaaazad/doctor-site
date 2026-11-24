import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd, breadcrumbLd, organizationLd } from "@/components/site/json-ld";
import { Blocks } from "@/components/content/blocks";
import { pageMetadata } from "@/lib/seo";
import { getSiteSafe } from "@/lib/site";
import { siteUrl, asObject } from "@/lib/utils";
import { findPublicLandingPage } from "@/lib/editorial-public";
import { parseBlocks, plainText } from "@/lib/blocks";
import { paragraphs } from "@/lib/text";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const page = await findPublicLandingPage(slug);
  if (!page) return {};
  const site = await getSiteSafe();
  return pageMetadata(
    {
      id: page.slug,
      path: `/${page.slug}`,
      title: page.seoTitle || page.title,
      description: page.seoDescription || page.excerpt,
      ogImage: page.heroImage || "",
      keywords: page.keywords,
    },
    site.settings,
    `/${page.slug}`,
  );
}

export default async function LandingRoute({ params }: Params) {
  const { slug } = await params;
  const page = await findPublicLandingPage(slug);
  if (!page) notFound();
  const site = await getSiteSafe();
  const blocks = parseBlocks(page.blocks);
  const faqsFromBlocks = blocks.flatMap((b) => (b.type === "faq" ? b.items.filter((i) => i.q && i.a) : []));
  const faqs = faqsFromBlocks.length
    ? faqsFromBlocks
    : Array.isArray(page.faqs)
      ? page.faqs.flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const row = asObject(item);
          return row.q && row.a ? [{ q: String(row.q), a: String(row.a) }] : [];
        })
      : [];
  const url = `${siteUrl()}/${page.slug}`;
  const ctaHref = page.ctaHref || "/contact";
  const ctaLabel = page.ctaLabel || "مشاوره رایگان";

  return (
    <article className="wrap pad pb-16">
      <JsonLd data={breadcrumbLd([{ name: "خانه", path: "/" }, { name: page.title, path: `/${page.slug}` }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: page.title,
          description: page.excerpt,
          url,
          provider: organizationLd(site.settings),
          areaServed: "IR",
        }}
      />
      {faqs.length ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((item) => ({
              "@type": "Question",
              name: item.q,
              acceptedAnswer: { "@type": "Answer", text: item.a },
            })),
          }}
        />
      ) : null}
      <p className="text-[0.8rem] text-muted">
        <Link href="/" className="hover:text-primary">
          خانه
        </Link>
        <span aria-hidden> › </span>
        <b>{page.title}</b>
      </p>
      <header className="mt-4 max-w-3xl" data-reveal>
        <h1 className="font-display text-[2rem] font-extrabold leading-tight md:text-[2.75rem]">{page.h1 || page.title}</h1>
        <p className="mt-3 text-[0.95rem] leading-7 text-muted">{page.excerpt}</p>
      </header>
      {page.heroImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={page.heroImage} alt="" className="mt-8 w-full max-w-4xl rounded-[var(--r)] border border-line object-cover shadow-1" />
      ) : null}
      <div className="mt-10 max-w-3xl">
        {blocks.length ? (
          <Blocks blocks={blocks} />
        ) : page.body.trim() ? (
          <div className="grid gap-4 text-[0.95rem] leading-8">
            {paragraphs(page.body).map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>
        ) : (
          <p className="text-muted">{plainText(blocks) || "محتوای این برگه به‌زودی تکمیل می‌شود."}</p>
        )}
      </div>
      {faqs.length && !blocks.some((b) => b.type === "faq") ? (
        <section className="faq mt-10 max-w-3xl">
          <h2 className="font-display text-[1.35rem] font-extrabold">پرسش‌های رایج</h2>
          {faqs.map((item) => (
            <details key={item.q} className="mt-3 rounded-xl border border-line p-3" open>
              <summary className="cursor-pointer font-bold">{item.q}</summary>
              <p className="mt-2 text-[0.9rem] leading-7 text-muted">{item.a}</p>
            </details>
          ))}
        </section>
      ) : null}
      <p className="mt-10 flex flex-wrap gap-3">
        <Link className="btn btn-primary" href={ctaHref}>
          {ctaLabel}
        </Link>
        <Link className="btn btn-outline" href="/store">
          فروشگاه
        </Link>
      </p>
    </article>
  );
}