"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { MenuLink, ServiceItem } from "@/lib/site";

export function Chrome({
  siteName,
  logoUrl,
  phone,
  tel,
  links,
  services,
  children,
}: {
  siteName: string;
  logoUrl: string;
  phone: string;
  tel: string;
  links: MenuLink[];
  services: ServiceItem[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const nav = links.filter((link) => link.href !== "/services");

  return (
    <>
      <header className={stuck ? "topbar stuck" : "topbar"}>
        <button type="button" className="burger" aria-expanded={open} aria-label={open ? "بستن منو" : "باز کردن منو"} onClick={() => setOpen(true)}>
          <svg width="26" height="18" viewBox="0 0 28 22" fill="none" aria-hidden>
            <path d="M2 2h24M2 11h24M2 20h24" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
        <Link href="/" className="brand">
          {logoUrl ? <img src={logoUrl} alt="" style={{ height: 36, width: "auto" }} /> : <span className="mark" aria-hidden />}
          <span>{siteName}</span>
        </Link>
        <nav className="desk" aria-label="اصلی">
          <div className="drop">
            <Link href="/services">خدمات</Link>
            <div className="drop-menu">
              {services.map((service) => (
                <Link key={service.id} href={service.href || "/services"}>{service.title}</Link>
              ))}
            </div>
          </div>
          {nav.map((link) => <Link key={link.id} href={link.href}>{link.label}</Link>)}
        </nav>
        <div className="head-cta">
          <Link className="pill solid head-btn" href="/contact">مشاوره رایگان</Link>
          {tel ? <a className="phone" href={tel}>{phone}</a> : null}
        </div>
      </header>
      <div className={open ? "drawer show" : "drawer"} aria-hidden={!open}>
        <div className="mb-4 flex items-center justify-between">
          <strong>{siteName}</strong>
          <button type="button" className="burger" style={{ position: "static" }} onClick={() => setOpen(false)} aria-label="بستن">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav>
          <Link href="/services">خدمات</Link>
          {services.map((service) => (
            <Link key={service.id} href={service.href || "/services"} className="sub">{service.title}</Link>
          ))}
          {nav.map((link) => <Link key={link.id} href={link.href}>{link.label}</Link>)}
          <Link href="/contact">مشاوره رایگان</Link>
        </nav>
      </div>
      <main id="content">{children}</main>
    </>
  );
}
