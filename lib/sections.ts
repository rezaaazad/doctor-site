// Declarative registry of page sections. Each section key has editable fields + Persian defaults.
// The admin editor renders forms from this, the public site merges stored content over defaults.

export type SectionFieldType = "text" | "textarea" | "url" | "image" | "boolean" | "number" | "select" | "datetime" | "list" | "products";

export type SectionField = {
  key: string;
  label: string;
  type: SectionFieldType;
  hint?: string;
  options?: [string, string][];
  fields?: SectionField[];
  max?: number;
  dir?: "ltr";
};

export type SectionDef = {
  key: string;
  page: string;
  label: string;
  description: string;
  order: number;
  defaults: Record<string, unknown>;
  fields: SectionField[];
  /** Data the section pulls from other admin areas, shown as a hint in the editor. */
  source?: { label: string; href: string };
};

const text = (key: string, label: string, hint?: string): SectionField => ({ key, label, type: "text", hint });
const area = (key: string, label: string, hint?: string): SectionField => ({ key, label, type: "textarea", hint });
const url = (key: string, label: string): SectionField => ({ key, label, type: "url", dir: "ltr" });
const num = (key: string, label: string, max = 24): SectionField => ({ key, label, type: "number", max });
const bool = (key: string, label: string, hint?: string): SectionField => ({ key, label, type: "boolean", hint });
const image = (key: string, label: string, hint?: string): SectionField => ({ key, label, type: "image", hint });
const list = (key: string, label: string, fields: SectionField[], max = 12): SectionField => ({ key, label, type: "list", fields, max });

export const PRODUCT_SOURCES: [string, string][] = [
  ["featured", "محصولات ویژه (تیک «ویژه» در محصول)"],
  ["bestseller", "پرفروش‌ترین‌ها"],
  ["newest", "جدیدترین‌ها"],
  ["sale", "تخفیف‌دارها"],
  ["rating", "بیشترین امتیاز"],
  ["manual", "انتخاب دستی (نامک محصولات)"],
];

const productsFields = (defaults: { limit: number }): SectionField[] => [
  text("eyebrow", "روتیتر"),
  text("title", "عنوان"),
  area("body", "توضیح کوتاه"),
  { key: "source", label: "منبع محصولات", type: "select", options: PRODUCT_SOURCES },
  text("category", "فقط از دسته (نامک، اختیاری)"),
  area("slugs", "نامک محصولات (برای انتخاب دستی، هر خط یکی)"),
  num("limit", `تعداد (پیش‌فرض ${defaults.limit})`, 24),
  text("ctaLabel", "متن دکمه"),
  url("ctaHref", "پیوند دکمه"),
];

