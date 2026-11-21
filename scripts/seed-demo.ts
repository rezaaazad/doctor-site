// Optional demo catalog for local development, staging and screenshots.
// Run with `npm run seed:demo`. It only inserts rows whose slug/code does not exist yet and never
// updates or deletes existing data, so it is safe to run against a database that already has content.
import { PrismaClient, type Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const T = (toman: number) => BigInt(toman * 10);
const days = (n: number) => new Date(Date.now() + n * 86_400_000);

const categories = [
  { slug: "site-templates", name: "قالب‌های آماده سایت", icon: "◧", featured: true, sortOrder: 1, description: "قالب‌های فروشگاهی و شرکتی راست‌چین، سریع و آماده اتصال به درگاه.", torobName: "قالب سایت" },
  { slug: "plugins", name: "افزونه‌ها", icon: "⌘", featured: true, sortOrder: 2, description: "افزونه‌های کاربردی برای فروش بیشتر و مدیریت ساده‌تر.", torobName: "افزونه وردپرس" },
  { slug: "courses", name: "دوره‌های آموزشی", icon: "▶", featured: true, sortOrder: 3, description: "آموزش پروژه‌محور طراحی، سئو و فروش آنلاین.", torobName: "دوره آموزشی" },
  { slug: "ready-packages", name: "پکیج‌های راه‌اندازی", icon: "✦", featured: true, sortOrder: 4, description: "سایت آماده با نصب، محتوا و تحویل کلید در دست.", torobName: "طراحی سایت" },
  { slug: "print-branding", name: "چاپ و هویت بصری", icon: "◎", featured: true, sortOrder: 5, description: "کارت ویزیت هوشمند، ست اداری و اقلام چاپی برند.", torobName: "کارت ویزیت" },
  { slug: "seo-tools", name: "ابزار سئو و تبلیغات", icon: "↗", featured: true, sortOrder: 6, description: "چک‌لیست‌ها و ابزارهایی که رتبه و فروش را بالا می‌برند.", torobName: "ابزار سئو" },
];

type Demo = Omit<Prisma.StoreProductUncheckedCreateInput, "categoryId"> & { category: string; variantsData?: Omit<Prisma.ProductVariantUncheckedCreateInput, "productId">[] };

const products: Demo[] = [
  {
    slug: "shop-theme-ronak",
    title: "قالب فروشگاهی رونق",
    subtitle: "قالب راست‌چین فروشگاه اینترنتی با سرعت بالا",
    summary: "قالب فروشگاهی کامل با صفحه محصول فروش‌محور، سبد کشویی و سازگاری با درگاه‌های ایرانی.",
    description: "رونق برای فروشگاه‌هایی ساخته شده که می‌خواهند از روز اول بفروشند.\n\n## چه چیزی می‌گیرید\n- ۱۲ طرح آماده صفحه اصلی\n- صفحه محصول با جدول مشخصات، نظرات و پیشنهاد مرتبط\n- سازگار با زرین‌پال، اسنپ‌پی و ترب‌پی\n\n## پشتیبانی\nشش ماه پشتیبانی تیکتی و به‌روزرسانی رایگان.",
    priceRial: T(2_900_000),
    compareAtRial: T(3_900_000),
    saleEndsAt: days(2),
    category: "site-templates",
    type: "digital",
    featured: true,
    badge: "پرفروش",
    salesCount: 412,
    downloadUrl: "https://example.com/files/ronak.zip",
    licenseNote: "لایسنس یک دامنه با شش ماه پشتیبانی",
    specs: [
      { name: "نسخه", value: "۳٫۲" },
      { name: "سازگاری", value: "وردپرس ۶ و ووکامرس ۹" },
      { name: "راست‌چین", value: "کامل" },
      { name: "به‌روزرسانی", value: "رایگان مادام‌العمر" },
    ],
    sortOrder: 1,
  },
  {
    slug: "corporate-theme-arman",
    title: "قالب شرکتی آرمان",
    subtitle: "سایت شرکتی خوش‌ساخت برای جذب مشتری",
    summary: "قالب شرکتی با فرم دریافت سرنخ، نمونه‌کار و صفحه خدمات؛ مناسب شرکت‌های خدماتی.",
    description: "آرمان روی یک هدف تمرکز دارد: تبدیل بازدیدکننده به تماس.\n\n- فرم درخواست مشاوره با اعلان تلگرام\n- صفحات خدمات و نمونه‌کار\n- امتیاز بالای سرعت موبایل",
    priceRial: T(1_850_000),
    category: "site-templates",
    type: "digital",
    salesCount: 188,
    downloadUrl: "https://example.com/files/arman.zip",
    sortOrder: 2,
  },
  {
    slug: "plugin-smart-invoice",
    title: "افزونه فاکتور رسمی هوشمند",
    subtitle: "فاکتور رسمی با مهر و امضا، یک کلیک",
    summary: "صدور خودکار فاکتور رسمی فارسی با شماره اقتصادی و ارسال PDF برای مشتری.",
    description: "فاکتورهای ووکامرس را حرفه‌ای کنید.\n\n- قالب رسمی فارسی\n- ارسال خودکار پس از پرداخت\n- پشتیبانی از مالیات بر ارزش افزوده",
    priceRial: T(690_000),
    compareAtRial: T(890_000),
    category: "plugins",
    type: "digital",
    featured: true,
    salesCount: 935,
    badge: "محبوب",
    downloadUrl: "https://example.com/files/invoice.zip",
    variantsData: [
      { title: "لایسنس تک‌سایت", values: { "لایسنس": "تک‌سایت" }, priceRial: T(690_000), compareAtRial: T(890_000), stock: 0, sortOrder: 0 },
      { title: "لایسنس ۵ سایت", values: { "لایسنس": "۵ سایت" }, priceRial: T(1_490_000), compareAtRial: T(1_990_000), stock: 0, sortOrder: 1 },
      { title: "لایسنس نامحدود", values: { "لایسنس": "نامحدود" }, priceRial: T(2_900_000), stock: 0, sortOrder: 2 },
    ],
    options: [{ name: "لایسنس", values: ["تک‌سایت", "۵ سایت", "نامحدود"] }],
    sortOrder: 3,
  },
  {
    slug: "plugin-sms-otp",
    title: "افزونه ورود پیامکی",
    subtitle: "ورود و ثبت‌نام با کد یک‌بارمصرف",
    summary: "ورود بدون رمز با کاوه‌نگار و ملی‌پیامک؛ نرخ تکمیل خرید را بالا می‌برد.",
    priceRial: T(450_000),
    category: "plugins",
    type: "digital",
    salesCount: 620,
    downloadUrl: "https://example.com/files/otp.zip",
    sortOrder: 4,
  },
  {
    slug: "plugin-abandoned-cart",
    title: "افزونه بازگرداندن سبد رهاشده",
    subtitle: "پیامک یادآوری خودکار به خریدارهای نیمه‌کاره",
    summary: "سبدهای رهاشده را شناسایی می‌کند و با پیامک و کد تخفیف، خریدار را برمی‌گرداند.",
    priceRial: T(790_000),
    category: "plugins",
    type: "digital",
    featured: true,
    salesCount: 274,
    downloadUrl: "https://example.com/files/cart.zip",
    sortOrder: 5,
  },
  {
    slug: "course-online-shop",
    title: "دوره راه‌اندازی فروشگاه اینترنتی",
    subtitle: "از صفر تا اولین فروش در ۲۱ روز",
    summary: "۴۲ جلسه ویدیویی پروژه‌محور: انتخاب محصول، ساخت فروشگاه، درگاه، ترب و تبلیغات.",
    description: "این دوره همان مسیری است که برای مشتری‌های خودمان می‌رویم.\n\n## سرفصل‌ها\n- انتخاب محصول و قیمت‌گذاری\n- ساخت فروشگاه و اتصال درگاه\n- ثبت در ترب و اسنپ‌شاپ\n- اولین کمپین تبلیغاتی",
    priceRial: T(1_490_000),
    compareAtRial: T(2_490_000),
    category: "courses",
    type: "digital",
    featured: true,
    badge: "جدید",
    salesCount: 1290,
    downloadUrl: "https://example.com/files/course.zip",
    specs: [
      { name: "مدت", value: "۱۸ ساعت" },
      { name: "تعداد جلسه", value: "۴۲" },
      { name: "پشتیبانی", value: "گروه پرسش و پاسخ" },
    ],
    sortOrder: 6,
  },
  {
    slug: "course-seo-practical",
    title: "دوره سئوی عملی فروشگاه",
    subtitle: "رتبه گرفتن در گوگل برای کلمات خرید",
    summary: "سئوی فنی و محتوایی مخصوص صفحات محصول و دسته‌بندی؛ با چک‌لیست قابل اجرا.",
    priceRial: T(990_000),
    category: "courses",
    type: "digital",
    salesCount: 540,
    downloadUrl: "https://example.com/files/seo.zip",
    sortOrder: 7,
  },
  {
    slug: "package-shop-launch",
    title: "پکیج فروشگاه آماده کلید در دست",
    subtitle: "طراحی، نصب، ۳۰ محصول و درگاه",
    summary: "فروشگاه کامل با قالب رونق، ورود ۳۰ محصول، اتصال درگاه و آموزش مدیریت؛ تحویل ۱۰ روزه.",
    description: "اگر وقت ساختن ندارید، ما می‌سازیم.\n\n- نصب و پیکربندی کامل\n- ورود ۳۰ محصول اول\n- اتصال زرین‌پال و اسنپ‌پی\n- جلسه آموزش مدیریت",
    priceRial: T(18_500_000),
    compareAtRial: T(22_000_000),
    category: "ready-packages",
    type: "digital",
    featured: true,
    badge: "اقساطی",
    salesCount: 86,
    licenseNote: "پس از پرداخت، کارشناس ظرف ۲ ساعت کاری تماس می‌گیرد.",
    variantsData: [
      { title: "پایه — ۳۰ محصول", values: { "پلن": "پایه" }, priceRial: T(18_500_000), compareAtRial: T(22_000_000), stock: 0, sortOrder: 0 },
      { title: "حرفه‌ای — ۱۰۰ محصول + سئو", values: { "پلن": "حرفه‌ای" }, priceRial: T(29_000_000), compareAtRial: T(34_000_000), stock: 0, sortOrder: 1 },
    ],
    options: [{ name: "پلن", values: ["پایه", "حرفه‌ای"] }],
    sortOrder: 8,
  },
  {
    slug: "nfc-business-card",
    title: "کارت ویزیت هوشمند NFC",
    subtitle: "یک لمس، همه راه‌های ارتباط با شما",
    summary: "کارت فلزی با تراشه NFC و QR؛ با یک لمس، صفحه تماس و شبکه‌های اجتماعی شما باز می‌شود.",
    description: "کارت ویزیتی که دور انداخته نمی‌شود.\n\n- چاپ لیزری نام و لوگو\n- صفحه پروفایل قابل ویرایش\n- ارسال به سراسر کشور",
    priceRial: T(690_000),
    compareAtRial: T(850_000),
    category: "print-branding",
    type: "physical",
    featured: true,
    manageStock: true,
    stock: 0,
    weightGrams: 60,
    salesCount: 1530,
    badge: "پرفروش",
    brand: "دکتر سایت",
    guarantee: "ضمانت تعویض ۱۲ ماهه تراشه",
    variantsData: [
      { title: "مشکی مات", values: { "رنگ": "مشکی مات" }, priceRial: T(690_000), compareAtRial: T(850_000), stock: 42, sortOrder: 0 },
      { title: "طلایی", values: { "رنگ": "طلایی" }, priceRial: T(790_000), compareAtRial: T(950_000), stock: 7, sortOrder: 1 },
      { title: "نقره‌ای", values: { "رنگ": "نقره‌ای" }, priceRial: T(740_000), stock: 2, sortOrder: 2 },
    ],
    options: [{ name: "رنگ", values: ["مشکی مات", "طلایی", "نقره‌ای"] }],
    specs: [
      { name: "جنس", value: "استیل ضدزنگ" },
      { name: "ابعاد", value: "۸۵ × ۵۴ میلی‌متر" },
      { name: "تراشه", value: "NTAG216" },
    ],
    sortOrder: 9,
  },
  {
    slug: "office-stationery-set",
    title: "ست اوراق اداری برند",
    subtitle: "سربرگ، پاکت و کارت با طراحی یکپارچه",
    summary: "طراحی و چاپ ست کامل اداری روی کاغذ تحریر ۱۰۰ گرم؛ ارسال با پست پیشتاز.",
    priceRial: T(3_400_000),
    category: "print-branding",
    type: "physical",
    manageStock: true,
    stock: 25,
    weightGrams: 1800,
    salesCount: 64,
    sortOrder: 10,
  },
  {
    slug: "brand-sticker-pack",
    title: "پک استیکر لوگو",
    subtitle: "۱۰۰ عدد استیکر برش‌خورده ضدآب",
    summary: "استیکر وینیل ضدآب برای بسته‌بندی؛ تجربه باز کردن بسته را به خاطره تبدیل کنید.",
    priceRial: T(380_000),
    category: "print-branding",
    type: "physical",
    manageStock: true,
    stock: 3,
    weightGrams: 150,
    salesCount: 210,
    sortOrder: 11,
  },
  {
    slug: "seo-checklist-pro",
    title: "چک‌لیست سئوی فروشگاه ۱۴۰۵",
    subtitle: "۱۲۰ مورد قابل اجرا، به ترتیب اثر",
    summary: "فایل اکسل و PDF با اولویت‌بندی؛ همان چک‌لیستی که در پروژه‌های خودمان استفاده می‌کنیم.",
    priceRial: T(290_000),
    category: "seo-tools",
    type: "digital",
    salesCount: 870,
    downloadUrl: "https://example.com/files/checklist.zip",
    sortOrder: 12,
  },
  {
    slug: "torob-feed-setup",
    title: "سرویس اتصال به ترب و اسنپ‌شاپ",
    subtitle: "نمایش محصولات شما در موتورهای خرید",
    summary: "راه‌اندازی API ترب، فید اسنپ‌شاپ و تأیید مالکیت؛ تا اولین نمایش محصول همراهتان هستیم.",
    priceRial: T(2_200_000),
    category: "seo-tools",
    type: "digital",
    featured: true,
    salesCount: 133,
    sortOrder: 13,
  },
];

const reviews = [
  { product: "shop-theme-ronak", name: "مهسا کریمی", rating: 5, body: "نصبش کمتر از یک ساعت طول کشید و همان هفته اول فروش‌مان بیشتر شد. صفحه محصولش واقعاً فروش‌محور است." },
  { product: "nfc-business-card", name: "سعید رحمانی", rating: 5, body: "کیفیت ساخت کارت عالی است. در جلسه‌ها همه می‌پرسند از کجا گرفته‌ام." },
  { product: "course-online-shop", name: "نگار احمدی", rating: 5, body: "برخلاف دوره‌های دیگر، هر جلسه یک کار مشخص داشت. الان فروشگاهم در ترب هم دیده می‌شود." },
  { product: "plugin-smart-invoice", name: "رضا موسوی", rating: 4, body: "فاکتورها خیلی رسمی و تمیز درمی‌آیند. پشتیبانی هم سریع جواب داد." },
  { product: "package-shop-launch", name: "علی نوروزی", rating: 5, body: "کلید در دست تحویل گرفتیم، با آموزش کامل. اقساطی هم پرداخت کردیم و خیال‌مان راحت بود." },
  { product: "nfc-business-card", name: "فاطمه صادقی", rating: 4, body: "ارسال دو روزه به شیراز رسید. رنگ طلایی از عکس هم قشنگ‌تر است." },
];

async function main() {
  const catIds = new Map<string, string>();
  for (const c of categories) {
    const row = await prisma.storeCategory.findUnique({ where: { slug: c.slug } });
    catIds.set(c.slug, row ? row.id : (await prisma.storeCategory.create({ data: c })).id);
  }
  let created = 0;
  for (const { category, variantsData, ...p } of products) {
    if (await prisma.storeProduct.findUnique({ where: { slug: p.slug } })) continue;
    await prisma.storeProduct.create({
      data: {
        ...p,
        published: true,
        categoryId: catIds.get(category)!,
        variants: variantsData ? { create: variantsData } : undefined,
      },
    });
    created++;
  }
  for (const r of reviews) {
    const product = await prisma.storeProduct.findUnique({ where: { slug: r.product } });
    if (!product) continue;
    const exists = await prisma.comment.findFirst({ where: { targetType: "product", targetId: product.id, name: r.name } });
    if (exists) continue;
    await prisma.comment.create({ data: { targetType: "product", targetId: product.id, name: r.name, body: r.body, rating: r.rating, status: "approved", verified: true } });
    const agg = await prisma.comment.aggregate({ where: { targetType: "product", targetId: product.id, status: "approved", rating: { not: null } }, _avg: { rating: true }, _count: { _all: true } });
    await prisma.storeProduct.update({ where: { id: product.id }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count._all } });
  }
  if (!(await prisma.coupon.findUnique({ where: { code: "WELCOME10" } }))) {
    await prisma.coupon.create({ data: { code: "WELCOME10", description: "۱۰٪ تخفیف اولین خرید", type: "percent", amount: BigInt(10), maxDiscount: T(500_000), perCustomer: 1 } });
  }
  console.log(`Demo catalog ready (${created} new products).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
