import { z } from "zod";

export const FONTS = ["Vazirmatn", "Estedad"] as const;
export const HERO_SHAPES = ["liquid", "knot", "ribbon"] as const;

const hex = z
  .string()
  .trim()
  .regex(/^#[0-9a-fA-F]{6}$/, "رنگ باید به صورت هگز شش‌رقمی باشد.");

export const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (!value) return true;
    if (value.startsWith("/") && !value.startsWith("//")) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:" || url.protocol === "mailto:" || url.protocol === "tel:";
    } catch {
      return false;
    }
  }, "نشانی معتبر نیست.");

export const slugSchema = z
  .string()
  .trim()
  .min(2, "نامک کوتاه است.")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "نامک فقط حروف کوچک انگلیسی، عدد و خط تیره.");

export const passwordSchema = z
  .string()
  .min(10, "رمز حداقل ۱۰ نویسه باشد.")
  .max(200)
  .regex(/[A-Za-z\u0600-\u06FF]/, "رمز باید حرف داشته باشد.")
  .regex(/[0-9]/, "رمز باید عدد داشته باشد.");

export const appearanceSchema = z.object({
  accentColor: hex,
  backgroundColor: hex,
  surfaceColor: hex,
  textColor: hex,
  mutedColor: hex,
  fontFamily: z.enum(FONTS),
  logoUrl: optionalUrl,
  faviconUrl: optionalUrl,
  cursorEnabled: z.boolean(),
  smoothScroll: z.boolean(),
  animationsEnabled: z.boolean(),
  grainEnabled: z.boolean(),
  webglEnabled: z.boolean(),
});

export const heroSchema = z.object({
  heroShape: z.enum(HERO_SHAPES),
  heroColorA: hex,
  heroColorB: hex,
  heroSpeed: z.number().min(0).max(3),
  heroParticles: z.number().int().min(0).max(6000),
  heroWords: z.string().trim().min(1).max(200),
});

export const profileSchema = z.object({
  siteName: z.string().trim().min(1, "نام سایت لازم است.").max(80),
  tagline: z.string().trim().max(180),
  description: z.string().trim().max(600),
  email: z.string().trim().max(160).refine((value) => !value || z.string().email().safeParse(value).success, "ایمیل معتبر نیست."),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(240),
  hours: z.string().trim().max(160),
  footerNote: z.string().trim().max(400),
  copyright: z.string().trim().max(200),
  newsletterTitle: z.string().trim().max(160),
  enamadHtml: z.string().max(20000),
  available: z.boolean(),
  instagram: optionalUrl,
  telegram: optionalUrl,
  linkedin: optionalUrl,
  github: optionalUrl,
  whatsapp: optionalUrl,
});

export const menuSchema = z.object({
  label: z.string().trim().min(1).max(60),
  labelEn: z.string().trim().max(60),
  href: z.string().trim().min(1).max(200).refine((value) => value.startsWith("/") && !value.startsWith("//"), "پیوند باید با / شروع شود."),
  location: z.enum(["header", "footer"]),
  visible: z.boolean(),
});

export const projectSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(1).max(160),
  titleEn: z.string().trim().max(160),
  subtitle: z.string().trim().max(200),
  subtitleEn: z.string().trim().max(200),
  excerpt: z.string().trim().min(1).max(400),
  excerptEn: z.string().trim().max(400),
  body: z.string().trim().min(1).max(12000),
  bodyEn: z.string().trim().max(12000),
  coverUrl: optionalUrl,
  images: z.array(optionalUrl).max(12),
  tags: z.array(z.string().trim().min(1).max(40)).max(12),
  year: z.string().trim().max(12),
  client: z.string().trim().max(120),
  role: z.string().trim().max(120),
  url: optionalUrl,
  featured: z.boolean(),
  published: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
  seoTitle: z.string().trim().max(180),
  seoDescription: z.string().trim().max(320),
});

export const serviceSchema = z.object({
  number: z.string().trim().min(1).max(8),
  title: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().max(120),
  summary: z.string().trim().min(1).max(400),
  summaryEn: z.string().trim().max(400),
  body: z.string().trim().max(8000),
  bodyEn: z.string().trim().max(8000),
  imageUrl: optionalUrl,
  priceLabel: z.string().trim().max(80),
  href: z.string().trim().max(200).refine((value) => !value || value.startsWith("/"), "پیوند باید با / شروع شود."),
  includes: z.array(z.string().trim().min(1).max(160)).max(12),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

export const testimonialSchema = z.object({
  name: z.string().trim().min(1).max(80),
  role: z.string().trim().max(160),
  roleEn: z.string().trim().max(160),
  quote: z.string().trim().min(1).max(800),
  avatarUrl: optionalUrl,
  quoteEn: z.string().trim().max(800),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

export const seoSchema = z.object({
  id: z.enum(["home", "portfolio", "services", "about", "contact"]),
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(320),
  keywords: z.string().trim().max(400),
  ogImage: optionalUrl,
});

export const userSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email("ایمیل معتبر نیست.").max(160),
  password: passwordSchema,
});

export const passwordChangeSchema = z.object({
  current: z.string().min(1),
  next: passwordSchema,
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, "نام را بنویسید.").max(80),
  email: z.string().trim().max(160).refine((value) => !value || z.string().email().safeParse(value).success, "ایمیل معتبر نیست."),
  phone: z.string().trim().min(8, "شماره تماس را بنویسید.").max(40),
  subject: z.string().trim().max(140),
  projectType: z.string().trim().min(2, "نوع پروژه را انتخاب کنید.").max(80),
  budget: z.string().trim().min(2, "بازه بودجه را انتخاب کنید.").max(80),
  message: z.string().trim().max(4000),
  company: z.string().max(200),
});

export const packageSchema = z.object({
  name: z.string().trim().min(1).max(80),
  price: z.string().trim().min(1).max(80),
  summary: z.string().trim().max(240),
  features: z.array(z.string().trim().min(1).max(160)).max(12),
  highlighted: z.boolean(),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

export const processSchema = z.object({
  number: z.string().trim().min(1).max(8),
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().min(1).max(600),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

export const statSchema = z.object({
  value: z.string().trim().min(1).max(24),
  label: z.string().trim().min(1).max(80),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

export const logoSchema = z.object({
  name: z.string().trim().min(1).max(80),
  imageUrl: optionalUrl,
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

export const faqSchema = z.object({
  question: z.string().trim().min(2).max(200),
  answer: z.string().trim().min(2).max(2000),
  visible: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999),
});

export const blogSchema = z.object({
  slug: slugSchema,
  title: z.string().trim().min(2).max(160),
  excerpt: z.string().trim().min(2).max(300),
  body: z.string().trim().min(2).max(12000),
  coverUrl: optionalUrl,
  published: z.boolean(),
  seoTitle: z.string().trim().max(180),
  seoDescription: z.string().trim().max(320),
});
