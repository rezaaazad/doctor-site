// Usage: node scripts/shots.mjs <outDir> <path>[,<path>...] [--mobile-only|--desktop-only] [--admin] [--account]
// Takes full-page screenshots at 390px and 1440px. With --admin it logs in using ADMIN_EMAIL/ADMIN_PASSWORD.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [outDir = "/tmp/shots", list = "/", ...flags] = process.argv.slice(2);
const base = process.env.SHOT_BASE || "http://localhost:43123";
const paths = list.split(",");
mkdirSync(outDir, { recursive: true });
const sizes = [
  { name: "mobile", width: 390, height: 844, mobile: true },
  { name: "desktop", width: 1440, height: 900, mobile: false },
].filter((s) => (flags.includes("--mobile-only") ? s.mobile : flags.includes("--desktop-only") ? !s.mobile : true));

const browser = await chromium.launch();
for (const size of sizes) {
  const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: size.mobile ? 2 : 1, isMobile: size.mobile, hasTouch: size.mobile, locale: "fa-IR" });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`[pageerror] ${e.message}`));
  page.on("console", (m) => m.type() === "error" && console.log(`[console] ${m.text()}`));
  if (flags.includes("--admin")) {
    await page.goto(`${base}/admin/login`);
    await page.fill('input[name="email"]', process.env.ADMIN_EMAIL || "admin@doctor-site.ir");
    await page.fill('input[name="password"]', process.env.ADMIN_PASSWORD || "AdminPass12345");
    await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/admin/login"), { timeout: 20000 }), page.click('button[type="submit"]')]);
  }
  if (flags.includes("--account")) {
    const mobile = process.env.DEMO_MOBILE || "09120000001";
    await page.goto(`${base}/account/login`);
    await page.fill('input[inputmode="tel"]', mobile);
    await page.getByRole("button", { name: /دریافت کد/ }).click();
    await page.waitForSelector('input[autocomplete="one-time-code"]', { timeout: 20000 });
    let code = process.env.SHOT_OTP || "";
    if (!code) {
      const devLine = await page.locator("text=کد توسعه:").textContent().catch(() => null);
      code = devLine?.replace(/.*کد توسعه:\s*/, "").trim() || "";
    }
    if (!code) throw new Error("OTP unavailable: set SHOT_OTP or enable sms.provider=console in dev");
    await page.fill('input[autocomplete="one-time-code"]', code || "");
    await page.getByRole("button", { name: /^ورود$/ }).click();
    await page.waitForURL((u) => u.pathname.startsWith("/account") && !u.pathname.startsWith("/account/login"), { timeout: 20000 });
  }
  for (const path of paths) {
    await page.goto(`${base}${path}`, { waitUntil: "networkidle" });
    await page.evaluate(async () => {
      document.querySelectorAll("[data-reveal]").forEach((el) => el.setAttribute("data-in", ""));
      for (let y = 0; y < document.body.scrollHeight; y += 700) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 40));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);
    const file = `${outDir}/${size.name}${path.replace(/[/?=&]+/g, "_") || "_home"}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(file);
  }
  await context.close();
}
await browser.close();
