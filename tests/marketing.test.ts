import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { fallbackSite } from "@/lib/fallback";
import { sectionDef } from "@/lib/sections";
import { buildMetadata, pageMetadata } from "@/lib/seo";
import PricingPage from "@/app/(site)/pricing/page";
import ServicesPage from "@/app/(site)/services/page";
import { getSiteSafe } from "@/lib/site";
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
  it("uses the shipped social image in both metadata helpers", async () => {
    for (const meta of [await buildMetadata({path:"/pricing"}), await pageMetadata(undefined,site.settings,"/pricing")]) {
      expect(meta.openGraph?.images).toEqual([{url:"https://doctor-site.ir/images/og/default.webp"}]);
      expect(meta.twitter).toMatchObject({card:"summary_large_image"});
    }
  });
});
