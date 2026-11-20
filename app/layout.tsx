import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getLocale, getSiteSafe } from "@/lib/site";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSiteSafe();
  return {
    metadataBase: new URL(siteUrl()),
    applicationName: site.settings.siteName,
    authors: [{ name: site.settings.siteName, url: siteUrl() }],
    creator: site.settings.siteName,
    robots: { index: true, follow: true },
    icons: site.settings.faviconUrl ? { icon: site.settings.faviconUrl, apple: site.settings.faviconUrl } : undefined,
  };
}

export async function generateViewport(): Promise<Viewport> {
  const site = await getSiteSafe();
  return {
    themeColor: site.settings.backgroundColor,
    colorScheme: "dark",
    width: "device-width",
    initialScale: 1,
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [site, locale] = await Promise.all([getSiteSafe(), getLocale()]);
  const font = site.settings.fontFamily === "Estedad" ? "Estedad" : "Vazirmatn";
  const style = {
    "--accent": site.settings.accentColor,
    "--bg": site.settings.backgroundColor,
    "--surface": site.settings.surfaceColor,
    "--fg": site.settings.textColor,
    "--muted": site.settings.mutedColor,
    "--font-family": font,
  } as React.CSSProperties;
  return (
    <html lang={locale === "en" ? "en" : "fa"} dir={locale === "en" ? "ltr" : "rtl"} data-animate={site.settings.animationsEnabled ? "on" : "off"} style={style}>
      <head>
        <link
          rel="preload"
          href={font === "Estedad" ? "/fonts/Estedad-Variable.woff2" : "/fonts/Vazirmatn-Variable.woff2"}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.dataset.reduce='1'}catch(e){}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
