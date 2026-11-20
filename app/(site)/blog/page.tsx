import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/site/home-view";
import { getSiteSafe, sectionOn } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { tx } from "@/lib/text";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSafe();
  return pageMetadata(site.seo.find((entry) => entry.id === "blog"), site.settings, "/blog");
}

export default async function BlogPage() {
  const site = await getSiteSafe();
  const head = sectionOn(site, "home", "blogTeaser");
  const content = head?.content ?? {};
  return (
    <div className="page">
      <PageHero
        crumb={tx(content, "kicker", "fa", "وبلاگ")}
        headline={tx(content, "title", "fa", "یادداشت‌ها")}
        title={tx(content, "linkLabel", "fa", "برای تصمیم دقیق‌تر")}
      />
      <div className="cards">
        {site.posts.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="card">
            <h2 style={{ margin: 0, fontSize: 22 }}>{post.title}</h2>
            <p className="muted">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
