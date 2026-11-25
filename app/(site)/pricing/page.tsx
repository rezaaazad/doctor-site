import { MarketingHero } from "@/components/site/marketing-hero";
import { PricingGuide } from "@/components/site/pricing-guide";
import { getSiteSafe } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";

export const generateMetadata = () => buildMetadata({ path: "/pricing", title: "تعرفه و مقایسه بسته‌ها" });
export default async function PricingPage() {
  const site = await getSiteSafe();
  return <><MarketingHero kicker="تعرفه خدمات" title="بسته مناسب پروژه شما" body="امکانات و قیمت بسته‌ها را کنار هم ببینید و برای محدوده دقیق پروژه پیشنهاد بگیرید." image="/images/pricing/hero.webp" /><PricingGuide site={site} /></>;
}
