import type { Socials } from "@/lib/site";
import { toLatinDigits } from "@/lib/money";

export type ContactLinks = { phone: string; phoneHref: string; whatsapp: string; telegram: string; instagram: string; email: string };

export function contactLinks(settings: { phone: string; email: string; socials: Socials }): ContactLinks {
  const phoneDigits = toLatinDigits(settings.phone || "").replace(/[^\d+]/g, "");
  const wa = (settings.socials.whatsapp || "").trim();
  let whatsapp = "";
  if (/^https?:\/\//.test(wa)) whatsapp = wa;
  else if (wa) {
    const digits = toLatinDigits(wa).replace(/\D/g, "");
    const intl = digits.startsWith("0") ? `98${digits.slice(1)}` : digits;
    whatsapp = intl ? `https://wa.me/${intl}` : "";
  }
  const tg = (settings.socials.telegram || "").trim();
  const telegram = !tg ? "" : /^https?:\/\//.test(tg) ? tg : `https://t.me/${tg.replace(/^@/, "")}`;
  const ig = (settings.socials.instagram || "").trim();
  const instagram = !ig ? "" : /^https?:\/\//.test(ig) ? ig : `https://instagram.com/${ig.replace(/^@/, "")}`;
  return { phone: settings.phone, phoneHref: phoneDigits ? `tel:${phoneDigits}` : "", whatsapp, telegram, instagram, email: settings.email };
}
