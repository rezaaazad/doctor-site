import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { fallbackSite } from "@/lib/fallback";
import { sectionDef } from "@/lib/sections";
import { buildMetadata, pageMetadata } from "@/lib/seo";
import PricingPage from "@/app/(site)/pricing/page";
import ServicesPage from "@/app/(site)/services/page";
import { selectHomeSections } from "@/lib/home-sections";
import { defaultServiceImage, getSiteSafe, portfolioImage } from "@/lib/site";
import { getGroup } from "@/lib/options";

vi.mock("@/lib/site", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/site")>(),
  getLocale: async () => "fa",
  getSiteSafe: vi.fn(),
}));
vi.mock("@/lib/options", () => ({ getGroup: vi.fn() }));
const site = fallbackSite();
site.packages = [{
  id:"plan", name:"بسته سفارشی مدیر", price:"۲۰ میلیون", summary:"", features:["تحویل مستند"],
  highlighted:true, badge:"", ctaLabel:"شروع همکاری", ctaHref:"/contact", sortOrder:0,
}];
beforeEach(() => {
  vi.mocked(getSiteSafe).mockResolvedValue(site);
  vi.mocked(getGroup).mockResolvedValue({});
});

describe("marketing routes", () => {
  for (const [route, render] of [["services", ServicesPage], ["pricing", PricingPage]] as const) {
    it(route + " renders editable plans, comparison and a single heading", async () => {
      const html = renderToStaticMarkup(await render());
      expect(html.match(/<h1\b/g)).toHaveLength(1);
      expect(html).toContain('id="pricing"');
      expect(html).toContain("بسته سفارشی مدیر");
      expect(html).toContain('scope="col"');
      if (route === "services") expect(html).toContain(site.services[0].summary);
    });
  }
  it("keeps the legacy pricing section editable", () => {
    expect(sectionDef("home", "pricing")).toBe(sectionDef("home", "pricingPlans"));
  });
  it("uses the typographic social image in both metadata helpers", async () => {
    for (const meta of [await buildMetadata({path:"/pricing"}), await pageMetadata(undefined,site.settings,"/pricing")]) {
      expect(meta.openGraph?.images).toEqual([{url:"https://doctor-site.ir/opengraph-image"}]);
      expect(meta.twitter).toMatchObject({card:"summary_large_image"});
    }
  });
  it("shows a visible legacy pricing section when pricingPlans is hidden", () => {
    const rows = selectHomeSections([
      { id: "hero", page: "home", key: "storeHero", sortOrder: 10, visible: true, content: {} },
      { id: "legacy", page: "home", key: "pricing", sortOrder: 45, visible: true, content: { title: "شروع قیمت، شفاف", kicker: "تعرفه" } },
      { id: "plans", page: "home", key: "pricingPlans", sortOrder: 130, visible: false, content: { title: "پیش‌فرض پنهان" } },
    ]);
    expect(rows.map((row) => row.key)).toEqual(["storeHero", "pricingPlans"]);
    expect(rows.find((row) => row.key === "pricingPlans")?.content).toMatchObject({ title: "شروع قیمت، شفاف", eyebrow: "تعرفه" });
  });
  it("fills service images by number or sort order and remaps old portfolio covers", () => {
    expect(defaultServiceImage({ imageUrl: "/images/services/branding.webp", number: "۰۲", sortOrder: 99 })).toBe("/images/services/shop.webp");
    expect(defaultServiceImage({ imageUrl: "", number: "نام‌تغییرکرده", sortOrder: 20 })).toBe("/images/services/shop.webp");
    expect(defaultServiceImage({ imageUrl: "/images/custom.webp", number: "۰۲", sortOrder: 20 })).toBe("/images/custom.webp");
    expect(portfolioImage("/covers/noir.svg")).toBe("/images/portfolio/noir-cover.webp");
    expect(portfolioImage("/covers/orbit.svg")).toBe("/images/portfolio/orbit-cover.webp");
    expect(portfolioImage("/images/portfolio/lumen-cover.webp")).toBe("/images/portfolio/lumen-cover.webp");
  });
});
