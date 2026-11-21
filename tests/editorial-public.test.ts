import { describe, expect, it } from "vitest";
import { publicBlogPostWhere, publicLandingPageWhere } from "@/lib/editorial-public";

describe("editorial-public filters", () => {
  it("only lists blog posts that are published and past publishedAt", () => {
    const where = publicBlogPostWhere("hello");
    expect(where).toMatchObject({ slug: "hello", published: true, status: "published" });
    expect(where.publishedAt).toEqual({ lte: expect.any(Date) });
  });

  it("allows landing pages that are published or scheduled and due", () => {
    const where = publicLandingPageWhere("terms");
    expect(where.OR).toHaveLength(2);
    expect(where.slug).toBe("terms");
  });
});