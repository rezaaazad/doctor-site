import type { Metadata } from "next";
import { BlogLatest } from "@/components/home/sections";
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
    <div className="pb-16">
      <PageHero
        crumb={tx(content, "kicker", "fa", "وبلاگ")}
        headline={tx(content, "title", "fa", "یادداشت‌ها")}
        title={tx(content, "title", "fa", "مجله دکتر سایت")}
      />
      <BlogLatest content={{ title: "آخرین نوشته‌ها", limit: site.posts.length }} posts={site.posts} />
    </div>
  );
}
