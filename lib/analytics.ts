import { createHash } from "crypto";
import { prisma } from "@/lib/db";

const BOT = /bot|crawl|spider|slurp|preview|headless|facebookexternal|whatsapp|telegram|wget|curl|python|go-http|monitor|uptime/i;

export function classify(ua: string) {
  const raw = ua || "";
  const browser = /edg\//i.test(raw)
    ? "Edge"
    : /chrome|crios/i.test(raw)
      ? "Chrome"
      : /firefox|fxios/i.test(raw)
        ? "Firefox"
        : /safari/i.test(raw)
          ? "Safari"
          : "سایر";
  const device = /ipad|tablet/i.test(raw) ? "تبلت" : /mobi|android|iphone/i.test(raw) ? "موبایل" : "دسکتاپ";
  return { browser, device, bot: BOT.test(raw) };
}

export async function recordView(input: { path: string; referrer: string; ua: string; ip: string; country: string }) {
  const path = input.path.slice(0, 200);
  if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api") || path.startsWith("/_next")) return;
  const { browser, device, bot } = classify(input.ua);
  if (bot) return;
  const day = new Date().toISOString().slice(0, 10);
  const salt = `${process.env.SESSION_SECRET || "doctor-site"}:${day}`;
  const visitorHash = createHash("sha256").update(`${salt}|${input.ip}|${input.ua}`).digest("hex").slice(0, 32);
  let referrer = "";
  try {
    if (input.referrer) referrer = new URL(input.referrer).hostname.replace(/^www\./, "").slice(0, 120);
  } catch {
    referrer = "";
  }
  await prisma.pageView.create({
    data: { path, referrer, device, browser, country: input.country.slice(0, 8), visitorHash },
  });
}
