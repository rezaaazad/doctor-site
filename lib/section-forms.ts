export type FieldDef =
  | { type: "text" | "textarea"; name: string; label: string }
  | { type: "lines"; name: string; label: string }
  | { type: "pairs"; name: string; label: string };

export const SECTION_FORMS: Record<string, { label: string; fields: FieldDef[] }> = {
  hero: {
    label: "هیرو",
    fields: [
      { type: "text", name: "badge", label: "نشان وضعیت (باز)" },
      { type: "text", name: "badgeClosed", label: "نشان وضعیت (بسته)" },
      { type: "text", name: "titleBefore", label: "سطر اول عنوان" },
      { type: "text", name: "titleAccent", label: "کلمه تأکیدی" },
      { type: "text", name: "titleAfter", label: "ادامه عنوان" },
      { type: "text", name: "scrollLabel", label: "برچسب اسکرول" },
      { type: "text", name: "railKicker", label: "برچسب ریل" },
      { type: "text", name: "railTitle", label: "عنوان راهنمای ریل" },
      { type: "textarea", name: "railText", label: "متن راهنمای ریل" },
      { type: "text", name: "indexStart", label: "شماره بالا" },
      { type: "text", name: "indexEnd", label: "شماره پایین" },
      { type: "text", name: "kicker", label: "خط کوچک بالای هیرو" },
      { type: "text", name: "display", label: "عنوان انگلیسی بزرگ هیرو" },
      { type: "textarea", name: "title", label: "عنوان فارسی هیرو" },
      { type: "textarea", name: "value", label: "یک خط ارزش" },
      { type: "text", name: "ctaPrimary", label: "دکمه مشاوره" },
      { type: "text", name: "ctaSecondary", label: "دکمه واتساپ" },
      { type: "text", name: "trust", label: "جمله اعتماد" },
    ],
  },
  marquee: {
    label: "نوار متحرک",
    fields: [{ type: "text", name: "text", label: "متن نوار" }],
  },
  manifesto: {
    label: "بیانیه",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "textarea", name: "title", label: "عنوان" },
      { type: "textarea", name: "body", label: "متن" },
      { type: "lines", name: "points", label: "نکته‌ها، هر خط یکی" },
    ],
  },
  servicesTeaser: {
    label: "پیش‌نمایش خدمات",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "text", name: "title", label: "عنوان" },
      { type: "text", name: "linkLabel", label: "متن پیوند" },
    ],
  },
  testimonials: {
    label: "نظرات",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "text", name: "title", label: "عنوان" },
    ],
  },
  aboutTeaser: {
    label: "اشاره به استودیو",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "textarea", name: "title", label: "عنوان" },
      { type: "textarea", name: "body", label: "متن" },
      { type: "text", name: "linkLabel", label: "متن پیوند" },
    ],
  },
  cta: {
    label: "دعوت به تماس",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "textarea", name: "title", label: "عنوان" },
      { type: "text", name: "button", label: "متن دکمه" },
    ],
  },
  portfolioIntro: {
    label: "مقدمه نمونه‌کارها",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "text", name: "display", label: "عنوان بزرگ" },
      { type: "textarea", name: "title", label: "عنوان" },
      { type: "textarea", name: "body", label: "متن" },
    ],
  },
  servicesIntro: {
    label: "مقدمه خدمات",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "text", name: "display", label: "عنوان بزرگ" },
      { type: "textarea", name: "title", label: "عنوان" },
      { type: "textarea", name: "body", label: "متن" },
      { type: "text", name: "linkLabel", label: "متن دکمه" },
    ],
  },
  story: {
    label: "داستان استودیو",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "text", name: "display", label: "عنوان بزرگ" },
      { type: "textarea", name: "title", label: "عنوان" },
      { type: "textarea", name: "body", label: "متن (پاراگراف‌ها با یک خط خالی)" },
    ],
  },
  principles: {
    label: "اصول",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "text", name: "title", label: "عنوان" },
      { type: "pairs", name: "items", label: "اصل‌ها" },
    ],
  },
  contactIntro: {
    label: "مقدمه تماس",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "text", name: "display", label: "عنوان بزرگ" },
      { type: "textarea", name: "title", label: "عنوان" },
      { type: "textarea", name: "body", label: "متن" },
      { type: "text", name: "submitLabel", label: "متن دکمه ارسال" },
      { type: "text", name: "success", label: "پیام موفقیت" },
      { type: "lines", name: "projectTypes", label: "انواع پروژه، هر خط یکی" },
      { type: "lines", name: "budgets", label: "بازه‌های بودجه، هر خط یکی" },
    ],
  },
  pricing: {
    label: "تعرفه",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "text", name: "title", label: "عنوان" },
      { type: "textarea", name: "body", label: "توضیح" },
    ],
  },
  process: {
    label: "روند کار",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "text", name: "title", label: "عنوان" },
    ],
  },
  why: {
    label: "چرا ما",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "textarea", name: "title", label: "عنوان" },
      { type: "lines", name: "points", label: "قول‌ها، هر خط یکی" },
    ],
  },
  logos: {
    label: "مشتری‌ها",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "text", name: "title", label: "عنوان" },
      { type: "text", name: "note", label: "یادداشت زیر لوگوها" },
    ],
  },
  faq: {
    label: "پرسش‌ها",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "text", name: "title", label: "عنوان" },
    ],
  },
  blogTeaser: {
    label: "وبلاگ",
    fields: [
      { type: "text", name: "kicker", label: "برچسب" },
      { type: "text", name: "title", label: "عنوان" },
      { type: "text", name: "linkLabel", label: "متن پیوند" },
    ],
  },
};

export const PAGE_LABELS: Record<string, string> = {
  home: "خانه",
  portfolio: "نمونه‌کارها",
  services: "خدمات",
  about: "استودیو",
  contact: "تماس",
  blog: "وبلاگ",
  faq: "پرسش‌ها",
};
