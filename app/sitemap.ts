import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const staticRoutes = ["", "/portfolio", "/services", "/about", "/contact", "/blog", "/faq", "/store", "/pricing"].map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
  }));
  try {
    const { promoteDueLandingPages, publicBlogPostWhere, publicLandingPageWhere } = await import("@/lib/editorial-public");
    await promoteDueLandingPages();
    const [projects, posts, landings, categories, products] = await Promise.all([
      prisma.project.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } }),
      prisma.blogPost.findMany({ where: publicBlogPostWhere(), select: { slug: true, updatedAt: true } }),
      prisma.landingPage.findMany({ where: publicLandingPageWhere(), select: { slug: true, updatedAt: true } }),
      prisma.storeCategory.findMany({where:{visible:true},select:{slug:true}}),
      prisma.storeProduct.findMany({where:{published:true,type:{in:["service","digital"]}},select:{slug:true,updatedAt:true}}),
    ]);
    return [
      ...staticRoutes,
      ...categories.map(c => ({url:base+"/store/category/"+c.slug})),
      ...products.map(p => ({url:base+"/store/"+p.slug,lastModified:p.updatedAt})),
      ...landings.map((page) => ({ url: `${base}/${page.slug}`, lastModified: page.updatedAt })),
      ...projects.map((project) => ({ url: `${base}/portfolio/${project.slug}`, lastModified: project.updatedAt })),
      ...posts.map((post) => ({ url: `${base}/blog/${post.slug}`, lastModified: post.updatedAt })),
    ];
  } catch {
    return staticRoutes;
  }
}
