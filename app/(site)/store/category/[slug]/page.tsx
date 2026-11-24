import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogListing } from "@/components/store/catalog-listing";
import CatalogSkeleton from "@/components/store/catalog-skeleton";
import { buildMetadata } from "@/lib/seo";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await prisma.storeCategory.findUnique({ where: { slug, visible: true } });
  if (!cat) notFound();
  return buildMetadata({
    path: `/store/category/${slug}`,
    title: cat.seoTitle || cat.name,
    description: cat.seoDescription || cat.description || cat.name,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const category = await prisma.storeCategory.findUnique({ where: { slug, visible: true } });
  if (!category) notFound();
  const search = await searchParams;
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogListing search={search} category={category} />
    </Suspense>
  );
}
