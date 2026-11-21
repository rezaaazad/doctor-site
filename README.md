# دکتر سایت

فروشگاه و سایت استودیوی «دکتر سایت» (doctor-site.ir): فروش محصولات دیجیتال و فیزیکی (قالب، افزونه، دوره، پکیج، کارت NFC، چاپ) در کنار خدمات طراحی سایت، برنامه‌نویسی و برندینگ. همه متن‌ها، رنگ‌ها، بخش‌ها، درگاه‌ها و اتصال‌ها از پنل مدیریت قابل تنظیم‌اند و برای تغییرشان نیازی به دیپلوی دوباره نیست.

Store-first Persian (RTL) site for doctor-site.ir. Next.js 15 (App Router) + React 19 + Prisma 6 + PostgreSQL 16, with a custom WordPress/WooCommerce-grade admin at `/admin` and a customer panel at `/account`. Fonts (Vazirmatn, Estedad) and images are self-hosted; nothing loads from a third-party CDN at runtime.

## راه‌اندازی محلی / Local development

Requirements: Node.js 22, PostgreSQL 16.

```bash
cp .env.example .env
# DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD (10+ chars), SESSION_SECRET (32+ chars), SITE_URL
npm install
npx prisma migrate deploy
npm run dev            # http://127.0.0.1:43123  — admin: /admin
npm run seed:demo      # optional: sample catalog (categories, 13 products, reviews, coupon WELCOME10)
```

The first boot creates the admin user from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and fills missing settings, menus, sections, shipping zones and the terms page. It never overwrites existing content.

## Scripts

- `npm run dev` — development server (port 43123)
- `npm run build` / `npm run start` — production build and server (port 3000)
- `npm run typecheck` — TypeScript
- `npm run lint` — ESLint
- `npm test` — Vitest (lead form, payment callback verification for every gateway, admin auth and roles, Torob JWT, pricing engine)
- `npm run seed:demo` — idempotent demo catalog (local/staging only)

## Production

See [DEPLOY.md](DEPLOY.md). On the live VPS use `sudo bash ops/release.sh <commit-sha>`: verified database backup, app-only container swap, health checks and automatic rollback. Caddy and Postgres are never recreated. Design system: [docs/DESIGN-fa.md](docs/DESIGN-fa.md).

---

## راهنمای تنظیم از پنل مدیریت

ورود: `/admin/login`. منوی کناری بر اساس نقش کاربر فیلتر می‌شود.

### ۱. اولین بار (به این ترتیب)

1. **تنظیمات ← هویت و تماس** (`/admin/settings/identity`): نام سایت، لوگو، فاویکن، تلفن، واتساپ، تلگرام، اینستاگرام، آدرس، ساعت کاری، کد اینماد.
2. **تنظیمات ← پوسته و رنگ‌ها** (`/admin/settings/theme`): رنگ‌های فروش (پایه تیره، برند، اقدام، موفقیت، فوریت، طلایی)، فونت، گردی گوشه، انیمیشن. توضیح هر رنگ در `docs/DESIGN-fa.md`.
3. **تنظیمات ← فروشگاه**: واحد نمایش، موجودی کم، مهمان/عضویت، شماره سفارش، مالیات.
4. **فروشگاه ← حمل‌ونقل** (`/admin/store/shipping`): منطقه‌ها (استان‌ها)، روش‌ها (ثابت، وزنی، پیک، رایگان)، ارسال رایگان بالای مبلغ مشخص.
5. **پرداخت و اتصال‌ها** (`/admin/settings/payments`): درگاه‌ها را با حالت آزمایشی روشن کنید، یک سفارش تست بزنید، بعد حالت واقعی را فعال کنید.
6. **پیامک** (کاوه‌نگار یا ملی‌پیامک): برای ورود مشتری با کد یک‌بارمصرف و پیامک سفارش لازم است.
7. **اطلاع‌رسانی**: ربات تلگرام (توکن + chat id) و SMTP؛ انتخاب کنید برای چه رویدادهایی (سفارش جدید، پرداخت، لید، تیکت، نظر) پیام بیاید.

### ۲. درگاه‌ها و اتصال‌ها

| مورد | فیلدهای پنل | نکته |
| --- | --- | --- |
| زرین‌پال | مرچنت کد، سندباکس | بازگشت روی `/api/pay/zarinpal/callback`؛ پرداخت فقط بعد از Verify سمت سرور تأیید می‌شود. |
| اسنپ‌پی | حالت live/stage/mock، آدرس پایه، client id/secret، نام کاربری/رمز | Eligible برای نمایش «قابل خرید اقساطی»، Token، Verify، Settle خودکار؛ Status/Revert/Cancel از صفحه سفارش. |
| ترب‌پی | مثل اسنپ‌پی + Settle خودکار | همان قرارداد API؛ کد پستی هم ارسال می‌شود. |
| کارت‌به‌کارت / پرداخت در محل | متن راهنما، شماره کارت، استان‌ها، کارمزد | سفارش «در انتظار بررسی» ثبت می‌شود. |
| درگاه آزمایشی | روشن/خاموش | فقط برای تست؛ تصمیم پرداخت سمت سرور ذخیره می‌شود و قابل جعل با پارامتر URL نیست. |
| ترب (API محصولات v3) | فعال، audience، شناسه‌ها | آدرس: `/torob_api/v3/products`؛ توکن EdDSA ترب بررسی می‌شود. |
| اسنپ‌شاپ | فعال، توکن | آدرس پایه: `/api/snappshop/v1`. |

