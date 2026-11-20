import { siteUrl } from "@/lib/utils";
import type { Settings } from "@/lib/site";

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export function organizationLd(settings: Settings) {
  const sameAs = Object.values(settings.socials).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": ["ProfessionalService", "LocalBusiness"],
    name: settings.siteName,
    url: siteUrl(),
    description: settings.description,
    email: settings.email || undefined,
    telephone: settings.phone || undefined,
    image: settings.logoUrl ? new URL(settings.logoUrl, siteUrl()).toString() : undefined,
    address: settings.address
      ? { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "IR" }
      : undefined,
    areaServed: "IR",
    sameAs,
  };
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${siteUrl()}${item.path === "/" ? "" : item.path}`,
    })),
  };
}
