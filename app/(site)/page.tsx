import { PromoStrip, StoreIntro } from "@/components/home/promotions";
import type { Metadata } from "next";
import { loadHome } from "@/lib/home-data";
import { buildMetadata } from "@/lib/seo";
import { contactLinks } from "@/lib/contact";
import { StoreHero } from "@/components/home/hero";
import {
  BlogLatest,
  CategoryGrid,
  ClientLogos,
  DealOfDay,
  FaqList,
  InstallmentsBanner,
  LeadSection,
  PortfolioStrip,
  PricingPlans,
  ProcessSteps,
  ProductsSection,
  ServicesStrip,
  SocialProof,
  TrustBar,
} from "@/components/home/sections";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/" });
}

export default async function HomePage() {
  const data = await loadHome();
  const { site, options } = data;
  const contact = contactLinks(site.settings);
  const projects = site.projects;
  const featuredProjects = projects.filter((p) => p.featured);

  return (
    <div className="pb-10">
      {data.sections.map((section) => {
        const c = section.content;
        switch (section.key) {
          case "storeHero":
            return <StoreHero key={section.id} content={c} spotlight={data.spotlight} dark={Boolean(options.theme.darkHero)} />;
          case "trustBar":
            return <TrustBar key={section.id} content={c} />;
          case "categoryGrid":
            return <div key={section.id}><CategoryGrid content={c} categories={data.categories} /><PromoStrip content={c}/></div>;
          case "dealOfDay":
            return <DealOfDay key={section.id} content={c} deal={data.deal} products={section.products ?? []} />;
          case "featuredProducts":
          case "newArrivals":
            return <ProductsSection key={section.id} content={c} products={section.products ?? []} />;
          case "bestsellers":
            return <ProductsSection key={section.id} content={c} products={section.products ?? []} />;
          case "installments":
            return <InstallmentsBanner key={section.id} content={c} enabled={data.installmentsOn} />;
          case "socialProof":
            return <SocialProof key={section.id} content={c} testimonials={site.testimonials.filter((t) => t.visible)} reviews={data.reviews} stats={data.reviewStats} />;
          case "servicesStrip":
            return <ServicesStrip key={section.id} content={c} services={site.services.filter((s) => s.visible)} />;
          case "portfolioStrip":
            return <PortfolioStrip key={section.id} content={c} projects={featuredProjects.length ? featuredProjects : projects} />;
          case "processSteps":
            return <ProcessSteps key={section.id} content={c} steps={site.steps} />;
          case "pricingPlans":
            return <PricingPlans key={section.id} content={c} packages={site.packages} />;
          case "clientLogos":
            return <ClientLogos key={section.id} content={c} logos={site.logos} />;
          case "faqList":
            return <FaqList key={section.id} content={c} faqs={site.faqs} />;
          case "leadForm":
            return <LeadSection key={section.id} content={c} phone={site.settings.phone} phoneHref={contact.phoneHref} />;
          case "blogLatest":
            return <div key={section.id}><PromoStrip content={c}/><BlogLatest content={c} posts={site.posts} /><StoreIntro content={c}/></div>;
          default:
            return null;
        }
      })}
    </div>
  );
}
