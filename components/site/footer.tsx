import Link from "next/link";
import { BadgeCheck, Clock, CreditCard, Headset, Mail, MapPin, Phone, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import type { ContactLinks } from "@/lib/contact";
import type { NavCategory, NavLink } from "@/components/site/header";
import { Logo } from "@/components/site/header";
import { NewsletterForm } from "@/components/site/forms";
import { TrustHtml } from "@/components/site/trust-html";

export type FooterProps = {
  siteName: string;
  logoUrl: string;
  description: string;
  address: string;
  hours: string;
  copyright: string;
  newsletterTitle: string;
  enamadHtml: string;
  links: NavLink[];
  categories: NavCategory[];
  contact: ContactLinks;
  guarantee: string;
  support: string;
  payments: string[];
};

export function SiteFooter(props: FooterProps) {
  const year = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric" }).format(new Date());
  const promises = [
    { icon: <Truck className="size-5" aria-hidden />, title: "ارسال سریع", body: "تحویل فایل فوری، ارسال کالا ۱ تا ۳ روز کاری" },
    { icon: <RotateCcw className="size-5" aria-hidden />, title: props.guarantee || "ضمانت بازگشت وجه", body: "بدون پرسش اضافه، طبق قوانین خرید" },
    { icon: <CreditCard className="size-5" aria-hidden />, title: "پرداخت امن و اقساطی", body: props.payments.length ? props.payments.join("، ") : "درگاه بانکی معتبر" },
    { icon: <Headset className="size-5" aria-hidden />, title: "پشتیبانی واقعی", body: props.support || "پاسخ در همان روز کاری" },
  ];
  return (
    <footer className="mt-16 md:mt-24">
      <div className="container-x">
        <div className="grid grid-cols-2 gap-3 rounded-[calc(var(--r)*1.3)] border border-line bg-surface p-4 shadow-1 md:grid-cols-4 md:gap-6 md:p-6">
          {promises.map((p) => (
            <div key={p.title} className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">{p.icon}</span>
              <span className="min-w-0">
                <b className="block text-[0.88rem] leading-6">{p.title}</b>
                <small className="block text-[0.74rem] leading-5 text-muted">{p.body}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="surface-ink grain mt-10 rounded-t-[calc(var(--r)*1.8)] pt-12 pb-8 md:mt-14 md:pt-16">
        <div className="container-x">
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-[1.35fr_1fr_1fr_1.2fr]">
            <div className="col-span-2 max-w-sm lg:col-span-1">
              <Logo siteName={props.siteName} logoUrl={props.logoUrl} light />
              <p className="mt-4 text-[0.9rem] leading-8 text-white/65">{props.description}</p>
              <div className="mt-5">
                <p className="mb-2 text-[0.85rem] font-bold">{props.newsletterTitle || "پیشنهادهای ویژه را زودتر بگیرید"}</p>
                <NewsletterForm />
              </div>
            </div>
            <div>
              <h2 className="mb-4 text-[0.92rem] font-extrabold">فروشگاه</h2>
              <ul className="space-y-2.5 text-[0.88rem] text-white/65">
                <li>
                  <Link href="/store" className="hover:text-white">
                    همه محصولات
                  </Link>
                </li>
                {props.categories.slice(0, 6).map((cat) => (
                  <li key={cat.slug}>
                    <Link href={`/store/category/${cat.slug}`} className="hover:text-white">
                      {cat.name}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/store?sort=bestseller" className="hover:text-white">
                    پرفروش‌ترین‌ها
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h2 className="mb-4 text-[0.92rem] font-extrabold">دسترسی سریع</h2>
              <ul className="space-y-2.5 text-[0.88rem] text-white/65">
                {props.links.map((link) => (
                  <li key={link.id}>
                  <Link href={link.href} target={link.newTab?"_blank":undefined} className="hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/account/orders" className="hover:text-white">
                    پیگیری سفارش
                  </Link>
                </li>
              </ul>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <h2 className="mb-4 text-[0.92rem] font-extrabold">ارتباط با ما</h2>
              <ul className="space-y-3 text-[0.88rem] text-white/70">
                {props.contact.phoneHref ? (
                  <li>
                    <a href={props.contact.phoneHref} className="flex items-center gap-2.5 hover:text-white">
                      <Phone className="size-4 text-white/45" aria-hidden />
                      <span className="ltr num font-bold text-white">{props.contact.phone}</span>
                    </a>
                  </li>
                ) : null}
                {props.contact.email ? (
                  <li>
                    <a href={`mailto:${props.contact.email}`} className="flex items-center gap-2.5 hover:text-white">
                      <Mail className="size-4 text-white/45" aria-hidden />
                      <span className="ltr">{props.contact.email}</span>
                    </a>
                  </li>
                ) : null}
                {props.hours ? (
                  <li className="flex items-center gap-2.5">
                    <Clock className="size-4 text-white/45" aria-hidden />
                    {props.hours}
                  </li>
                ) : null}
                {props.address ? (
                  <li className="flex items-start gap-2.5">
                    <MapPin className="mt-1 size-4 shrink-0 text-white/45" aria-hidden />
                    {props.address}
                  </li>
                ) : null}
              </ul>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {props.contact.whatsapp ? (
                  <a href={props.contact.whatsapp} target="_blank" rel="noopener" className="btn btn-light btn-sm">
                    واتساپ
                  </a>
                ) : null}
                {props.contact.telegram ? (
                  <a href={props.contact.telegram} target="_blank" rel="noopener" className="btn btn-light btn-sm">
                    تلگرام
                  </a>
                ) : null}
                {props.contact.instagram ? (
                  <a href={props.contact.instagram} target="_blank" rel="noopener" className="btn btn-light btn-sm">
                    اینستاگرام
                  </a>
                ) : null}
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <TrustHtml html={props.enamadHtml} />
                {!props.enamadHtml ? (
                  <span className="flex items-center gap-2 rounded-xl bg-white/6 px-3 py-2 text-[0.75rem] text-white/60 ring-1 ring-white/10">
                    <ShieldCheck className="size-4" aria-hidden /> پرداخت امن با درگاه‌های معتبر
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center text-[0.78rem] text-white/70 md:flex-row">
            <p>{props.copyright || `© ${year} ${props.siteName}. همه حقوق محفوظ است.`}</p>
            <p className="flex items-center gap-1.5">
              <BadgeCheck className="size-4" aria-hidden /> قیمت‌ها به تومان و شامل همه هزینه‌های اعلام‌شده است.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
