import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const staticRoutes = ["", "/portfolio", "/services", "/about", "/contact", "/blog", "/faq"].map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
  }));
  try {
    const [projects, posts, landings] = await Promise.all([
      prisma.project.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.landingPage.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
    ]);
    return [
      ...staticRoutes,
      ...landings.map((page) => ({ url: `${base}/${page.slug}`, lastModified: page.updatedAt })),
      ...projects.map((project) => ({ url: `${base}/portfolio/${project.slug}`, lastModified: project.updatedAt })),
      ...posts.map((post) => ({ url: `${base}/blog/${post.slug}`, lastModified: post.updatedAt })),
    ];
  } catch {
    return staticRoutes;
  }
}
