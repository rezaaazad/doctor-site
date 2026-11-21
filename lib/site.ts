import { cache } from "react";
import { prisma } from "@/lib/db";
import { asObject, asStringArray } from "@/lib/utils";
import type { Locale } from "@/lib/text";
import { cookies } from "next/headers";

export type Socials = {
  instagram: string;
  telegram: string;
  linkedin: string;
  github: string;
  whatsapp: string;
};

export type Settings = {
  siteName: string;
  tagline: string;
  description: string;
  logoUrl: string;
  faviconUrl: string;
  accentColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  fontFamily: string;
  cursorEnabled: boolean;
  smoothScroll: boolean;
  animationsEnabled: boolean;
  grainEnabled: boolean;
  webglEnabled: boolean;
  heroShape: string;
  heroColorA: string;
  heroColorB: string;
  heroSpeed: number;
  heroParticles: number;
  heroWords: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
  socials: Socials;
  footerNote: string;
  copyright: string;
  newsletterTitle: string;
  enamadHtml: string;
  available: boolean;
};

export type MenuLink = {
  id: string;
  label: string;
  labelEn: string;
  href: string;
  location: string;
  sortOrder: number;
  visible: boolean;
};

export type SectionBlock = {
  id: string;
  key: string;
  page: string;
  label: string;
  sortOrder: number;
  visible: boolean;
  content: Record<string, unknown>;
};

export type ProjectCard = {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  subtitle: string;
  subtitleEn: string;
  excerpt: string;
  excerptEn: string;
  body: string;
  bodyEn: string;
  coverUrl: string;
  images: string[];
  tags: string[];
  year: string;
  client: string;
  role: string;
  url: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
};

export type ServiceItem = {
  id: string;
  number: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  body: string;
  bodyEn: string;
  priceLabel: string;
  includes: string[];
  href: string;
  icon: string;
  visible: boolean;
  sortOrder: number;
};

export type PricePackage = {
  id: string;
  name: string;
  price: string;
  summary: string;
  features: string[];
  highlighted: boolean;
  badge: string;
  ctaLabel: string;
  ctaHref: string;
  sortOrder: number;
};

export type Step = { id: string; number: string; title: string; body: string; sortOrder: number };
export type StatItem = { id: string; value: string; label: string; sortOrder: number };
export type LogoItem = { id: string; name: string; imageUrl: string; url: string; sortOrder: number };
export type FaqItem = { id: string; question: string; answer: string; group: string; sortOrder: number };
export type PostCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverUrl: string;
  publishedAt: string;
  seoTitle: string;
  seoDescription: string;
};

export type Quote = {
  id: string;
  name: string;
  role: string;
  roleEn: string;
  quote: string;
  quoteEn: string;
  avatarUrl: string;
  rating: number;
  visible: boolean;
  sortOrder: number;
};

export type SeoEntry = {
  id: string;
  path: string;
  title: string;
  description: string;
  ogImage: string;
  keywords: string;
  noindex?: boolean;
};

export type SiteData = {
  settings: Settings;
  menus: MenuLink[];
  sections: SectionBlock[];
  projects: ProjectCard[];
  services: ServiceItem[];
  testimonials: Quote[];
  packages: PricePackage[];
  steps: Step[];
  stats: StatItem[];
  logos: LogoItem[];
  faqs: FaqItem[];
  posts: PostCard[];
  seo: SeoEntry[];
  degraded: boolean;
};

function socialsOf(value: unknown): Socials {
  const row = asObject(value);
  const read = (key: keyof Socials) => (typeof row[key] === "string" ? row[key] : "");
  return {
    instagram: read("instagram"),
    telegram: read("telegram"),
    linkedin: read("linkedin"),
    github: read("github"),
    whatsapp: read("whatsapp"),
  };
}

export const emptySocials = (): Socials => ({
  instagram: "",
  telegram: "",
  linkedin: "",
  github: "",
  whatsapp: "",
});

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  return jar.get("locale")?.value === "en" ? "en" : "fa";
}

export const getSite = cache(async (): Promise<SiteData> => {
  const [settings, menus, sections, projects, services, testimonials, packages, steps, stats, logos, faqs, posts, seo] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.menuItem.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.section.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.project.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" } }),
    prisma.service.findMany({ where: { visible: true }, orderBy: { sortOrder: "asc" } }),
    prisma.testimonial.findMany({ where: { visible: true }, orderBy: { sortOrder: "asc" } }),
    prisma.package.findMany({ where: { visible: true }, orderBy: { sortOrder: "asc" } }),
    prisma.processStep.findMany({ where: { visible: true }, orderBy: { sortOrder: "asc" } }),
    prisma.stat.findMany({ where: { visible: true }, orderBy: { sortOrder: "asc" } }),
    prisma.clientLogo.findMany({ where: { visible: true }, orderBy: { sortOrder: "asc" } }),
    prisma.faq.findMany({ where: { visible: true }, orderBy: { sortOrder: "asc" } }),
    prisma.blogPost.findMany({ where: { published: true, status: "published", publishedAt: { lte: new Date() } }, orderBy: { publishedAt: "desc" }, take: 24 }),
    prisma.pageSeo.findMany(),
  ]);
  if (!settings) throw new Error("NO_SETTINGS");
  return {
    degraded: false,
    settings: {
      ...settings,
      socials: socialsOf(settings.socials),
    },
    menus,
    sections: sections.map((section) => ({ ...section, content: asObject(section.content) })),
    projects: projects.map((project) => ({
      ...project,
      images: asStringArray(project.images),
      tags: asStringArray(project.tags),
    })),
    services: services.map((service) => ({ ...service, includes: asStringArray(service.includes) })),
    testimonials,
    packages: packages.map((item) => ({ ...item, features: asStringArray(item.features) })),
    steps,
    stats,
    logos,
    faqs,
    posts: posts.map((post) => ({ ...post, publishedAt: post.publishedAt.toISOString() })),
    seo,
  };
});

export async function getSiteSafe(): Promise<SiteData> {
  try {
    return await getSite();
  } catch (error) {
    console.error("site data unavailable", error);
    const { fallbackSite } = await import("@/lib/fallback");
    return fallbackSite();
  }
}

export function sectionOn(site: SiteData, page: string, key: string) {
  return site.sections.find((section) => section.page === page && section.key === key);
}

export function visibleSections(site: SiteData, page: string) {
  return site.sections
    .filter((section) => section.page === page && section.visible)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function menuOf(site: SiteData, location: string) {
  return site.menus.filter((item) => item.location === location && item.visible);
}
