import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { menuSeed, projectSeed, sectionSeed, seoSeed, serviceSeed, settingsSeed, testimonialSeed } from "@/lib/seed-data";
import { blogSeed, extraSeo, faqSeed, logoSeed, packageSeed, processSeed, salesSections, servicePrices, statSeed } from "@/lib/commercial-seed";
import { landingSeed } from "@/lib/landing-seed";
import { asObject } from "@/lib/utils";

let started = false;

export async function bootstrap() {
  if (started) return;
  started = true;
  await ensureAdmin();
  await ensureContent();
  await ensureSales();
}

async function ensureAdmin() {
  const existing = await prisma.adminUser.count();
  if (existing > 0) return;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = process.env.ADMIN_NAME?.trim() || "مدیر";
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required to create the first admin.");
  }
  if (password.length < 10) {
    throw new Error("ADMIN_PASSWORD must be at least 10 characters.");
  }
  const secret = process.env.SESSION_SECRET || "";
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters.");
  }
  await prisma.adminUser.create({
    data: { email, name, passwordHash: await hashPassword(password) },
  });
  console.log(`Created admin ${email}`);
}

async function ensureContent() {
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (settings) return;
  await prisma.$transaction([
    prisma.siteSettings.create({ data: settingsSeed }),
    prisma.menuItem.createMany({ data: menuSeed }),
    prisma.section.createMany({ data: sectionSeed }),
    prisma.service.createMany({ data: serviceSeed }),
    prisma.project.createMany({ data: projectSeed }),
    prisma.testimonial.createMany({ data: testimonialSeed }),
    prisma.pageSeo.createMany({ data: seoSeed }),
  ]);
  console.log("Seeded site content");
}

