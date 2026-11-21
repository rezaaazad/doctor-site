import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

/** Flip scheduled landing pages whose publish time has passed (lazy cron). */
export async function promoteDueLandingPages() {
  const now = new Date();
  await prisma.landingPage.updateMany({
    where: { status: "scheduled", published: false, publishAt: { lte: now } },
    data: { published: true, status: "published" },
  });
}

export function publicBlogPostWhere(slug?: string): Prisma.BlogPostWhereInput {
  const now = new Date();
  const base: Prisma.BlogPostWhereInput = {
    published: true,
    status: "published",
    publishedAt: { lte: now },
  };
  return slug ? { ...base, slug } : base;
}

export function publicLandingPageWhere(slug?: string): Prisma.LandingPageWhereInput {
  const now = new Date();
  const live: Prisma.LandingPageWhereInput = {
    OR: [
      { published: true, status: "published" },
      { status: "scheduled", publishAt: { lte: now } },
    ],
  };
  return slug ? { ...live, slug } : live;
}

export async function findPublicLandingPage(slug: string) {
  await promoteDueLandingPages();
  return prisma.landingPage.findFirst({ where: publicLandingPageWhere(slug) });
}

export async function findPublicBlogPost(slug: string) {
  return prisma.blogPost.findFirst({ where: publicBlogPostWhere(slug) });
}