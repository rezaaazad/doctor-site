import { expect, it, vi } from "vitest";
import { decodeRouteSlug } from "@/lib/route-slug";
import { getProduct } from "@/lib/store/catalog";

const findUnique = vi.hoisted(() => vi.fn());
vi.mock("@/lib/db", () => ({ prisma: { storeProduct: { findUnique } } }));

it("resolves the encoded and decoded Persian product URL to the same published service", async () => {
  const slug = "پکیج-ویژه-رشد-کسب-و-کار";
  const row = {
    slug, id: "service-1", type: "service", published: true, variants: [],
    priceRial: BigInt(100), createdAt: new Date(0), updatedAt: new Date(0),
  };
  findUnique.mockImplementation(({ where }) => where.slug === slug ? row : null);

  const decoded = await getProduct(slug);
  expect(decoded).toMatchObject({ id: row.id, slug });
  expect(await getProduct(encodeURIComponent(slug))).toEqual(decoded);
});

it.each([
  ["already-ascii", "already-ascii"],
  ["%252F", "%2F"],
  ["bad%2", "bad%2"],
  ["100%off", "100%off"],
  ["e%CC%81", "é"],
  ["e\u0301", "é"],
])("normalizes %s safely in one pass", (input, expected) => {
  expect(decodeRouteSlug(input)).toBe(expected);
});