export const SECTIONS: SectionDef[] = [
  {
    key: "storeHero",
    page: "home",
    label: "هیرو فروشگاه",
    description: "اولین چیزی که مشتری می‌بیند: پیشنهاد اصلی، دکمه خرید و یک محصول منتخب.",
    order: 10,
    defaults: {
      eyebrow: "فروشگاه رسمی دکتر سایت",
      title: "ابزارهای آماده برای فروش آنلاین؛",
      highlight: "همین امروز راه بیندازید",
      body: "قالب‌ها، کیت‌های فروشگاهی، کارت ویزیت هوشمند و پکیج‌های سئو؛ همه با تحویل فوری، پشتیبانی واقعی و امکان خرید اقساطی.",
      primaryLabel: "مشاهده محصولات",
      primaryHref: "/store",
      secondaryLabel: "مشاوره رایگان خرید",
      secondaryHref: "/contact",
      slides: [{ eyebrow: "مجموعه فروشگاهی", title: "ویترین بعدی شما", highlight: "از اینجا شروع می‌شود", body: "محصولات و ابزارهای ساخت فروشگاه را کنار هم ببینید.", href: "/store", label: "ورود به فروشگاه", image: "/covers/lumen.svg" }],
      spotlight: "",
      spotlightNote: "پیشنهاد این هفته",
      spotlightImage: "",
      rating: "۴٫۹",
      ratingLabel: "رضایت از ۱٬۲۰۰+ خرید",
      stats: [
        { value: "۱٬۲۰۰+", label: "سفارش موفق" },
        { value: "۲۴ ساعت", label: "میانگین تحویل" },
        { value: "۷ روز", label: "ضمانت بازگشت" },
      ],
    },
    fields: [
      text("eyebrow", "روتیتر"),
      text("title", "تیتر اصلی"),
      text("highlight", "بخش رنگی تیتر"),
      area("body", "توضیح"),
      text("primaryLabel", "دکمه اصلی"),
      url("primaryHref", "پیوند دکمه اصلی"),
      text("secondaryLabel", "دکمه دوم"),
      url("secondaryHref", "پیوند دکمه دوم"),
      list("slides", "اسلایدهای بعدی", [text("eyebrow","روتیتر"), text("title","عنوان"), text("highlight","تأکید"), area("body","توضیح"), image("image","تصویر"), text("label","دکمه"), url("href","پیوند")], 8),
      text("spotlight", "محصول منتخب (نامک)", "خالی بماند تا اولین محصول ویژه نمایش داده شود."),
      image("spotlightImage", "تصویر جایگزین محصول منتخب (اختیاری)", "اگر پر شود به‌جای تصویر محصول در هیرو نمایش داده می‌شود."),
      text("spotlightNote", "برچسب محصول منتخب"),
      text("rating", "امتیاز نمایشی"),
      text("ratingLabel", "متن کنار امتیاز"),
      list("stats", "آمار کوتاه", [text("value", "عدد"), text("label", "عنوان")], 4),
    ],
  },
  {
    key: "trustBar",
    page: "home",
    label: "نوار اعتماد",
    description: "چهار تضمین کوتاه زیر هیرو.",
    order: 20,
    defaults: {
      items: [
        { icon: "zap", title: "تحویل فوری فایل", body: "لینک دانلود بلافاصله بعد از پرداخت" },
        { icon: "shield", title: "پرداخت امن", body: "درگاه بانکی و اقساطی معتبر" },
        { icon: "award", title: "اصالت محصول", body: "مشخصات و نسخه را پیش از خرید بررسی کنید" },
        { icon: "headset", title: "پشتیبانی واقعی", body: "پاسخ در همان روز کاری" },
      ],
    },
    fields: [list("items", "موارد", [{ key: "icon", label: "آیکون", type: "select", options: [["zap", "صاعقه"], ["shield", "سپر"], ["rotate", "بازگشت"], ["headset", "پشتیبانی"], ["truck", "ارسال"], ["card", "کارت"], ["award", "مدال"], ["clock", "ساعت"]] }, text("title", "عنوان"), text("body", "توضیح")], 6)],
  },
  {
    key: "categoryGrid",
    page: "home",
    label: "دسته‌بندی‌ها",
    description: "دسته‌های فروشگاه که «ویژه» علامت خورده‌اند (یا همه، اگر هیچ‌کدام ویژه نیست).",
    order: 30,
    source: { label: "مدیریت دسته‌ها", href: "/admin/store/categories" },
    defaults: { promos: [{title:"پرفروش‌های فروشگاه",image:"/covers/orbit.svg",href:"/store?sort=sales"},{title:"محصولات تخفیف‌دار",image:"/covers/noir.svg",href:"/store?sale=1"}],  eyebrow: "خرید بر اساس نیاز", title: "از کجا شروع کنیم؟", body: "", limit: 6 },
    fields: [list("promos","بنرها", [text("title","عنوان"),image("image","تصویر"),url("href","پیوند")], 3), text("eyebrow", "روتیتر"), text("title", "عنوان"), area("body", "توضیح"), num("limit", "حداکثر تعداد", 12)],
  },
  {
    key: "dealOfDay",
    page: "home",
    label: "پیشنهاد شگفت‌انگیز",
    description: "یک محصول با تخفیف و شمارش معکوس واقعی. اگر محصول تخفیف یا زمان پایان نداشته باشد، بخش نمایش داده نمی‌شود.",
    order: 40,
    defaults: { eyebrow: "پیشنهاد محدود", title: "تخفیف امروز", body: "این قیمت فقط تا پایان زمان نمایش‌داده‌شده معتبر است.", product: "", ctaLabel: "خرید با تخفیف" },
    fields: [text("eyebrow", "روتیتر"), text("title", "عنوان"), area("body", "توضیح"), text("product", "نامک محصول", "خالی = محصول تخفیف‌داری که زودتر تمام می‌شود."), text("ctaLabel", "متن دکمه")],
  },
  {
    key: "featuredProducts",
    page: "home",
    label: "محصولات ویژه",
    description: "شبکه محصولات منتخب.",
    order: 50,
    defaults: { eyebrow: "منتخب فروشگاه", title: "محصولاتی که بیشتر از همه انتخاب می‌شوند", body: "", source: "featured", category: "", slugs: "", limit: 8, ctaLabel: "همه محصولات", ctaHref: "/store" },
    fields: productsFields({ limit: 8 }),
  },
  {
    key: "installments",
    page: "home",
    label: "بنر خرید اقساطی",
    description: "معرفی پرداخت اقساطی اسنپ‌پی/ترب‌پی. فقط وقتی یکی از این درگاه‌ها فعال باشد نمایش داده می‌شود.",
    order: 60,
    defaults: {
      eyebrow: "الان بخرید، بعداً بپردازید",
      title: "خرید اقساطی، بدون ضامن و بدون چک",
      body: "در مرحله پرداخت، اسنپ‌پی یا ترب‌پی را انتخاب کنید. مبلغ در چند قسط ماهانه و بدون کارمزد اضافه پرداخت می‌شود.",
      bullets: "تأیید آنلاین در چند دقیقه\nبدون پیش‌پرداخت اضافه\nبرای سفارش‌های بالای ۱ میلیون تومان",
      ctaLabel: "محصولات قابل خرید اقساطی",
      ctaHref: "/store?installments=1",
    },
    fields: [text("eyebrow", "روتیتر"), text("title", "عنوان"), area("body", "توضیح"), area("bullets", "مزیت‌ها (هر خط یکی)"), text("ctaLabel", "متن دکمه"), url("ctaHref", "پیوند دکمه")],
  },
  {
    key: "bestsellers",
    page: "home",
    label: "پرفروش‌ها",
    description: "ردیف افقی پرفروش‌ترین محصولات.",
    order: 70,
    defaults: { eyebrow: "پرفروش‌ترین‌ها", title: "انتخاب اول مشتری‌ها", body: "", source: "bestseller", category: "", slugs: "", limit: 10, ctaLabel: "مشاهده همه", ctaHref: "/store?sort=bestseller" },
    fields: productsFields({ limit: 10 }),
  },
  {
    key: "socialProof",
    page: "home",
    label: "نظر مشتری‌ها",
    description: "نظرهای تأییدشده مشتری‌ها و خلاصه امتیاز.",
    order: 80,
    source: { label: "نظرات مشتریان", href: "/admin/testimonials" },
    defaults: { eyebrow: "نظر خریداران", title: "به‌جای ما، مشتری‌ها می‌گویند", body: "" },
    fields: [text("eyebrow", "روتیتر"), text("title", "عنوان"), area("body", "توضیح")],
  },
  {
    key: "newArrivals",
    page: "home",
    label: "جدیدترین‌ها",
    description: "تازه‌ترین محصولات اضافه‌شده.",
    order: 90,
    defaults: { eyebrow: "تازه رسیده", title: "جدیدترین محصولات", body: "", source: "newest", category: "", slugs: "", limit: 4, ctaLabel: "همه جدیدها", ctaHref: "/store?sort=newest" },
    fields: productsFields({ limit: 4 }),
  },
  {
    key: "servicesStrip",
    page: "home",
    label: "خدمات استودیو",
    description: "خدمات طراحی سایت و برنامه‌نویسی (از بخش خدمات).",
    order: 100,
    source: { label: "مدیریت خدمات", href: "/admin/services" },
    defaults: { eyebrow: "خدمات سفارشی", title: "محصول آماده کافی نیست؟ برایتان می‌سازیم", body: "طراحی سایت، فروشگاه اینترنتی، اپلیکیشن و سئو؛ با قیمت شروع روشن و قرارداد مکتوب.", ctaLabel: "همه خدمات", ctaHref: "/services" },
    fields: [text("eyebrow", "روتیتر"), text("title", "عنوان"), area("body", "توضیح"), text("ctaLabel", "متن دکمه"), url("ctaHref", "پیوند دکمه")],
  },
  {
    key: "portfolioStrip",
    page: "home",
    label: "نمونه‌کارها",
    description: "نمونه‌کارهای منتخب.",
    order: 110,
    source: { label: "مدیریت نمونه‌کارها", href: "/admin/projects" },
    defaults: { eyebrow: "نمونه‌کار", title: "کارهایی که تحویل داده‌ایم", body: "", limit: 3, ctaLabel: "همه نمونه‌کارها", ctaHref: "/portfolio" },
    fields: [text("eyebrow", "روتیتر"), text("title", "عنوان"), area("body", "توضیح"), num("limit", "تعداد", 9), text("ctaLabel", "متن دکمه"), url("ctaHref", "پیوند دکمه")],
  },
  {
    key: "processSteps",
    page: "home",
    label: "روند همکاری",
    description: "مراحل کار (از بخش روند کار).",
    order: 120,
    source: { label: "مراحل کار", href: "/admin/process" },
    defaults: { eyebrow: "روند کار", title: "از سفارش تا تحویل، شفاف", body: "" },
    fields: [text("eyebrow", "روتیتر"), text("title", "عنوان"), area("body", "توضیح")],
  },
  {
    key: "pricingPlans",
    page: "home",
    label: "تعرفه‌ها",
    description: "بسته‌های قیمت خدمات سفارشی.",
    order: 130,
    source: { label: "بسته‌های قیمت", href: "/admin/pricing" },
    defaults: { eyebrow: "تعرفه", title: "قیمت شروع، روشن و بدون هزینه پنهان", body: "عدد نهایی بعد از دیدن نیاز شما و به‌صورت مکتوب اعلام می‌شود." },
    fields: [text("eyebrow", "روتیتر"), text("title", "عنوان"), area("body", "توضیح")],
  },
  {
    key: "clientLogos",
    page: "home",
    label: "لوگوی مشتریان",
    description: "نوار لوگوی برندهایی که با شما کار کرده‌اند.",
    order: 140,
    source: { label: "لوگوها", href: "/admin/logos" },
    defaults: { title: "کسب‌وکارهایی که به ما اعتماد کرده‌اند" },
    fields: [text("title", "عنوان")],
  },
  {
    key: "faqList",
    page: "home",
    label: "پرسش‌های رایج",
    description: "پرسش و پاسخ (از بخش پرسش‌ها).",
    order: 150,
    source: { label: "پرسش‌ها", href: "/admin/faq" },
    defaults: { eyebrow: "پرسش‌های رایج", title: "قبل از خرید، این‌ها را بدانید", body: "جواب سؤالتان نیست؟ تماس بگیرید؛ کمتر از ۵ دقیقه طول می‌کشد.", limit: 8 },
    fields: [text("eyebrow", "روتیتر"), text("title", "عنوان"), area("body", "توضیح"), num("limit", "تعداد", 20)],
  },
  {
    key: "leadForm",
    page: "home",
    label: "فرم مشاوره",
    description: "فرم دریافت شماره برای تماس (لیدها در «درخواست‌ها» ذخیره می‌شوند).",
    order: 160,
    defaults: {
      eyebrow: "مشاوره رایگان",
      title: "نمی‌دانید کدام را بخرید؟ ۱۰ دقیقه با ما صحبت کنید",
      body: "شماره‌تان را بگذارید؛ یک کارشناس (نه ربات) تماس می‌گیرد و بهترین گزینه را با بودجه شما پیشنهاد می‌دهد.",
      types: "خرید محصول آماده\nطراحی سایت شرکتی\nفروشگاه اینترنتی\nسئو و دیجیتال مارکتینگ\nاپلیکیشن",
      budgets: "",
      submitLabel: "تماس بگیرید",
      bullets: "پاسخ در کمتر از یک ساعت کاری\nبدون هزینه و بدون تعهد خرید\nپیشنهاد مکتوب و شفاف",
    },
    fields: [text("eyebrow", "روتیتر"), text("title", "عنوان"), area("body", "توضیح"), area("bullets", "مزیت‌ها (هر خط یکی)"), area("types", "گزینه‌های نیاز (هر خط یکی)"), area("budgets", "بازه‌های بودجه (هر خط یکی، اختیاری)"), text("submitLabel", "متن دکمه")],
  },
  {
    key: "blogLatest",
    page: "home",
    label: "آخرین مقاله‌ها",
    description: "سه مقاله آخر وبلاگ.",
    order: 170,
    source: { label: "نوشته‌ها", href: "/admin/posts" },
    defaults: { seoTitle: "خرید ابزارهای دیجیتال از دکتر سایت", seoBody: "در دکتر سایت می‌توانید ابزارهای ساخت و مدیریت فروشگاه را بررسی کنید. در صفحه هر محصول، ویژگی‌ها، قیمت و روش تحویل را بخوانید و گزینه مناسب کسب‌وکارتان را انتخاب کنید.",  promos: [{title:"ابزارهای فروشگاهی",href:"/store",image:"/covers/atrium.svg"},{title:"راهنمای خرید",href:"/blog",image:"/covers/glyph.svg"},{title:"مشاوره پروژه",href:"/contact",image:"/covers/lumen.svg"}],  eyebrow: "مجله", title: "راهنمای خرید و رشد فروش آنلاین", body: "", limit: 3, ctaLabel: "همه مقاله‌ها", ctaHref: "/blog" },
    fields: [text("seoTitle","عنوان معرفی فروشگاه"),area("seoBody","متن معرفی فروشگاه"), list("promos","بنرها", [text("title","عنوان"),image("image","تصویر"),url("href","پیوند")], 3), text("eyebrow", "روتیتر"), text("title", "عنوان"), area("body", "توضیح"), num("limit", "تعداد", 6), text("ctaLabel", "متن دکمه"), url("ctaHref", "پیوند دکمه")],
  },
  {
    key: "storeIntro",
    page: "store",
    label: "معرفی فروشگاه",
    description: "تیتر و توضیح بالای صفحه فروشگاه.",
    order: 10,
    defaults: { title: "فروشگاه", body: "محصولات دیجیتال با تحویل فوری و کالاهای فیزیکی با ارسال سریع؛ همه با ضمانت بازگشت وجه." },
    fields: [text("title", "عنوان (H1)"), area("body", "توضیح")],
  },
  {
    key: "productTrust",
    page: "product",
    label: "تضمین‌های صفحه محصول",
    description: "موارد کوتاه کنار دکمه خرید.",
    order: 10,
    defaults: {
      items: [
        { title: "ضمانت ۷ روزه بازگشت وجه", body: "اگر راضی نبودید، پولتان را پس می‌دهیم." },
        { title: "پشتیبانی واقعی", body: "پاسخ در همان روز کاری با تلفن یا تیکت." },
        { title: "پرداخت امن یا اقساطی", body: "درگاه بانکی معتبر، اسنپ‌پی و ترب‌پی." },
      ],
    },
    fields: [list("items", "موارد", [text("title", "عنوان"), text("body", "توضیح")], 5)],
  },
];

export const SECTION_BY_PAGE_KEY = new Map(SECTIONS.map((s) => [`${s.page}:${s.key}`, s]));

export function sectionDef(page: string, key: string) {
  return SECTION_BY_PAGE_KEY.get(`${page}:${key}`);
}

export function sectionPages() {
  return [...new Set(SECTIONS.map((s) => s.page))];
}

export function mergeContent(def: SectionDef | undefined, stored: unknown): Record<string, unknown> {
  const base = def?.defaults ?? {};
  const value = stored && typeof stored === "object" && !Array.isArray(stored) ? (stored as Record<string, unknown>) : {};
  const out: Record<string, unknown> = { ...base };
  for (const [key, v] of Object.entries(value)) {
    if (!def || def.fields.some((f) => f.key === key)) out[key] = v;
  }
  return out;
}

export const lines = (value: unknown) =>
  String(value ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

export const str = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
export const listOf = (value: unknown): Record<string, string>[] =>
  Array.isArray(value) ? value.filter((v) => v && typeof v === "object").map((v) => Object.fromEntries(Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, String(x ?? "")]))) : [];
