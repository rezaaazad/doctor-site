import { decodeRouteSlug } from "@/lib/route-slug";
import { PhotoSlot } from "@/components/ui/photo-slot";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/json-ld";
import { Blocks, Toc } from "@/components/content/blocks";
import { getSiteSafe } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { paragraphs } from "@/lib/text";
import { siteUrl } from "@/lib/utils";
import { findPublicBlogPost } from "@/lib/editorial-public";
import { parseBlocks } from "@/lib/blocks";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const slug = decodeRouteSlug((await params).slug);
  const post = await findPublicBlogPost(slug);
  if (!post) notFound();
  const site = await getSiteSafe();
  return pageMetadata(
    { id: post.slug, path: `/blog/${post.slug}`, title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, ogImage: post.coverUrl, keywords: "" },
    site.settings,
    `/blog/${post.slug}`,
  );
}

export default async function BlogPostPage({ params }: Params) {
  const slug = decodeRouteSlug((await params).slug);
  const [post, site] = await Promise.all([findPublicBlogPost(slug), getSiteSafe()]);
  if (!post) notFound();
  const blocks = parseBlocks(post.blocks);
  const hasBlocks = blocks.length > 0;
  return (
    <article className="wrap pad pb-16">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.excerpt, datePublished: post.publishedAt.toISOString(), author: { "@type": "Organization", name: site.settings.siteName }, mainEntityOfPage: `${siteUrl()}/blog/${post.slug}` }} />
      <header className="pt-8" data-reveal>
        <Link href="/blog" className="kicker">
          وبلاگ
        </Link>
        <h1 className="mt-3 font-display text-[2rem] font-extrabold leading-tight md:text-[2.75rem]">{post.title}</h1>
        <p className="mt-3 max-w-2xl text-[0.95rem] leading-7 text-muted">{post.excerpt}</p>
        <p className="mt-2 text-[0.78rem] text-muted">{post.publishedAt.toLocaleDateString("fa-IR")}</p>
      </header>
      {post.coverUrl ? (
        <div className="relative mt-8 aspect-video max-w-4xl overflow-hidden rounded-[var(--r)]"><PhotoSlot src={post.coverUrl} alt={post.title} sizes="(min-width:900px) 900px,100vw" priority /></div>
      ) : null}
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
        <div className="min-w-0 max-w-3xl">
          {hasBlocks ? (
            <Blocks blocks={blocks} className="prose-store" />
          ) : (
            <div className="grid gap-4 text-[0.95rem] leading-8">
              {paragraphs(post.body).map((p) => (
                <p key={p.slice(0, 32)}>{p}</p>
              ))}
            </div>
          )}
        </div>
        {hasBlocks ? <aside className="hidden lg:block"><Toc blocks={blocks} /></aside> : null}
      </div>
    </article>
  );
}