### ۳. فروشگاه (مثل ووکامرس)

- **محصولات** (`/admin/products`): ساده یا متغیر (ویژگی‌ها و تنوع‌ها با قیمت/موجودی/SKU جدا)، فیزیکی (وزن، ابعاد، حمل) یا دیجیتال (فایل خصوصی، تعداد و مهلت دانلود)، قیمت ویژه با تاریخ پایان (شمارش معکوس واقعی در سایت)، گالری، سئو، محصولات مرتبط، انتشار زمان‌بندی‌شده. ورود/خروج CSV.
- **سفارش‌ها** (`/admin/orders`): فیلتر وضعیت/درگاه/تاریخ، جزئیات، تغییر وضعیت با اطلاع‌رسانی به مشتری، کد رهگیری مرسوله، یادداشت داخلی یا برای مشتری، بازپرداخت (به کیف پول یا دستی)، عملیات درگاه اقساطی، فاکتور قابل چاپ، ثبت سفارش دستی.
- **مشتری‌ها**، **کدهای تخفیف** (درصدی، مبلغ ثابت، ارسال رایگان؛ محدود به محصول/دسته/مشتری، سقف استفاده)، **گزارش‌ها** (فروش، درآمد، سهم هر درگاه، پرفروش‌ها؛ خروجی CSV).

### ۴. محتوا و نمایش

- **نوشته‌ها و برگه‌ها**: ویرایشگر بلوکی (تیتر، متن، تصویر، گالری، نقل‌قول، دکمه، پرسش‌وپاسخ، ویدیو آپارات/یوتیوب، جدول، محصولات)، پیش‌نویس، زمان‌بندی، نسخه‌های قبلی و بازگردانی، دسته و برچسب.
- **رسانه**: بارگذاری، برش، متن جایگزین (alt). فایل‌های محصولات دیجیتال خصوصی ذخیره می‌شوند و فقط با لینک دانلود معتبر قابل دریافت‌اند.
- **بخش‌های صفحه اصلی** (`/admin/homepage`): ترتیب، روشن/خاموش و متن هر بخش (هیرو، نوار اعتماد، دسته‌ها، پیشنهاد روز، پرفروش‌ها، اقساط، نظرات، خدمات، نمونه‌کار، تعرفه، پرسش‌ها، فرم مشاوره، وبلاگ) و منبع محصولات هر ردیف.
- **منوها**، **خدمات و لندینگ‌ها** (`/tarahi-site`، `/barname-nevisi`، `/branding-marketing` و لندینگ‌های جدید؛ قابل حذف)، **نمونه‌کارها**، **سئو و ریدایرکت‌ها** (عنوان/توضیح/noindex هر صفحه، کدهای تأیید، آنالیتیکس).

### ۵. ارتباط با مشتری

لیدها (وضعیت: جدید، تماس گرفته شد، واجد شرایط، موفق، ازدست‌رفته)، تیکت‌ها (دپارتمان، پاسخ، بستن)، نظرات وبلاگ و دیدگاه محصولات (تأیید، اسپم، زباله)، خبرنامه (خروجی CSV).

### ۶. سیستم

- **کاربران و نقش‌ها**: مدیر کل، مدیر فروشگاه، ویراستار، پشتیبان.
- **گزارش فعالیت**: چه کسی، چه زمانی، چه چیزی را تغییر داد.
- **ابزارها**: پشتیبان‌گیری و خروجی داده.

### ۷. پنل مشتری (`/account`)

ورود و ثبت‌نام با کد پیامکی، داشبورد، سفارش‌ها با رهگیری و دانلود فاکتور، دانلودها، وضعیت اقساط، آدرس‌ها، علاقه‌مندی‌ها، دیدگاه‌ها، تیکت پشتیبانی، اعلان‌ها، کیف پول و کدهای تخفیف، مشخصات حساب.

---

## Admin configuration guide (English summary)

1. **Settings → Identity & contact** — name, logo, favicon, phone/WhatsApp/Telegram/Instagram, address, eNamad.
2. **Settings → Theme** — the sales palette (ink, primary, action, success, urgency, gold), fonts, radius, motion. Rationale in `docs/DESIGN-fa.md`.
3. **Store → Shipping** — zones by province, flat/per-kg/courier/free methods, free-shipping threshold.
4. **Payments & integrations** (`/admin/settings/payments`) — Zarinpal (merchant id, sandbox), Snapp Pay and Torob Pay (live/stage/mock, OAuth credentials; eligibility, token, verify, settle, status/revert/cancel), card-to-card, cash on delivery, test gateway; Torob product API v3 (`/torob_api/v3/products`, EdDSA token check) and Snapp Shop (`/api/snappshop/v1`). Every callback is verified server-side before an order is marked paid.
5. **SMS** (Kavenegar/Melipayamak) for customer OTP login and order SMS; **Telegram** and **SMTP** for staff notifications.
6. **Homepage sections** — order, visibility, copy and product source of every block.
7. Products (simple/variable, physical/digital with private files), orders (status, tracking, notes, refunds, invoices, manual orders), customers, coupons, reports and CSV import/export; posts/pages with the block editor, drafts, scheduling and revisions; media library with crop and alt; menus; SEO and redirects; leads, tickets, comments, newsletter; users and roles (admin, shop manager, editor, support); activity log; backups.
