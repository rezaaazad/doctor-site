import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogListing } from "@/components/store/catalog-listing";
import CatalogSkeleton from "@/components/store/catalog-skeleton";
import { buildMetadata } from "@/lib/seo";
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    path: "/store",
    title: "فروشگاه",
    description: "طراحی سایت، برنامه‌نویسی اختصاصی و خرید قالب و افزونه آماده دکتر سایت",
  });
}

export default async function StorePage({ searchParams }: { searchParams: SearchParams }) {
  const search = await searchParams;
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogListing search={search} />
    </Suspense>
  );
}
