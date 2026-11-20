import Link from "next/link";
import { tx, tr, paragraphs, type Locale } from "@/lib/text";
import type { SiteData } from "@/lib/site";

const fallbackTypes = ["سایت شرکتی", "فروشگاه اینترنتی", "اپلیکیشن", "سئو", "بازطراحی"];
const fallbackBudgets = ["زیر ۲۰ میلیون", "۲۰ تا ۵۰ میلیون", "۵۰ تا ۱۰۰ میلیون", "بالای ۱۰۰ میلیون", "هنوز مشخص نیست"];

export function HomeView({ site, locale, catalog }: { catalog: React.ReactNode; site: SiteData; locale: Locale }) {
  const hero = site.sections.find((s) => s.page === "home" && s.key === "hero" && s.visible);
  const about = site.sections.find((s) => s.page === "home" && s.key === "aboutTeaser" && s.visible);
  const work = site.sections.find((s) => s.page === "portfolio" && s.key === "portfolioIntro");
  const quotes = site.sections.find((s) => s.page === "home" && s.key === "testimonials" && s.visible);
  const logos = site.sections.find((s) => s.page === "home" && s.key === "logos" && s.visible);
  const servicesHead = site.sections.find((s) => s.page === "home" && s.key === "servicesTeaser");
  const c = hero?.content ?? {};
  const more = tx(servicesHead?.content ?? {}, "linkLabel", locale, "جزئیات");

  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <h1 className="grad">{locale === "en" ? "Digital tools for your online store" : "ابزارهای دیجیتال برای فروشگاه شما"}</h1>
          <p className="hero-sub">{locale === "en" ? "Explore plugins and automation tools for running your store." : "افزونه‌ها و ابزارهای اتوماسیون برای مدیریت سفارش‌ها، موجودی و کارهای روزمرهٔ فروشگاه."}</p>
          <div className="hero-cta">
            <Link className="pill solid" href="/store">{locale === "en" ? "Explore products" : "مشاهده محصولات"}</Link>
            <Link className="pill" href="/contact">{locale === "en" ? "Request a project" : "سفارش پروژه اختصاصی"}</Link>
          </div>
        </div>
        <div className="studio-hero-photo" aria-hidden="true" />
      </section>
      {catalog}
      <section className="offer" aria-label="خدمات">
        {site.services.slice(0, 4).map((service, index) => (
          <Link key={service.id} href={service.href || "/services"} className="offer-card">
            <Icon n={index} />
            <h2>{tr(locale, service.title, service.titleEn)}</h2>
            <p>{tr(locale, service.summary, service.summaryEn)}</p>
            <span>{more}</span>
          </Link>
        ))}
      </section>
      <div className="ribbon">
        <h2>{tx(c, "title", locale, "دکتر سایت، برای کسب‌وکاری که مشتری می‌خواهد")}</h2>
        <p>{tx(c, "trust", locale, "پاسخ در همان روز کاری")}</p>
      </div>
      {about ? (
        <section className="block">
          <p className="eyebrow">{tx(about.content, "kicker", locale, "درباره")}</p>
          <h2>{tx(about.content, "title", locale)}</h2>
          <p>{tx(about.content, "body", locale)}</p>
          <Link className="pill" href="/about" style={{ marginTop: 22 }}>{tx(about.content, "linkLabel", locale, "درباره ما")}</Link>
        </section>
      ) : null}
      <section>
        <div className="block" style={{ paddingBottom: 8 }}>
          <p className="eyebrow">{work ? tx(work.content, "kicker", locale, "نمونه‌کار") : "نمونه‌کار"}</p>
          <h2>{work ? tx(work.content, "title", locale, "از ایده تا واقعیت") : "از ایده تا واقعیت"}</h2>
        </div>
        <div className="rail">
          {site.projects.map((project) => (
            <Link key={project.id} href={`/portfolio/${project.slug}`} className="shot">
              {project.coverUrl ? <img src={project.coverUrl} alt="" /> : <div className="ph" />}
              <div className="cap">
                <b>{tr(locale, project.title, project.titleEn)}</b>
                <span>{project.tags[0] || project.client}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      {quotes && site.testimonials.length ? (
        <section>
          <div className="block" style={{ paddingBottom: 8 }}>
            <p className="eyebrow">{tx(quotes.content, "kicker", locale)}</p>
            <h2>{tx(quotes.content, "title", locale, "روایت مشتریان")}</h2>
          </div>
          <div className="quotes">
            {site.testimonials.map((item, index) => (
              <blockquote key={item.id} className="quote">
                <header><b>{item.name}</b><span>{tr(locale, item.role, item.roleEn)}</span></header>
                <p>{tr(locale, item.quote, item.quoteEn)}</p>
                <footer><b>{String(index + 1).padStart(2, "0")}</b></footer>
              </blockquote>
            ))}
          </div>
        </section>
      ) : null}
      {logos && site.logos.length ? (
        <section>
          <div className="block" style={{ paddingBottom: 8 }}>
            <p className="eyebrow">{tx(logos.content, "kicker", locale)}</p>
            <h2>{tx(logos.content, "title", locale)}</h2>
          </div>
          <div className="logo-grid">
            {site.logos.map((logo) => logo.imageUrl ? <img key={logo.id} src={logo.imageUrl} alt={logo.name} /> : <span key={logo.id}>{logo.name}</span>)}
          </div>
          {tx(logos.content, "note", locale) ? <p className="muted pad" style={{ paddingBottom: 24 }}>{tx(logos.content, "note", locale)}</p> : null}
        </section>
      ) : null}
    </>
  );
}

export function PageHero({ crumb, title, headline, body, studioPhoto }: { studioPhoto?: "workspace"; crumb: string; title: string; headline: string; body?: string }) {
  return (
    <header className="page" data-photo={studioPhoto}>
      <p className="crumb">خانه <span aria-hidden> ‹ </span> <b>{crumb}</b></p>
      <h1 className="grad">{headline}</h1>
      <p style={{ fontSize: 22, fontWeight: 600, marginTop: 12 }}>{title}</p>
      {body ? <div className="muted" style={{ maxWidth: 720, marginTop: 8 }}>{paragraphs(body).map((p) => <p key={p.slice(0, 24)}>{p}</p>)}</div> : null}
    </header>
  );
}

function Icon({ n }: { n: number }) {
  const common = { width: 28, height: 28, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, "aria-hidden": true as const };
  if (n === 1) return <svg {...common}><path d="M8 7h8M8 12h8M8 17h5" /><rect x="4" y="3" width="16" height="18" rx="2" /></svg>;
  if (n === 2) return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M8 14c1.2-2 2.6-3 4-3s2.8 1 4 3" /></svg>;
  if (n === 3) return <svg {...common}><path d="M4 16c2-6 4-8 8-8s6 2 8 8" /><path d="M8 16h8" /></svg>;
  return <svg {...common}><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M3 9h18" /></svg>;
}

export { fallbackTypes, fallbackBudgets };
