import { it, vi, expect } from "vitest";
const m = vi.hoisted(() => ({
  enabled: false,
  products: vi.fn(),
  categories: vi.fn(),
}));
vi.mock("@/lib/options", () => ({
  getGroup: async () => ({ snapppayFeed: m.enabled }),
}));
vi.mock("@/lib/editorial-public", () => ({
  promoteDueLandingPages: async () => {},
  publicLandingPageWhere: () => ({}),
  publicBlogPostWhere: () => ({}),
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    project: { findMany: async () => [] },
    blogPost: { findMany: async () => [] },
    landingPage: { findMany: async () => [] },
    storeProduct: { findMany: m.products },
    storeCategory: { findMany: m.categories },
  },
}));
import sitemap from "@/app/sitemap";
import { GET } from "@/app/api/feeds/snapppay.json/route";
it("includes store, pricing, visible categories and published product URLs", async () => {
  m.categories.mockResolvedValue([{ slug: "design" }]);
  m.products.mockResolvedValue([{ slug: "package", updatedAt: new Date() }]);
  expect((await sitemap()).map((r) => new URL(r.url).pathname)).toEqual(
    expect.arrayContaining([
      "/store",
      "/pricing",
      "/store/category/design",
      "/store/package",
    ]),
  );
  expect(m.categories.mock.calls.at(-1)?.[0].where.visible).toBe(true);
  expect(m.products.mock.calls.at(-1)?.[0].where.published).toBe(true);
});
it("gates the SnappPay feed and returns published enabled services in Rial", async () => {
  m.enabled = false;
  expect((await GET()).status).toBe(404);
  m.enabled = true;
  m.products.mockResolvedValue([
    {
      code: 12,
      slug: "design",
      title: "طراحی",
      subtitle: "",
      category: { name: "پکیج" },
      description: "شرح",
      images: ["/cover.webp"],
      manageStock: false,
      variants: [],
      priceRial: BigInt(100),
      compareAtRial: BigInt(130),
    },
  ]);
  const { products } = await (await GET()).json();
  expect(products[0]).toMatchObject({
    regular_price: 130,
    sale_price: 100,
    availability: true,
  });
  expect(m.products.mock.calls.at(-1)?.[0].where).toMatchObject({
    published: true,
    snappEnabled: true,
  });
});
