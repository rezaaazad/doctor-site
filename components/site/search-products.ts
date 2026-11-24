"use server";

import { prisma } from "@/lib/db";

export async function searchPublishedProducts(input: string) {
  if (typeof input !== "string") return [];
  const query = input.trim().slice(0, 80);
  if (query.length < 2) return [];
  return prisma.storeProduct.findMany({
    where: { published: true, title: { contains: query, mode: "insensitive" } },
    select: { slug: true, title: true },
    orderBy: [{ salesCount: "desc" }, { title: "asc" }],
    take: 5,
  });
}
