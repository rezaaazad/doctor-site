import { Chrome } from "@/components/site/chrome";
import { JsonLd, organizationLd } from "@/components/site/json-ld";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { Tracker } from "@/components/site/tracker";
import { TrustHtml } from "@/components/site/trust-html";
import { getSiteSafe, menuOf } from "@/lib/site";
import { telHref, telegramHref, whatsappHref } from "@/lib/reach";
import Link from "next/link";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await getSiteSafe();
  const phone = site.settings.phone;
  const tel = telHref(phone);
  const wa = whatsappHref(site.settings.socials.whatsapp);
  const tg = telegramHref(site.settings.socials.telegram);
  return (
    <>
      <JsonLd data={organizationLd(site.settings)} />
      <Tracker />
      <Chrome
        siteName={site.settings.siteName}
        logoUrl={site.settings.logoUrl}
        phone={phone}
        tel={tel}
        links={menuOf(site, "header")}
        services={site.services}
      >
        {children}
        <footer className="foot">
          <div className="cta-strip">
            <div>
              <strong>پروژه بعدی را با محدوده روشن شروع کنیم.</strong>
              <p className="muted" style={{ margin: "4px 0 0" }}>مشاوره اول رایگان است. نام و شماره کافی است.</p>
            </div>
            <Link className="pill solid" href="/contact">مشاوره رایگان</Link>
          </div>
          <div className="foot-panel">
            <div className="cols">
              <div>
                <h2>{site.settings.siteName}</h2>
                <p className="lead">{site.settings.footerNote || site.settings.description}</p>
                <NewsletterForm title={site.settings.newsletterTitle || "یادداشت‌های کوتاه درباره سایت و سئو"} />
              </div>
              <div>
                <h2>خدمات</h2>
                {site.services.map((service) => (
                  <Link key={service.id} href={service.href || "/services"}>{service.title}</Link>
                ))}
              </div>
              <div>
                <h2>دسترسی</h2>
                {menuOf(site, "footer").map((link) => (
                  <Link key={link.id} href={link.href}>{link.label}</Link>
                ))}
                <Link href="/tarahi-site">طراحی سایت</Link>
                <Link href="/barname-nevisi">برنامه نویسی</Link>
                <Link href="/branding-marketing">برندینگ و مارکتینگ</Link>
              </div>
              <div>
                <h2>تماس</h2>
                {tel ? <a href={tel}>{phone}</a> : null}
                {site.settings.email ? <a href={`mailto:${site.settings.email}`}>{site.settings.email}</a> : null}
                {site.settings.address ? <p>{site.settings.address}</p> : null}
                {site.settings.hours ? <p>{site.settings.hours}</p> : null}
                {wa ? <a href={wa}>واتساپ</a> : null}
                {tg ? <a href={tg}>تلگرام</a> : null}
                {site.settings.socials.instagram ? <a href={site.settings.socials.instagram}>اینستاگرام</a> : null}
              </div>
            </div>
            <TrustHtml html={site.settings.enamadHtml} />
          </div>
          <p className="wordmark">{site.settings.copyright || site.settings.siteName}</p>
        </footer>
      </Chrome>
    </>
  );
}
