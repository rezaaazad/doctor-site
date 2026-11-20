"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/lib/text";
import { tr } from "@/lib/text";
import type { MenuLink } from "@/lib/site";
import { getLenis } from "@/components/site/motion";

export function Header({
  locale,
  siteName,
  logoUrl,
  links,
}: {
  locale: Locale;
  siteName: string;
  logoUrl: string;
  links: MenuLink[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const lenis = getLenis();
    if (open) lenis?.stop();
    else lenis?.start();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      getLenis()?.start();
    };
  }, [open]);

  function toggleLocale() {
    const next = locale === "en" ? "fa" : "en";
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
    document.documentElement.lang = next === "en" ? "en" : "fa";
    document.documentElement.dir = next === "en" ? "ltr" : "rtl";
    router.refresh();
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex h-[var(--header)] items-center justify-between px-[var(--pad)]">
        <Link href="/" className="flex min-h-12 items-center text-base font-bold">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={siteName} className="h-7 w-auto" />
          ) : (
            siteName
          )}
        </Link>
        <button type="button" className="hit" onClick={() => setOpen(true)} aria-expanded={open} aria-controls="site-menu">
          {locale === "en" ? "Menu" : "منو"}
        </button>
      </header>
      {open ? (
        <div id="site-menu" className="menu" role="dialog" aria-modal="true" aria-label={locale === "en" ? "Menu" : "منو"}>
          <div className="flex items-center justify-between">
            <span className="text-base font-bold">{siteName}</span>
            <button type="button" className="hit" onClick={() => setOpen(false)}>
              {locale === "en" ? "Close" : "بستن"}
            </button>
          </div>
          <nav>
            {links.map((link, index) => (
              <Link key={link.id} href={link.href} className="item">
                <span>{tr(locale, link.label, link.labelEn)}</span>
                <small className="latin text-sm text-[var(--muted)]">{String(index + 1).padStart(2, "0")}</small>
              </Link>
            ))}
          </nav>
          <button type="button" className="hit mt-6 w-fit text-base" onClick={toggleLocale}>
            {locale === "en" ? "فارسی" : "English"}
          </button>
        </div>
      ) : null}
    </>
  );
}

export function Footer({
  locale,
  siteName,
  note,
  email,
  links,
  socials,
}: {
  locale: Locale;
  siteName: string;
  note: string;
  email: string;
  links: MenuLink[];
  socials: { label: string; href: string }[];
}) {
  return (
    <footer className="site-footer pad">
      <div>
        <p className="word">{siteName}</p>
        {note ? <p className="lede mt-4">{note}</p> : null}
        <p className="mt-6 text-sm text-[var(--muted)]">© {new Date().getFullYear()}</p>
      </div>
      <div className="foot-links">
        {links.map((link) => (
          <Link key={link.id} href={link.href}>
            {tr(locale, link.label, link.labelEn)}
          </Link>
        ))}
        {email ? <a href={`mailto:${email}`}>{email}</a> : null}
        {socials.map((item) => (
          <a key={item.label} href={item.href} rel="noreferrer">
            {item.label}
          </a>
        ))}
      </div>
    </footer>
  );
}
