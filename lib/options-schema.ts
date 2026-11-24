// Declarative settings registry. Each group is stored as one row in the Option table.
// Field definitions drive defaults, validation, secret masking and the admin forms.

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "toman"
  | "boolean"
  | "select"
  | "color"
  | "secret"
  | "url"
  | "code";

export type OptionField = {
  key: string;
  label: string;
  type: FieldType;
  default: string | number | boolean;
  hint?: string;
  choices?: { value: string; label: string }[];
  section?: string;
  dir?: "ltr" | "rtl";
  max?: number;
};

export type OptionGroup = {
  id: string;
  label: string;
  description: string;
  cap: string;
  fields: OptionField[];
};

const t = (key: string, label: string, def = "", extra: Partial<OptionField> = {}): OptionField => ({ key, label, type: "text", default: def, ...extra });
const ta = (key: string, label: string, def = "", extra: Partial<OptionField> = {}): OptionField => ({ key, label, type: "textarea", default: def, ...extra });
const b = (key: string, label: string, def = false, extra: Partial<OptionField> = {}): OptionField => ({ key, label, type: "boolean", default: def, ...extra });
const n = (key: string, label: string, def = 0, extra: Partial<OptionField> = {}): OptionField => ({ key, label, type: "number", default: def, ...extra });
const s = (key: string, label: string, extra: Partial<OptionField> = {}): OptionField => ({ key, label, type: "secret", default: "", dir: "ltr", ...extra });
const c = (key: string, label: string, def: string, extra: Partial<OptionField> = {}): OptionField => ({ key, label, type: "color", default: def, dir: "ltr", ...extra });
const sel = (key: string, label: string, def: string, choices: [string, string][], extra: Partial<OptionField> = {}): OptionField => ({
  key,
  label,
  type: "select",
  default: def,
  choices: choices.map(([value, l]) => ({ value, label: l })),
  ...extra,
});

export const FONT_CHOICES: [string, string][] = [
  ["Vazirmatn", "وزیرمتن"],
  ["Estedad", "استعداد"],
];

