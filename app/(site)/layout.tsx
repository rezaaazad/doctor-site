import { getSiteSafe } from "@/lib/site";
import { getOptions } from "@/lib/options";
import { getCustomer } from "@/lib/customer-auth";
import { storeCategories } from "@/lib/store/catalog";
import { contactLinks } from "@/lib/contact";
import { prisma } from "@/lib/db";
import { CartProvider } from "@/components/store/cart";
import { CartDrawer } from "@/components/store/cart-drawer";
import { SiteHeader, type NavLink } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { Announcement } from "@/components/site/announcement";
import { FloatingContact, MobileBar } from "@/components/site/contact-dock";
import { JsonLd, organizationLd } from "@/components/site/json-ld";
import { Tracker } from "@/components/site/tracker";

async function menu(location: string): Promise<NavLink[]> {
  const rows = await prisma.menuItem
    .findMany({ where: { location, visible: true }, orderBy: { sortOrder: "asc" } })
    .catch(() => []);
  const top = rows.filter((r) => !r.parentId);
  return top.map((r) => ({
    id: r.id,
    label: r.label,
    href: r.href,
    highlight: r.highlight,
    newTab: r.newTab,
    children: rows.filter((c) => c.parentId === r.id).map((c) => ({ id: c.id, label: c.label, href: c.href, newTab: c.newTab })),
  }));
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [site, options, customer, categories, headerLinks, footerLinks] = await Promise.all([
    getSiteSafe(),
    getOptions(),
    getCustomer().catch(() => null),
    storeCategories().catch(() => []),
    menu("header"),
    menu("footer"),
  ]);
  const header = options.header;
  const store = options.store;
  const contact = contactLinks(site.settings);
  const navCategories = categories
    .filter((c) => !c.parentId)
    .map((c) => ({ slug: c.slug, name: c.name, count: c.count, icon: c.icon, description: c.description, children: categories.filter(child => child.parentId === c.id).map(child => ({slug:child.slug, name:child.name})) }));
  const payments = [
    options.pay_zarinpal.enabled ? "زرین‌پال" : "",
    options.pay_snapppay.enabled ? "اسنپ‌پی" : "",
    options.pay_torobpay.enabled ? "ترب‌پی" : "",
  ].filter(Boolean);

  return (
    <CartProvider>
      <JsonLd data={organizationLd(site.settings)} />
      <Tracker />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:right-2 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white">
        رفتن به محتوای اصلی
      </a>
      {header.announceOn ? <Announcement text={String(header.announceText || "")} href={String(header.announceHref || "")} endsAt={String(header.announceEndsAt || "")} /> : null}
      <SiteHeader
        siteName={site.settings.siteName}
        logoUrl={site.settings.logoUrl}
        links={headerLinks}
        categories={navCategories}
        phone={contact.phone}
        phoneHref={contact.phoneHref}
        showPhone={Boolean(header.showPhoneInHeader)}
        cta={{ label: String(header.ctaLabel || ""), href: String(header.ctaHref || "/contact") }}
        signedIn={Boolean(customer)}
      />
      <main id="main" className="min-h-[60vh]">
        {children}
      </main>
      <SiteFooter
        siteName={site.settings.siteName}
        logoUrl={site.settings.logoUrl}
        description={site.settings.footerNote || site.settings.description}
        address={site.settings.address}
        hours={site.settings.hours}
        copyright={site.settings.copyright}
        newsletterTitle={site.settings.newsletterTitle}
        samandehiUrl={String(options.header.samandehiUrl || "")}
        enamadHtml={site.settings.enamadHtml}
        links={footerLinks}
        categories={navCategories}
        contact={contact}
        guarantee={String(store.guaranteeText || "")}
        support={String(store.supportText || "")}
        payments={payments}
      />
      <CartDrawer />
      <MobileBar enabled={Boolean(header.stickyBar)} />
      <FloatingContact links={contact} enabled={Boolean(header.floatingContact)} />
    </CartProvider>
  );
}