async function ensureSales() {
  if ((await prisma.package.count()) === 0) await prisma.package.createMany({ data: packageSeed });
  if ((await prisma.processStep.count()) === 0) await prisma.processStep.createMany({ data: processSeed });
  if ((await prisma.stat.count()) === 0) await prisma.stat.createMany({ data: statSeed });
  if ((await prisma.clientLogo.count()) === 0) await prisma.clientLogo.createMany({ data: logoSeed });
  if ((await prisma.faq.count()) === 0) await prisma.faq.createMany({ data: faqSeed });
  if ((await prisma.blogPost.count()) === 0) await prisma.blogPost.createMany({ data: blogSeed });

  for (const section of salesSections) {
    const found = await prisma.section.findUnique({ where: { page_key: { page: section.page, key: section.key } } });
    if (!found) await prisma.section.create({ data: section });
  }
  for (const seo of extraSeo) {
    const found = await prisma.pageSeo.findUnique({ where: { id: seo.id } });
    if (!found) await prisma.pageSeo.create({ data: seo });
  }
  const blogLink = await prisma.menuItem.findFirst({ where: { href: "/blog" } });
  if (!blogLink) {
    await prisma.menuItem.createMany({
      data: [
        { label: "وبلاگ", labelEn: "Journal", href: "/blog", location: "header", sortOrder: 35, visible: true },
        { label: "وبلاگ", labelEn: "Journal", href: "/blog", location: "footer", sortOrder: 35, visible: true },
      ],
    });
  }

  const hero = await prisma.section.findUnique({ where: { page_key: { page: "home", key: "hero" } } });
  if (hero) {
    const content = asObject(hero.content);
    if (typeof content.title !== "string" || !content.title.trim()) {
      await prisma.section.update({
        where: { id: hero.id },
        data: {
          content: {
            ...content,
            kicker: "استودیو طراحی و توسعه وب",
            title: "طراحی سایت، فروشگاه اینترنتی، اپلیکیشن و سئو",
            value: "برای کسب‌وکاری که می‌خواهد مشتری بیاید، نه فقط یک صفحهٔ زیبا داشته باشد. مشاورهٔ اول رایگان است.",
            ctaPrimary: "مشاوره رایگان",
            ctaSecondary: "گفتگو در واتساپ",
            trust: "پاسخ در همان روز کاری",
          },
        },
      });
    }
  }

  const contact = await prisma.section.findUnique({ where: { page_key: { page: "contact", key: "contactIntro" } } });
  if (contact) {
    const content = asObject(contact.content);
    if (!Array.isArray(content.projectTypes)) {
      await prisma.section.update({
        where: { id: contact.id },
        data: {
          content: {
            ...content,
            projectTypes: ["سایت شرکتی", "فروشگاه اینترنتی", "اپلیکیشن", "سئو", "بازطراحی"],
            budgets: ["زیر ۲۰ میلیون", "۲۰ تا ۵۰ میلیون", "۵۰ تا ۱۰۰ میلیون", "بالای ۱۰۰ میلیون", "هنوز مشخص نیست"],
          },
        },
      });
    }
  }

  const services = await prisma.service.findMany();
  if (services.length && services.every((item) => !item.priceLabel)) {
    for (const service of services) {
      const price = servicePrices[service.number];
      if (!price) continue;
      await prisma.service.update({
        where: { id: service.id },
        data: { priceLabel: price.priceLabel, includes: price.includes },
      });
    }
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  const bg = settings?.backgroundColor.toLowerCase();
  const accent = settings?.accentColor.toLowerCase();
  const lightCommercial = bg === "#f5f7f6" && accent === "#0a5c32";
  const oldArt = bg === "#070708" && accent === "#d6ff3f";
  if (settings && (lightCommercial || oldArt)) {
    const socials = asObject(settings.socials);
    await prisma.siteSettings.update({
      where: { id: "default" },
      data: {
        accentColor: settingsSeed.accentColor,
        backgroundColor: settingsSeed.backgroundColor,
        surfaceColor: settingsSeed.surfaceColor,
        textColor: settingsSeed.textColor,
        mutedColor: settingsSeed.mutedColor,
        grainEnabled: false,
        webglEnabled: false,
        tagline: "طراحی سایت، فروشگاه، اپلیکیشن و سئو",
        description: settingsSeed.description,
        socials: {
          instagram: typeof socials.instagram === "string" ? socials.instagram : "",
          telegram: typeof socials.telegram === "string" && socials.telegram ? socials.telegram : "https://t.me/doctorsite",
          linkedin: typeof socials.linkedin === "string" ? socials.linkedin : "",
          github: typeof socials.github === "string" ? socials.github : "",
          whatsapp: typeof socials.whatsapp === "string" && socials.whatsapp ? socials.whatsapp : "https://wa.me/989121009100",
        },
      },
    });
  }

  await migrateArtCopy();
  await ensureGrowth();
}

async function ensureGrowth() {
  if ((await prisma.landingPage.count()) === 0) {
    await prisma.landingPage.createMany({ data: landingSeed });
  }
  const hero = await prisma.section.findUnique({ where: { page_key: { page: "home", key: "hero" } } });
  if (hero) {
    const content = asObject(hero.content);
    if (content.display === "Built to sell" || content.display === "برای فروش") {
      await prisma.section.update({
        where: { id: hero.id },
        data: {
          content: {
            ...content,
            kicker: "دکتر سایت",
            display: "طراحی سایت، برنامه‌نویسی، برندینگ و مارکتینگ",
            title: "سایت، نرم‌افزار و رشد در گوگل را یک‌جا تحویل می‌دهیم",
            value: "از صفحه معرفی تا فروشگاه، از کدنویسی تا سئو. مشاوره اول رایگان است.",
            ctaPrimary: "مشاوره رایگان",
            trust: "شروع قیمت روی سایت نوشته شده است",
          },
        },
      });
    }
  }
  const titles = (await prisma.service.findMany({ orderBy: { sortOrder: "asc" } })).map((item) => item.title);
  const old = ["طراحی سایت", "فروشگاه اینترنتی", "اپلیکیشن", "سئو"];
  if (titles.length >= 4 && old.every((title, index) => titles[index] === title)) {
    const next = [
      { title: "طراحی سایت", titleEn: "طراحی", summary: "سایت معرفی و فروشگاه، موبایل‌اول، با فرم تماس و ساختار سئو.", href: "/tarahi-site", priceLabel: "شروع از ۱۸ میلیون تومان" },
      { title: "برنامه‌نویسی", titleEn: "کد", summary: "وب‌اپ، پنل و اتصال پرداخت وقتی قالب آماده کافی نیست.", href: "/barname-nevisi", priceLabel: "شروع از ۴۸ میلیون تومان" },
      { title: "برندینگ", titleEn: "برند", summary: "پیام، لحن و ساختار صفحات تا مشتری بفهمد چرا شما را انتخاب کند.", href: "/branding-marketing", priceLabel: "همراه پروژه سایت" },
      { title: "دیجیتال مارکتینگ و سئو", titleEn: "رشد", summary: "صفحه هر عبارت کلیدی، محتوای مرتبط و گزارش قابل فهم.", href: "/branding-marketing", priceLabel: "از ۱۲ میلیون تومان در ماه" },
    ];
    const rows = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
    for (let i = 0; i < 4; i++) {
      await prisma.service.update({ where: { id: rows[i].id }, data: next[i] });
    }
  }
  const header = await prisma.menuItem.findMany({ where: { location: "header" } });
  if (!header.some((item) => item.href === "/services#pricing")) {
    await prisma.menuItem.create({ data: { label: "تعرفه", labelEn: "Pricing", href: "/services#pricing", location: "header", sortOrder: 25, visible: true } });
  }
  const homeSeo = await prisma.pageSeo.findUnique({ where: { id: "home" } });
  if (homeSeo && (homeSeo.title.includes("مهندسی") || homeSeo.title.includes("Built") || !homeSeo.keywords.includes("برندینگ"))) {
    await prisma.pageSeo.update({
      where: { id: "home" },
      data: {
        title: "دکتر سایت | طراحی سایت، برنامه نویسی، برندینگ و مارکتینگ",
        description: "طراحی سایت، برنامه‌نویسی وب، برندینگ و دیجیتال مارکتینگ برای کسب‌وکارهای ایرانی. مشاوره اولیه رایگان است.",
        keywords: "طراحی سایت,برنامه نویسی,برندینگ و مارکتینگ,سئو,دکتر سایت",
      },
    });
  }
  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (settings && !settings.newsletterTitle) {
    await prisma.siteSettings.update({
      where: { id: "default" },
      data: {
        newsletterTitle: "یادداشت‌های کوتاه درباره سایت و سئو",
        copyright: settings.copyright || `© ${new Date().getFullYear()} دکتر سایت`,
      },
    });
  }
}

const oldSectionTitles = new Set([
  "هر پیکسل را می‌نویسیم، قرض نمی‌گیریم.",
  "از هویت تا محصول، یک زبان.",
  "نمونه‌ای از لحن کار.",
  "یک میز کار. یک استاندارد.",
  "اگر قالب برایتان کم است، حرف بزنیم.",
  "کارهایی که از صفر نوشته شدند.",
  "پنج شکل همکاری، یک کیفیت.",
  "وب فارسی لازم نیست شبیه هم باشد.",
  "چهار خطی که کار را نگه می‌دارد.",
  "چند خط کافی است.",
]);

async function migrateArtCopy() {
  const services = await prisma.service.findMany();
  if (services.some((item) => item.title === "هویت دیجیتال")) {
    await prisma.service.deleteMany();
    await prisma.service.createMany({ data: serviceSeed });
  }

  for (const seed of sectionSeed) {
    const row = await prisma.section.findUnique({ where: { page_key: { page: seed.page, key: seed.key } } });
    if (!row) continue;
    const current = asObject(row.content);
    const title = typeof current.title === "string" ? current.title : "";
    const text = typeof current.text === "string" ? current.text : "";
    const art =
      oldSectionTitles.has(title) ||
      text.includes("حجم زنده") ||
      (seed.key === "hero" && (!current.kicker || current.kicker === "استودیو طراحی و توسعه وب" || current.kicker === "آژانس طراحی سایت" || !current.display));
    if (!art) continue;
    await prisma.section.update({
      where: { id: row.id },
      data: {
        content: (seed.key === "hero" ? { ...current, ...asObject(seed.content) } : seed.content) as Prisma.InputJsonValue,
        visible: seed.key === "marquee" || seed.key === "manifesto" ? false : row.visible,
      },
    });
  }

  const sample = await prisma.project.findUnique({ where: { slug: "noir-house" } });
  const sampleTags = Array.isArray(sample?.tags) ? sample.tags.filter((tag): tag is string => typeof tag === "string") : [];
  if (sample && (sample.subtitle.includes("هویت") || sampleTags.some((tag) => tag === "WebGL" || tag === "هویت"))) {
    for (const project of projectSeed) {
      const { slug, ...data } = project;
      await prisma.project.update({ where: { slug }, data });
    }
  }

  const ghostByTitle: Record<string, string> = {
    "طراحی سایت": "طراحی",
    "فروشگاه اینترنتی": "فروشگاه",
    "اپلیکیشن": "اپ",
    "سئو": "سئو",
  };
  const templateGhost = new Set(["WEB DESIGN", "STORE", "APP", "SEO", "BRANDING", "CONTENT HUB"]);
  for (const service of await prisma.service.findMany()) {
    const next = ghostByTitle[service.title];
    if (next && templateGhost.has(service.titleEn.trim().toUpperCase())) {
      await prisma.service.update({ where: { id: service.id }, data: { titleEn: next } });
    }
  }

  const quotes = await prisma.testimonial.findMany();
  if (quotes.some((item) => item.quote.includes("قالب آماده") || item.quote.includes("ثانیه اول"))) {
    await prisma.testimonial.deleteMany();
    await prisma.testimonial.createMany({ data: testimonialSeed });
  }

  for (const seo of seoSeed) {
    const row = await prisma.pageSeo.findUnique({ where: { id: seo.id } });
    if (!row) continue;
    if (row.title.includes("نه قالب") || row.description.includes("WebGL") || row.description.includes("هویت دیجیتال") || row.title === "استودیو" || row.description.includes("قالب")) {
      await prisma.pageSeo.update({
        where: { id: seo.id },
        data: {
          title: seo.title,
          description: seo.description,
          keywords: seo.keywords,
        },
      });
    }
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: "default" } });
  if (settings) {
    const phone = settings.phone.replace(/\s/g, "");
    const patch: { phone?: string; footerNote?: string; description?: string; tagline?: string } = {};
    if (phone.includes("91009100") && settings.phone !== settingsSeed.phone) patch.phone = settingsSeed.phone;
    if (settings.footerNote.includes("ظرفیت هر فصل") || settings.footerNote.includes("مهندسی اختصاصی")) patch.footerNote = settingsSeed.footerNote;
    if (settings.description.includes("WebGL") || settings.description.includes("قالب")) patch.description = settingsSeed.description;
    if (settings.tagline.includes("مهندسی") && !settings.tagline.includes("فروشگاه")) patch.tagline = settingsSeed.tagline;
    if (Object.keys(patch).length) await prisma.siteSettings.update({ where: { id: "default" }, data: patch });
  }

  const logos = await prisma.section.findUnique({ where: { page_key: { page: "home", key: "logos" } } });
  if (logos && !asObject(logos.content).note) {
    await prisma.section.update({
      where: { id: logos.id },
      data: { content: { ...asObject(logos.content), note: "نام‌ها نمونه نمایشی‌اند و از پنل با مشتری واقعی عوض می‌شوند." } },
    });
  }

  const header = await prisma.menuItem.findMany({ where: { location: "header" } });
  if (header.some((item) => item.label === "استودیو")) {
    await prisma.menuItem.updateMany({ where: { label: "استودیو" }, data: { label: "درباره ما", labelEn: "About" } });
  }
  const links = await prisma.menuItem.findMany();
  if (!links.some((item) => item.href === "/blog")) {
    await prisma.menuItem.createMany({
      data: menuSeed.filter((item) => item.href === "/blog" || item.href === "/faq"),
    });
  }
}
