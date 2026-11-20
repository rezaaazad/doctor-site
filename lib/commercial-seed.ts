import type { Prisma } from "@prisma/client";

export const packageSeed: Prisma.PackageCreateManyInput[] = [
  {
    name: "سایت شرکتی",
    price: "از ۱۸ میلیون تومان",
    summary: "برای معرفی خدمات، جذب تماس و اعتمادسازی.",
    features: ["طراحی اختصاصی موبایل‌اول", "فرم درخواست مشاوره", "سئو پایه و سرعت مناسب", "آموزش تحویل و یک ماه پشتیبانی"],
    highlighted: false,
    sortOrder: 10,
    visible: true,
  },
  {
    name: "فروشگاه اینترنتی",
    price: "از ۳۵ میلیون تومان",
    summary: "برای فروش محصول، با مسیر خرید روشن.",
    features: ["صفحه محصول و دسته‌بندی", "سبد و درگاه پرداخت", "مدیریت سفارش", "سئو فروشگاهی پایه"],
    highlighted: true,
    sortOrder: 20,
    visible: true,
  },
  {
    name: "سئو و رشد",
    price: "از ۱۲ میلیون تومان در ماه",
    summary: "برای دیده شدن در گوگل بعد از انتشار سایت.",
    features: ["تحقیق کلمه کلیدی", "بهینه‌سازی صفحات اصلی", "گزارش ماهانه", "پیشنهاد محتوای وبلاگ"],
    highlighted: false,
    sortOrder: 30,
    visible: true,
  },
];

export const processSeed: Prisma.ProcessStepCreateManyInput[] = [
  { number: "۰۱", title: "جلسه نیازسنجی", body: "هدف کسب‌وکار، مخاطب و محدوده کار را در یک تماس یا جلسه رایگان روشن می‌کنیم.", sortOrder: 10, visible: true },
  { number: "۰۲", title: "پیشنهاد و قرارداد", body: "زمان، قیمت و آنچه تحویل می‌گیرید مکتوب می‌شود. هزینه پنهان ندارد.", sortOrder: 20, visible: true },
  { number: "۰۳", title: "طراحی و ساخت", body: "طرح را روی موبایل می‌بینید، بعد توسعه انجام می‌شود. در مسیر، نمونه می‌فرستیم.", sortOrder: 30, visible: true },
  { number: "۰۴", title: "انتشار و پشتیبانی", body: "سایت بالا می‌آید، آموزش می‌دهیم و در دوره پشتیبانی کنار شما می‌مانیم.", sortOrder: 40, visible: true },
];

export const statSeed: Prisma.StatCreateManyInput[] = [
  { value: "۸۰+", label: "پروژه تحویل‌شده", sortOrder: 10, visible: true },
  { value: "۷ روز", label: "تا شروع کار بعد از قرارداد", sortOrder: 20, visible: true },
  { value: "۱۲ ماه", label: "پشتیبانی روی پلن‌های رشد", sortOrder: 30, visible: true },
  { value: "رایگان", label: "مشاوره و برآورد اولیه", sortOrder: 40, visible: true },
];

export const logoSeed: Prisma.ClientLogoCreateManyInput[] = [
  { name: "خانه نوآر", sortOrder: 10, visible: true, imageUrl: "" },
  { name: "آزمایشگاه مدار", sortOrder: 20, visible: true, imageUrl: "" },
  { name: "کارگاه لومن", sortOrder: 30, visible: true, imageUrl: "" },
  { name: "دفتر آتریوم", sortOrder: 40, visible: true, imageUrl: "" },
  { name: "گلیف", sortOrder: 50, visible: true, imageUrl: "" },
];