export const OPTION_GROUPS: OptionGroup[] = [
  {
    id: "theme",
    label: "پوسته و رنگ‌ها",
    description: "رنگ‌ها، فونت‌ها و گردی گوشه‌ها. ترکیب پیش‌فرض بر پایه روان‌شناسی فروش است؛ docs/DESIGN-fa.md را ببینید.",
    cap: "manage_settings",
    fields: [
      c("ink", "پایه تیره (اعتماد)", "#102E33", { section: "رنگ‌ها", hint: "هدر تیره، فوتر و بخش‌های عمیق. سرمه‌ای تیره حس ثبات و اعتماد می‌دهد." }),
      c("primary", "رنگ برند (لینک و تأکید)", "#075D60", { section: "رنگ‌ها" }),
      c("action", "رنگ اقدام (دکمه خرید)", "#BE3823", { section: "رنگ‌ها", hint: "فقط برای دکمه‌های اصلی. هر جای دیگر استفاده شود اثرش کم می‌شود." }),
      c("success", "موفقیت و موجودی", "#047857", { section: "رنگ‌ها" }),
      c("urgency", "فوریت و تخفیف", "#923557", { section: "رنگ‌ها" }),
      c("gold", "امتیاز و پرفروش", "#ECB878", { section: "رنگ‌ها" }),
      c("bg", "پس‌زمینه", "#F7F7F2", { section: "رنگ‌ها" }),
      c("surface", "کارت‌ها", "#FFFFFF", { section: "رنگ‌ها" }),
      c("text", "متن", "#102E33", { section: "رنگ‌ها" }),
      c("muted", "متن کم‌رنگ", "#506568", { section: "رنگ‌ها" }),
      c("border", "خط جداکننده", "#D9E2DD", { section: "رنگ‌ها" }),
      sel("fontBody", "فونت متن", "Vazirmatn", FONT_CHOICES, { section: "تایپوگرافی" }),
      sel("fontDisplay", "فونت تیترها", "Vazirmatn", FONT_CHOICES, { section: "تایپوگرافی" }),
      n("radius", "گردی گوشه‌ها (px)", 16, { section: "شکل", max: 40 }),
      b("motion", "انیمیشن‌های ورود و حرکت", true, { section: "شکل" }),
      b("darkHero", "هیروی تیره در صفحه اصلی", true, { section: "شکل" }),
    ],
  },
  {
    id: "header",
    label: "هدر، نوار اعلان و دکمه‌های تماس",
    description: "نوار اعلان بالای سایت، نوار چسبان موبایل و دکمه شناور تماس.",
    cap: "manage_settings",
    fields: [
      t("samandehiUrl", "پیوند نشان ساماندهی", "", { section: "فوتر", dir: "ltr" }),
      b("announceOn", "نمایش نوار اعلان", true, { section: "نوار اعلان" }),
      t("announceText", "متن اعلان", "ارسال رایگان سفارش‌های بالای ۲ میلیون تومان · پرداخت اقساطی با اسنپ‌پی و ترب‌پی", { section: "نوار اعلان" }),
      t("announceHref", "پیوند اعلان", "/store", { section: "نوار اعلان", dir: "ltr" }),
      t("announceEndsAt", "پایان پیشنهاد (اختیاری، ISO)", "", { section: "نوار اعلان", dir: "ltr", hint: "اگر پر شود شمارش معکوس واقعی نمایش داده می‌شود. مثل 2026-12-01T00:00:00+03:30" }),
      b("stickyBar", "نوار چسبان پایین موبایل", true, { section: "تماس" }),
      b("floatingContact", "دکمه شناور تماس", true, { section: "تماس" }),
      t("ctaLabel", "متن دکمه اصلی هدر", "مشاوره رایگان", { section: "تماس" }),
      t("ctaHref", "پیوند دکمه اصلی هدر", "/contact", { section: "تماس", dir: "ltr" }),
      b("showPhoneInHeader", "نمایش شماره در هدر", true, { section: "تماس" }),
    ],
  },
  {
    id: "store",
    label: "فروشگاه",
    description: "رفتار سبد، تسویه، موجودی، نظرات و کیف پول.",
    cap: "manage_store",
    fields: [
      b("enabled", "فروشگاه فعال است", true, { section: "عمومی" }),
      b("guestCheckout", "خرید بدون ورود (مهمان)", true, { section: "تسویه" }),
      b("requireLoginForDigital", "برای محصول دیجیتال ورود لازم است", false, { section: "تسویه" }),
      n("minOrderToman", "حداقل مبلغ سفارش (تومان)", 0, { section: "تسویه" }),
      t("termsUrl", "پیوند قوانین خرید", "/terms", { section: "تسویه", dir: "ltr" }),
      n("pendingHoldMinutes", "لغو خودکار سفارش پرداخت‌نشده (دقیقه)", 60, { section: "تسویه" }),
      b("pricesIncludeTax", "قیمت‌ها شامل مالیات است", true, { section: "مالیات" }),
      b("showStockCount", "نمایش تعداد موجودی کم", true, { section: "موجودی" }),
      n("lowStockThreshold", "آستانه هشدار موجودی", 3, { section: "موجودی" }),
      b("reviewsEnabled", "نظرات محصول فعال", true, { section: "نظرات" }),
      b("reviewsModerated", "نظر قبل از نمایش تأیید شود", true, { section: "نظرات" }),
      b("walletEnabled", "کیف پول مشتری", true, { section: "کیف پول" }),
      n("freeShippingAboveToman", "ارسال رایگان بالای (تومان، نمایشی)", 2000000, { section: "نمایش" }),
      t("guaranteeText", "تضمین بازگشت وجه (نمایش در محصول)", "۷ روز ضمانت بازگشت وجه", { section: "نمایش" }),
      t("supportText", "متن پشتیبانی (نمایش در محصول)", "پشتیبانی واقعی، پاسخ در همان روز کاری", { section: "نمایش" }),
    ],
  },
  {
    id: "invoice",
    label: "فاکتور",
    description: "اطلاعات فروشنده که روی فاکتور رسمی چاپ می‌شود.",
    cap: "manage_store",
    fields: [
      t("sellerName", "نام فروشنده", "دکتر سایت"),
      t("economicCode", "کد اقتصادی", "", { dir: "ltr" }),
      t("nationalId", "شناسه ملی", "", { dir: "ltr" }),
      t("registrationNo", "شماره ثبت", "", { dir: "ltr" }),
      ta("address", "نشانی"),
      t("postalCode", "کد پستی", "", { dir: "ltr" }),
      t("phone", "تلفن", "", { dir: "ltr" }),
      ta("footer", "یادداشت پایین فاکتور", "از خرید شما سپاسگزاریم."),
    ],
  },
  {
    id: "pay_zarinpal",
    label: "زرین‌پال",
    description: "درگاه پرداخت مستقیم. در حالت سندباکس از sandbox.zarinpal.com استفاده می‌شود.",
    cap: "manage_payments",
    fields: [
      b("enabled", "فعال", false),
      b("sandbox", "حالت آزمایشی (سندباکس)", true),
      s("merchantId", "مرچنت کد (۳۶ نویسه)"),
      t("title", "عنوان در صفحه پرداخت", "پرداخت آنلاین (زرین‌پال)"),
      t("description", "توضیح", "همه کارت‌های عضو شتاب"),
      n("sortOrder", "ترتیب نمایش", 10),
    ],
  },
  {
    id: "pay_snapppay",
    label: "اسنپ‌پی (اقساطی)",
    description: "پرداخت اقساطی اسنپ‌پی. IP سرور باید نزد اسنپ‌پی وایت‌لیست شود. آدرس بازگشت: /api/pay/snapppay/callback",
    cap: "manage_payments",
    fields: [
      b("enabled", "فعال", false),
      sel("mode", "محیط", "stage", [["live", "پروداکشن"], ["stage", "استیج (تست)"], ["mock", "شبیه‌ساز داخلی (بدون اتصال)"]]),
      t("baseUrl", "آدرس پایه پروداکشن", "https://api.snapppay.ir/", { dir: "ltr" }),
      t("stageBaseUrl", "آدرس پایه استیج", "", { dir: "ltr", hint: "از تیم اسنپ‌پی دریافت می‌شود." }),
      t("clientId", "Client ID", "", { dir: "ltr" }),
      s("clientSecret", "Client Secret"),
      t("username", "نام کاربری", "", { dir: "ltr" }),
      s("password", "رمز عبور"),
      t("commissionType", "commissionType (اختیاری)", "", { dir: "ltr", hint: "اگر در قرارداد کمیسیون دسته‌بندی دارید، مثلاً 100" }),
      n("sortOrder", "ترتیب نمایش", 20),
    ],
  },
  {
    id: "pay_torobpay",
    label: "ترب‌پی (اقساطی)",
    description: "پرداخت اعتباری ترب‌پی (CPG). آدرس بازگشت: /api/pay/torobpay/callback",
    cap: "manage_payments",
    fields: [
      b("enabled", "فعال", false),
      sel("mode", "محیط", "stage", [["live", "پروداکشن"], ["stage", "استیج (تست)"], ["mock", "شبیه‌ساز داخلی (بدون اتصال)"]]),
      t("baseUrl", "آدرس پایه پروداکشن", "https://cpg.torobpay.com/", { dir: "ltr" }),
      t("stageBaseUrl", "آدرس پایه استیج", "", { dir: "ltr" }),
      t("clientId", "Client ID", "", { dir: "ltr" }),
      s("clientSecret", "Client Secret"),
      t("username", "نام کاربری", "", { dir: "ltr" }),
      s("password", "رمز عبور"),
      b("settle", "بعد از Verify، Settle هم فراخوانی شود", true, { hint: "طبق مستند CPG v1.4 لازم است. اگر قرارداد شما بدون settle است خاموش کنید." }),
      n("sortOrder", "ترتیب نمایش", 30),
    ],
  },
  {
    id: "pay_bank",
    label: "کارت‌به‌کارت / واریز",
    description: "سفارش در وضعیت «در انتظار بررسی» ثبت می‌شود و بعد از تأیید شما پرداخت‌شده می‌شود.",
    cap: "manage_payments",
    fields: [
      b("enabled", "فعال", false),
      t("title", "عنوان", "کارت‌به‌کارت"),
      ta("instructions", "راهنمای واریز", "مبلغ را به کارت ۶۰۳۷-۰۰۰۰-۰۰۰۰-۰۰۰۰ به نام دکتر سایت واریز کنید و شماره پیگیری را در پیام سفارش بنویسید."),
      n("sortOrder", "ترتیب نمایش", 40),
    ],
  },
  {
    id: "pay_cod",
    label: "پرداخت در محل",
    description: "فقط برای سفارش‌های فیزیکی.",
    cap: "manage_payments",
    fields: [
      b("enabled", "فعال", false),
      t("title", "عنوان", "پرداخت در محل"),
      n("feeToman", "هزینه اضافه (تومان)", 0),
      t("provinces", "استان‌های مجاز (با ویرگول؛ خالی یعنی همه)", "تهران"),
      n("sortOrder", "ترتیب نمایش", 50),
    ],
  },
  {
    id: "pay_mock",
    label: "درگاه آزمایشی",
    description: "فقط برای تست کل مسیر خرید بدون اتصال واقعی. روی سایت زنده خاموش بماند.",
    cap: "manage_payments",
    fields: [b("enabled", "فعال", false), t("title", "عنوان", "درگاه آزمایشی"), n("sortOrder", "ترتیب نمایش", 90)],
  },
  {
    id: "torob",
    label: "ترب",
    description: "API محصولات نسخه ۳ ترب در آدرس /torob_api/v3/products. توکن ترب با کلید عمومی رسمی (EdDSA) بررسی می‌شود.",
    cap: "manage_integrations",
    fields: [
      b("enabled", "ارسال محصولات به ترب فعال", false),
      b("requireToken", "بررسی توکن X-Torob-Token (توصیه‌شده)", true),
      t("audience", "aud مورد انتظار (خالی = دامنه SITE_URL)", "", { dir: "ltr" }),
      b("includeOutOfStock", "محصولات ناموجود هم ارسال شوند", true),
      b("webhookEnabled", "اطلاع تغییر قیمت/موجودی به ترب (وب‌هوک)", false),
      s("webhookToken", "توکن وب‌هوک ترب"),
      t("verification", "کد تأیید مالکیت ترب (متا)", "", { dir: "ltr", hint: "اگر ترب متای torob-site-verification داد، فقط مقدار content را اینجا بگذارید." }),
    ],
  },
  {
    id: "snappshop",
    label: "اسنپ‌شاپ",
    description: "کاتالوگ منتشرشده برای پنل فروشندگان اسنپ‌شاپ. آدرس اتصال: /api/snappshop/v1",
    cap: "manage_integrations",
    fields: [
      b("enabled", "اتصال فعال", false),
      b("requireToken", "توکن Bearer لازم است", true),
      s("token", "توکن دسترسی (حداقل ۳۲ نویسه)"),
      t("sellerUrl", "آدرس فروشگاه در اسنپ‌شاپ", "", { dir: "ltr", hint: "https://snappshop.ir/seller/STORE_CODE" }),
    ],
  },
  {
    id: "sms",
    label: "پیامک",
    description: "ارسال کد ورود (OTP) و اطلاع‌رسانی سفارش. در حالت «کنسول» پیامک فقط در لاگ سرور نوشته می‌شود.",
    cap: "manage_integrations",
    fields: [
      sel("provider", "سرویس‌دهنده", "console", [["none", "خاموش"], ["console", "کنسول (توسعه)"], ["kavenegar", "کاوه‌نگار"], ["melipayamak", "ملی‌پیامک"]]),
      s("kavenegarKey", "کلید API کاوه‌نگار", { section: "کاوه‌نگار" }),
      t("kavenegarSender", "خط ارسال کاوه‌نگار", "", { section: "کاوه‌نگار", dir: "ltr" }),
      t("kavenegarOtpTemplate", "نام الگوی OTP (verify/lookup)", "", { section: "کاوه‌نگار", dir: "ltr", hint: "اگر خالی باشد پیام متنی معمولی ارسال می‌شود." }),
      t("melipayamakUser", "نام کاربری ملی‌پیامک", "", { section: "ملی‌پیامک", dir: "ltr" }),
      s("melipayamakPass", "رمز / کلید API ملی‌پیامک", { section: "ملی‌پیامک" }),
      t("melipayamakFrom", "شماره ارسال", "", { section: "ملی‌پیامک", dir: "ltr" }),
      t("melipayamakOtpBodyId", "کد متن (bodyId) الگوی OTP", "", { section: "ملی‌پیامک", dir: "ltr" }),
      t("adminMobiles", "موبایل مدیران برای اطلاع‌رسانی (با ویرگول)", "", { section: "اطلاع‌رسانی", dir: "ltr" }),
    ],
  },
  {
    id: "email",
    label: "ایمیل (SMTP)",
    description: "ارسال ایمیل اطلاع‌رسانی لید و سفارش.",
    cap: "manage_integrations",
    fields: [
      b("enabled", "فعال", false),
      t("host", "SMTP host", "", { dir: "ltr" }),
      n("port", "پورت", 587),
      b("secure", "اتصال امن (SSL/465)", false),
      t("user", "نام کاربری", "", { dir: "ltr" }),
      s("pass", "رمز"),
      t("from", "فرستنده", "دکتر سایت <no-reply@doctor-site.ir>", { dir: "ltr" }),
      t("adminEmails", "ایمیل مدیران (با ویرگول)", "", { dir: "ltr" }),
    ],
  },
  {
    id: "telegram",
    label: "تلگرام",
    description: "ربات تلگرام برای اطلاع فوری لید و سفارش جدید. اگر api.telegram.org از سرور در دسترس نیست، یک پراکسی معکوس قابل‌اعتماد بدهید.",
    cap: "manage_integrations",
    fields: [
      b("enabled", "فعال", false),
      s("botToken", "توکن ربات"),
      t("chatId", "Chat ID (با ویرگول برای چند مقصد)", "", { dir: "ltr" }),
      t("apiBase", "آدرس API", "https://api.telegram.org", { dir: "ltr" }),
    ],
  },
  {
    id: "notify",
    label: "رویدادهای اطلاع‌رسانی",
    description: "هر رویداد از کدام کانال اطلاع داده شود.",
    cap: "manage_integrations",
    fields: [
      b("leadTelegram", "لید جدید → تلگرام", true, { section: "لید" }),
      b("leadEmail", "لید جدید → ایمیل", true, { section: "لید" }),
      b("leadSms", "لید جدید → پیامک مدیر", false, { section: "لید" }),
      b("orderTelegram", "سفارش پرداخت‌شده → تلگرام", true, { section: "سفارش" }),
      b("orderEmail", "سفارش پرداخت‌شده → ایمیل مدیر", true, { section: "سفارش" }),
      b("orderSmsAdmin", "سفارش پرداخت‌شده → پیامک مدیر", false, { section: "سفارش" }),
      b("orderSmsCustomer", "تأیید سفارش → پیامک مشتری", true, { section: "مشتری" }),
      b("statusSmsCustomer", "تغییر وضعیت/کد رهگیری → پیامک مشتری", true, { section: "مشتری" }),
      b("ticketTelegram", "تیکت جدید → تلگرام", true, { section: "پشتیبانی" }),
      b("ticketSmsCustomer", "پاسخ تیکت → پیامک مشتری", true, { section: "پشتیبانی" }),
    ],
  },
  {
    id: "templates",
    label: "قالب پیامک و ایمیل",
    description: "متغیرها: {name} {number} {total} {status} {tracking} {carrier} {code} {site} {link} {mobile} {subject}",
    cap: "manage_settings",
    fields: [
      ta("otp", "کد ورود", "{site}\nکد ورود شما: {code}\nاین کد را به کسی ندهید."),
      ta("orderPaid", "تأیید سفارش (مشتری)", "{name} عزیز، سفارش {number} به مبلغ {total} ثبت و پرداخت شد.\n{link}"),
      ta("orderStatus", "تغییر وضعیت (مشتری)", "سفارش {number}: {status}"),
      ta("orderShipped", "ارسال سفارش (مشتری)", "سفارش {number} ارسال شد. کد رهگیری {carrier}: {tracking}"),
      ta("adminOrder", "سفارش جدید (مدیر)", "🛒 سفارش جدید {number}\n{name} — {mobile}\nمبلغ: {total}\n{link}"),
      ta("adminLead", "لید جدید (مدیر)", "📩 درخواست مشاوره جدید\n{name} — {mobile}\n{subject}\n{link}"),
      ta("adminTicket", "تیکت جدید (مدیر)", "🎫 تیکت {number}: {subject}\n{name}\n{link}"),
      ta("ticketReply", "پاسخ تیکت (مشتری)", "پاسخ تیکت {number} در حساب کاربری شما ثبت شد. {link}"),
      t("emailOrderSubject", "موضوع ایمیل سفارش", "سفارش {number} — {site}"),
      t("emailLeadSubject", "موضوع ایمیل لید", "درخواست جدید از {name}"),
    ],
  },
  {
    id: "seo",
    label: "سئو و تأیید مالکیت",
    description: "تنظیمات کلی سئو. سئوی هر صفحه از بخش «سئو صفحات» تنظیم می‌شود.",
    cap: "manage_seo",
    fields: [
      t("titleSeparator", "جداکننده عنوان", "|"),
      t("defaultOgImage", "تصویر پیش‌فرض اشتراک‌گذاری", "", { dir: "ltr" }),
      t("googleVerification", "Google Search Console", "", { dir: "ltr" }),
      t("bingVerification", "Bing", "", { dir: "ltr" }),
      t("yandexVerification", "Yandex", "", { dir: "ltr" }),
      t("enamadVerification", "اینماد (متای enamad)", "", { dir: "ltr" }),
      ta("robotsDisallow", "مسیرهای اضافه disallow (هر خط یکی)", "/cart\n/checkout\n/account", { dir: "ltr" }),
      t("gaId", "Google Analytics (G-XXXX، اختیاری)", "", { dir: "ltr", hint: "آمارگیر داخلی همیشه فعال است." }),
    ],
  },
  {
    id: "reading",
    label: "خواندن و نمایش",
    description: "تعداد موارد در هر صفحه و رفتار کلی محتوا.",
    cap: "manage_settings",
    fields: [
      n("postsPerPage", "پست در هر صفحه وبلاگ", 9),
      n("productsPerPage", "محصول در هر صفحه فروشگاه", 24),
      b("commentsEnabled", "نظرات وبلاگ فعال", true),
      b("commentsModerated", "نظر وبلاگ قبل از نمایش تأیید شود", true),
    ],
  },
];

