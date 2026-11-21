import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { ensureOptionDefaults } from "@/lib/options";
import { SECTIONS } from "@/lib/sections";
import { menuSeed, projectSeed, sectionSeed, seoSeed, serviceSeed, settingsSeed, testimonialSeed } from "@/lib/seed-data";
import { blogSeed, extraSeo, faqSeed, logoSeed, packageSeed, processSeed, salesSections, statSeed } from "@/lib/commercial-seed";
import { landingSeed } from "@/lib/landing-seed";

let started = false;

/**
 * Runs on every boot. Strictly additive: it creates rows and settings that are missing and never
 * updates or deletes anything that already exists, so production content is always preserved.
 */
export async function bootstrap() {
  if (started) return;
  started = true;
  await ensureAdmin();
  await ensureContent();
  await ensureCatalogTables();
  await ensureOptionDefaults();
  await ensureSections();
  await ensureMenus();
  await ensureCommerce();
}

async function ensureAdmin() {
  const existing = await prisma.adminUser.count();
  if (existing > 0) return;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = process.env.ADMIN_NAME?.trim() || "مدیر";
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to create the first admin.");
  if (password.length < 10) throw new Error("ADMIN_PASSWORD must be at least 10 characters.");
  if ((process.env.SESSION_SECRET || "").length < 32) throw new Error("SESSION_SECRET must be at least 32 characters.");
  await prisma.adminUser.create({ data: { email, name, role: "admin", passwordHash: await hashPassword(password) } });
  console.log(`Created admin ${email}`);
}

async function ensureContent() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (settings) return;
  await prisma.$transaction([
    prisma.siteSettings.create({ data: settingsSeed }),
    prisma.menuItem.createMany({ data: menuSeed }),
    prisma.section.createMany({ data: sectionSeed, skipDuplicates: true }),
    prisma.service.createMany({ data: serviceSeed }),
    prisma.project.createMany({ data: projectSeed, skipDuplicates: true }),
    prisma.testimonial.createMany({ data: testimonialSeed }),
    prisma.pageSeo.createMany({ data: seoSeed, skipDuplicates: true }),
  ]);
  console.log("Seeded site content");
}

async function ensureCatalogTables() {
  if ((await prisma.package.count()) === 0) await prisma.package.createMany({ data: packageSeed });
  if ((await prisma.processStep.count()) === 0) await prisma.processStep.createMany({ data: processSeed });
  if ((await prisma.stat.count()) === 0) await prisma.stat.createMany({ data: statSeed });
  if ((await prisma.clientLogo.count()) === 0) await prisma.clientLogo.createMany({ data: logoSeed });
  if ((await prisma.faq.count()) === 0) await prisma.faq.createMany({ data: faqSeed });
  if ((await prisma.blogPost.count()) === 0) await prisma.blogPost.createMany({ data: blogSeed, skipDuplicates: true });
  if ((await prisma.landingPage.count()) === 0) await prisma.landingPage.createMany({ data: landingSeed, skipDuplicates: true });
  for (const section of salesSections) {
    await prisma.section.createMany({ data: [section], skipDuplicates: true });
  }
  await prisma.pageSeo.createMany({ data: extraSeo, skipDuplicates: true });
}

async function ensureSections() {
  const existing = await prisma.section.findMany({ select: { page: true, key: true } });
  const have = new Set(existing.map((row) => `${row.page}:${row.key}`));
  const missing = SECTIONS.filter((def) => !have.has(`${def.page}:${def.key}`));
  if (!missing.length) return;
  await prisma.section.createMany({
    data: missing.map((def) => ({
      page: def.page,
      key: def.key,
      label: def.label,
      sortOrder: def.order,
      visible: def.key !== "pricingPlans" && def.key !== "clientLogos",
      content: def.defaults as Prisma.InputJsonValue,
    })),
    skipDuplicates: true,
  });
}

async function ensureMenus() {
  const store = await prisma.menuItem.findFirst({ where: { location: "header", href: { startsWith: "/store" } } });
  if (!store) {
    await prisma.menuItem.create({ data: { label: "فروشگاه", labelEn: "Store", href: "/store", location: "header", sortOrder: -10, visible: true, highlight: false } });
  }
  const footerStore = await prisma.menuItem.findFirst({ where: { location: "footer", href: "/terms" } });
  if (!footerStore) {
    await prisma.menuItem.create({ data: { label: "قوانین خرید", labelEn: "Terms", href: "/terms", location: "footer", sortOrder: 90, visible: true } });
  }
}

async function ensureCommerce() {
  if ((await prisma.shippingZone.count()) === 0) {
    await prisma.shippingZone.create({
      data: {
        name: "تهران",
        provinces: ["تهران"],
        sortOrder: 0,
        methods: {
          create: [
            { title: "پیک فوری تهران", kind: "flat", costRial: BigInt(900_000), minDays: 0, maxDays: 1, sortOrder: 0, freeAbove: BigInt(20_000_000) },
            { title: "پست پیشتاز", kind: "flat", costRial: BigInt(650_000), minDays: 1, maxDays: 3, sortOrder: 1, freeAbove: BigInt(20_000_000) },
          ],
        },
      },
    });
    await prisma.shippingZone.create({
      data: {
        name: "سایر استان‌ها",
        provinces: [],
        sortOrder: 10,
        methods: { create: [{ title: "پست پیشتاز", kind: "flat", costRial: BigInt(850_000), minDays: 2, maxDays: 5, sortOrder: 0, freeAbove: BigInt(20_000_000) }] },
      },
    });
  }
  const terms = await prisma.landingPage.findUnique({ where: { slug: "terms" } });
  if (!terms) {
    await prisma.landingPage.create({
      data: {
        slug: "terms",
        title: "قوانین و شرایط خرید",
        h1: "قوانین و شرایط خرید",
        excerpt: "شرایط ارسال، بازگشت کالا، تحویل فایل و حریم خصوصی.",
        template: "page",
        body: [
          "## ثبت سفارش",
          "با ثبت سفارش، اطلاعات تماس و نشانی شما فقط برای پردازش و ارسال همان سفارش استفاده می‌شود.",
          "## محصولات دیجیتال",
          "لینک دانلود بلافاصله پس از پرداخت در صفحه سفارش و بخش «دانلودها»ی حساب کاربری فعال می‌شود. هر لینک تعداد دفعات و مهلت مشخصی دارد که روی صفحه محصول نوشته شده است.",
          "## ارسال کالای فیزیکی",
          "سفارش‌ها در روزهای کاری بسته‌بندی و تحویل پست یا پیک می‌شوند. کد رهگیری با پیامک و در حساب کاربری اعلام می‌شود.",
          "## ضمانت بازگشت وجه",
          "تا ۷ روز پس از تحویل، اگر محصول با توضیحات صفحه مطابقت نداشت، با ثبت تیکت مبلغ را بازمی‌گردانیم.",
          "## پرداخت اقساطی",
          "در خرید با اسنپ‌پی یا ترب‌پی، قرارداد اقساط بین شما و همان سرویس است و ما فقط فروشنده کالا هستیم.",
        ].join("\n\n"),
        seoTitle: "قوانین خرید",
        seoDescription: "قوانین و شرایط خرید، ارسال، بازگشت وجه و تحویل محصولات دیجیتال.",
        published: true,
        status: "published",
        sortOrder: 100,
      },
    });
  }
}