export const faqSeed: Prisma.FaqCreateManyInput[] = [
  { question: "مشاوره اولیه هزینه دارد؟", answer: "خیر. تماس یا فرم را پر کنید. اگر پروژه در محدوده کار ما باشد، همان روز کاری برمی‌گردیم و محدوده و قیمت تقریبی را می‌گوییم.", sortOrder: 10, visible: true },
  { question: "قیمت دقیق کی مشخص می‌شود؟", answer: "بعد از جلسه نیازسنجی. عددهای سایت شروع قیمت هستند تا مقایسه راحت باشد، نه فاکتور نهایی.", sortOrder: 20, visible: true },
  { question: "فروشگاه اینترنتی هم می‌سازید؟", answer: "بله. محصول، دسته‌بندی، سبد و اتصال به درگاه در محدوده فروشگاه است. اگر انبار یا حسابداری خاص دارید، در جلسه جدا می‌شود.", sortOrder: 30, visible: true },
  { question: "سایت با صفحه‌ساز تحویل می‌دهید؟", answer: "خیر. سایت اختصاصی است و متن، نمونه کار و تعرفه را خودتان از پنل مدیریت عوض می‌کنید.", sortOrder: 40, visible: true },
  { question: "بعد از تحویل پشتیبانی هست؟", answer: "بله. مدت آن در قرارداد نوشته می‌شود. رفع اشکال فنی در این مدت با ماست.", sortOrder: 50, visible: true },
  { question: "سئو جدا از طراحی است؟", answer: "ساختار اولیه سئو داخل طراحی است. کمپین رشد ماهانه، پکیج جدا دارد.", sortOrder: 60, visible: true },
];

export const blogSeed: Prisma.BlogPostCreateManyInput[] = [
  {
    slug: "ghimat-tarahi-site",
    title: "قیمت طراحی سایت در سال ۱۴۰۴ چطور حساب می‌شود؟",
    excerpt: "عدد نهایی به تعداد صفحه، فروشگاه بودن و تولید محتوا بستگی دارد. این راهنما کمک می‌کند قبل از تماس، حدود بودجه را بدانید.",
    body: "بیشتر اختلاف قیمت‌ها از محدوده کار می‌آید، نه از «کیفیت مبهم». یک سایت معرفی پنج‌صفحه‌ای با یک فروشگاه دویست محصولی یکی نیست.\n\nدر دکتر سایت شروع قیمت را روی سایت می‌نویسیم تا تماس اول با عدد خیالی شروع نشود. قیمت نهایی بعد از دیدن نمونه محتوا و لیست قابلیت‌ها بسته می‌شود.\n\nاگر بودجه محدود است، بهتر است اول مسیر تماس و معرفی خدمات را درست کنیم و فروشگاه را به مرحله بعد بسپاریم.",
    seoTitle: "قیمت طراحی سایت | دکتر سایت",
    seoDescription: "شروع قیمت طراحی سایت شرکتی، فروشگاه و سئو و اینکه قیمت نهایی کی قطعی می‌شود.",
    published: true,
    publishedAt: new Date("2026-03-01"),
  },
  {
    slug: "foroushgah-ya-site-moarefi",
    title: "فروشگاه اینترنتی لازم دارید یا سایت معرفی؟",
    excerpt: "اگر هنوز سفارش تلفنی می‌گیرید، گاهی سایت معرفی زودتر فروش را بالا می‌برد تا یک فروشگاه نیمه‌کاره.",
    body: "فروشگاه وقتی معنا دارد که محصول، موجودی و ارسال روشن باشد. اگر مشتری اول باید مشاوره بگیرد، فرم و دکمه تماس مهم‌تر از سبد خرید است.\n\nدر جلسه اول همین را جدا می‌کنیم. هدف، فروختن گران‌ترین پکیج نیست؛ هدف این است که مشتری بعدی بتواند با شما تماس بگیرد یا بخرد.",
    seoTitle: "فروشگاه یا سایت معرفی؟",
    seoDescription: "کی فروشگاه اینترنتی بسازیم و کی یک سایت معرفی کافی است.",
    published: true,
    publishedAt: new Date("2026-04-12"),
  },
  {
    slug: "seo-bad-az-tarahi",
    title: "سئو را از روز اول سایت شروع کنید، نه شش ماه بعد",
    excerpt: "ساختار عنوان، سرعت و مسیر صفحه از همان طراحی روی دیده شدن در گوگل اثر دارد.",
    body: "سایتی که عنوان صفحه، توضیح و آدرس تمیز نداشته باشد، بعداً گران‌تر اصلاح می‌شود. در پروژه‌های دکتر سایت این‌ها جزو تحویل است.\n\nکمپین ماهانه سئو برای کسب‌وکارهایی است که می‌خواهند روی کلمه‌های مشخص دیده شوند. بدون سایت سالم، آن بودجه هدر می‌رود.",
    seoTitle: "سئو بعد از طراحی سایت",
    seoDescription: "چرا سئو پایه باید داخل طراحی باشد و سئو ماهانه کی لازم می‌شود.",
    published: true,
    publishedAt: new Date("2026-06-02"),
  },
];