export const GROUP_BY_ID = Object.fromEntries(OPTION_GROUPS.map((group) => [group.id, group]));

export type OptionValue = string | number | boolean;
export type OptionRecord = Record<string, OptionValue>;

export function coerceField(field: OptionField, raw: unknown): OptionValue {
  switch (field.type) {
    case "boolean":
      return raw === true || raw === "1" || raw === "on" || raw === "true";
    case "number":
    case "toman": {
      const num = Number(raw);
      if (!Number.isFinite(num)) return field.default;
      const clamped = field.max !== undefined ? Math.min(num, field.max) : num;
      return Math.max(0, Math.round(clamped));
    }
    case "color": {
      const value = String(raw ?? "").trim();
      return /^#[0-9a-fA-F]{6}$/.test(value) ? value.toUpperCase() : field.default;
    }
    case "select": {
      const value = String(raw ?? "");
      return field.choices?.some((choice) => choice.value === value) ? value : field.default;
    }
    default: {
      if (typeof raw !== "string") return field.default;
      return raw.slice(0, field.type === "textarea" || field.type === "code" ? 8000 : 600);
    }
  }
}

export function withDefaults(groupId: string, stored: unknown): OptionRecord {
  const group = GROUP_BY_ID[groupId];
  if (!group) return {};
  const source = stored && typeof stored === "object" && !Array.isArray(stored) ? (stored as Record<string, unknown>) : {};
  const out: OptionRecord = {};
  for (const field of group.fields) {
    out[field.key] = field.key in source ? coerceField(field, source[field.key]) : field.default;
  }
  return out;
}

export function secretKeys(groupId: string) {
  return (GROUP_BY_ID[groupId]?.fields ?? []).filter((field) => field.type === "secret").map((field) => field.key);
}
