import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const getProduct = cache(async (slug: string) => {
  const product = await prisma.storeProduct.findUnique({
    where: { slug, published: true },
    select: { title: true, summary: true, priceRial: true, category: { select: { name: true } } },
  });
  if (!product) notFound();
  return product;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  return {
    title: product.title,
    description: product.summary,
    alternates: { canonical: "/store/" + encodeURIComponent(slug) },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  return (
    <article className="wrap pad pb-16">
      <Link href="/store" className="underline">همه محصولات</Link>
      <p className="muted mt-8">{product.category.name}</p>
      <h1 className="my-4 text-4xl font-bold">{product.title}</h1>
      <p className="whitespace-pre-line">{product.summary}</p>
      <p className="mt-6">قیمت محصول: {product.priceRial.toLocaleString("fa-IR")} ریال</p>
    </article>
  );
}