export const salesSections: Prisma.SectionCreateManyInput[] = [
  {
    key: "pricing",
    page: "home",
    label: "تعرفه",
    sortOrder: 45,
    visible: true,
    content: {
      kicker: "تعرفه",
      title: "شروع قیمت، شفاف",
      body: "عددها شروع کار هستند. بعد از دیدن محدوده، پیشنهاد مکتوب می‌دهیم.",
    },
  },
  {
    key: "process",
    page: "home",
    label: "روند کار",
    sortOrder: 55,
    visible: true,
    content: { kicker: "روند همکاری", title: "از تماس تا تحویل، چهار قدم" },
  },
  {
    key: "why",
    page: "home",
    label: "چرا ما",
    sortOrder: 65,
    visible: true,
    content: {
      kicker: "چرا دکتر سایت",
      title: "قول‌هایی که در قرارداد می‌ماند",
      points: ["قیمت شروع روی سایت نوشته شده", "مشاوره اول بدون هزینه", "پشتیبانی بعد از انتشار", "سایت مال شماست، نه قفل صفحه‌ساز"],
    },
  },
  {
    key: "logos",
    page: "home",
    label: "لوگوی مشتری‌ها",
    sortOrder: 75,
    visible: true,
    content: {
      kicker: "همکاری‌ها",
      title: "کنار کسب‌وکارهایی که سایت را جدی گرفتند",
      note: "نام‌ها نمونه نمایشی‌اند و از پنل با مشتری واقعی عوض می‌شوند.",
    },
  },
  {
    key: "faq",
    page: "home",
    label: "پرسش‌ها",
    sortOrder: 85,
    visible: true,
    content: { kicker: "پرسش‌های رایج", title: "قبل از تماس، این‌ها را بدانید" },
  },
  {
    key: "blogTeaser",
    page: "home",
    label: "وبلاگ",
    sortOrder: 88,
    visible: true,
    content: { kicker: "یادداشت‌ها", title: "برای تصمیم دقیق‌تر", linkLabel: "همه یادداشت‌ها" },
  },
];

export const extraSeo: Prisma.PageSeoCreateManyInput[] = [
  {
    id: "blog",
    path: "/blog",
    title: "وبلاگ",
    description: "یادداشت‌های دکتر سایت درباره قیمت طراحی سایت، فروشگاه اینترنتی و سئو.",
    keywords: "قیمت طراحی سایت,سئو,فروشگاه اینترنتی",
    ogImage: "",
  },
  {
    id: "faq",
    path: "/faq",
    title: "پرسش‌های رایج",
    description: "پاسخ پرسش‌های رایج درباره مشاوره، قیمت، فروشگاه و پشتیبانی دکتر سایت.",
    keywords: "سوالات طراحی سایت,مشاوره رایگان",
    ogImage: "",
  },
];

export const servicePrices: Record<string, { priceLabel: string; includes: string[] }> = {
  "01": {
    priceLabel: "شروع از ۱۸ میلیون تومان",
    includes: ["هویت بصری در صفحات اصلی", "ساختار موبایل‌اول", "فرم تماس", "تحویل قابل ویرایش"],
  },
  "02": {
    priceLabel: "شروع از ۲۸ میلیون تومان",
    includes: ["سناریوی صفحه", "نسخه موبایل", "حرکت سبک، بدون سنگینی", "سنجش سرعت"],
  },
  "03": {
    priceLabel: "شروع از ۴۰ میلیون تومان",
    includes: ["جریان کاربر", "حالت‌های خطا و خالی", "پیاده‌سازی رابط", "تحویل مستند کوتاه"],
  },
  "04": {
    priceLabel: "شروع از ۱۸ میلیون تومان",
    includes: ["طراحی و توسعه اختصاصی", "سئو پایه", "فرم درخواست", "آموزش پنل"],
  },
  "05": {
    priceLabel: "شروع از ۱۲ میلیون تومان در ماه",
    includes: ["کلمه کلیدی", "بهینه‌سازی صفحات پول‌ساز", "گزارش ماهانه"],
  },
};
