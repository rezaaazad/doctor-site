import { getGroup } from "@/lib/options";
import { prisma } from "@/lib/db";
import { siteUrl, asStringArray } from "@/lib/utils";
export const dynamic = "force-dynamic";
export async function GET() {
  if (!(await getGroup("snappshop")).snapppayFeed)
    return new Response(null, { status: 404 });
  const rows = await prisma.storeProduct.findMany({
    where: {
      published: true,
      snappEnabled: true,
      type: { in: ["service", "digital"] },
    },
    include: { category: true, variants: { where: { active: true } } },
    orderBy: { code: "asc" },
  });
  const products = rows.map((row) => {
    const image = asStringArray(row.images)[0];
    const variant = row.variants.reduce<
      (typeof row.variants)[number] | undefined
    >(
      (best, v) => (!best || v.priceRial < best.priceRial ? v : best),
      undefined,
    );
    const price = variant?.priceRial ?? row.priceRial;
    const old = (variant ? variant.compareAtRial : row.compareAtRial) ?? price;
    const sale =
      old > price && (!row.saleEndsAt || row.saleEndsAt > new Date());
    return {
      id: String(row.code),
      title: row.title,
      subtitle: row.subtitle,
      link: new URL("/store/" + row.slug, siteUrl()).href,
      image_link: image ? new URL(image, siteUrl()).href : "",
      availability:
        !row.manageStock ||
        row.allowBackorder ||
        (row.variants.length
          ? row.variants.some((v) => v.stock > 0)
          : row.stock > 0),
      regular_price: Number(sale ? old : price),
      sale_price: Number(price),
      category: row.category.name,
      description: row.description || row.summary,
    };
  });
  return Response.json({ products });
}
