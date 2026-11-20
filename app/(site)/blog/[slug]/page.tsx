import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/json-ld";
import { getSiteSafe } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { paragraphs } from "@/lib/text";
import { siteUrl } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteSafe();
  const post = site.posts.find((item) => item.slug === slug);
  if (!post) return {};
  return pageMetadata(
    { id: post.slug, path: `/blog/${post.slug}`, title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, ogImage: post.coverUrl, keywords: "" },
    site.settings,
    `/blog/${post.slug}`,
  );
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const site = await getSiteSafe();
  const post = site.posts.find((item) => item.slug === slug);
  if (!post) notFound();
  return (
    <article className="wrap pad pb-16">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.excerpt, datePublished: post.publishedAt, author: { "@type": "Organization", name: site.settings.siteName }, mainEntityOfPage: `${siteUrl()}/blog/${post.slug}` }} />
      <header style={{ paddingTop: "2rem" }}>
        <Link href="/blog" className="kicker">وبلاگ</Link>
        <h1 className="grad" style={{ fontSize: "clamp(32px, 6vw, 64px)" }}>{post.title}</h1>
        <p className="muted mt-3">{post.excerpt}</p>
      </header>
      <div className="mt-8 grid max-w-3xl gap-4">
        {paragraphs(post.body).map((p) => <p key={p.slice(0, 20)}>{p}</p>)}
      </div>
    </article>
  );
}
