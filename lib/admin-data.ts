import { prisma } from "@/lib/db";
import { asObject, asStringArray } from "@/lib/utils";
import type { Settings } from "@/lib/site";

export async function requireSettings(): Promise<Settings> {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (!settings) throw new Error("NO_SETTINGS");
  const socials = asObject(settings.socials);
  const read = (key: string) => (typeof socials[key] === "string" ? socials[key] : "");
  return {
    ...settings,
    socials: {
      instagram: read("instagram"),
      telegram: read("telegram"),
      linkedin: read("linkedin"),
      github: read("github"),
      whatsapp: read("whatsapp"),
    },
  };
}

export function projectFields(project: {
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
  images: unknown;
  tags: unknown;
  year: string;
  client: string;
  role: string;
  url: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  seoTitle: string;
  seoDescription: string;
}) {
  return { ...project, images: asStringArray(project.images), tags: asStringArray(project.tags) };
}
