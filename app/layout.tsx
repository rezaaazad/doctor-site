import { Reveal } from "@/components/ui/reveal";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getSiteSafe } from "@/lib/site";
import { getOptions } from "@/lib/options";
import { themeFonts, themeStyle } from "@/lib/theme";
import { siteUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function generateMetadata(): Promise<Metadata> {
  const [site, options] = await Promise.all([getSiteSafe(), getOptions()]);
  const seo = options.seo;
  const torob = options.torob;
  const other: Record<string, string> = {};
  if (seo.enamadVerification) other.enamad = String(seo.enamadVerification);
  if (torob.verification) other["torob-site-verification"] = String(torob.verification);
  return {
    metadataBase: new URL(siteUrl()),
    applicationName: site.settings.siteName,
    authors: [{ name: site.settings.siteName, url: siteUrl() }],
    creator: site.settings.siteName,
    robots: { index: true, follow: true },
    icons: site.settings.faviconUrl ? { icon: site.settings.faviconUrl, apple: site.settings.faviconUrl } : undefined,
    verification: {
      google: seo.googleVerification ? String(seo.googleVerification) : undefined,
      yandex: seo.yandexVerification ? String(seo.yandexVerification) : undefined,
      other: { ...(seo.bingVerification ? { "msvalidate.01": String(seo.bingVerification) } : {}), ...other },
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const options = await getOptions();
  return {
    themeColor: String(options.theme.ink || "#0B1530"),
    colorScheme: "light",
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  };
}

const REVEAL_SCRIPT = `(function(){try{var d=document.documentElement;if(d.dataset.motion==='on'&&'IntersectionObserver' in window&&!matchMedia('(prefers-reduced-motion: reduce)').matches)d.setAttribute('data-rv','')}catch(e){}})();`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const options = await getOptions();
  const theme = options.theme;
  return (
    <html lang="fa" dir="rtl" data-motion={theme.motion ? "on" : "off"} style={themeStyle(theme)} suppressHydrationWarning>
      <head>
        {themeFonts(theme).map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
        <script dangerouslySetInnerHTML={{ __html: REVEAL_SCRIPT }} />
      </head>
      <body>
        {children}
        <Reveal />
      </body>
    </html>
  );
}
