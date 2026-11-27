import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
const site = new URL(process.env.SITE_URL);
assert.equal(site.hostname, "127.0.0.1");
assert.equal(new URL(process.env.DATABASE_URL).username, "license_qa");
const { customer } = JSON.parse(
  readFileSync(process.env.LICENSE_QA_SESSION_FILE, "utf8"),
);
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--single-process"],
});
try {
  const context = await browser.newContext({
    extraHTTPHeaders: { Origin: site.origin },
  });
  await context.addCookies([
    { name: "ds_customer", value: customer, url: site.origin },
  ]);
  const page = await context.newPage();
  await page.goto(site.origin + "/store/qa-plugin");
  await page
    .getByPlaceholder("shop.example.com")
    .fill("www.browser.example.test");
  await page
    .getByRole("button", { name: "افزودن به سبد", exact: true })
    .first()
    .click();
  await page.goto(site.origin + "/checkout");
  await page.getByText("درگاه آزمایشی", { exact: true }).click();
  await page
    .locator("label")
    .filter({ has: page.locator("a[href]") })
    .getByRole("checkbox")
    .check();
  await page.getByRole("button", { name: "پرداخت و ثبت سفارش" }).click();
  await page.getByRole("button", { name: "پرداخت موفق" }).click();
  await page.waitForURL("**/checkout/result/**");
  execFileSync(process.execPath, ["scripts/licenses/worker.mjs", "--once"]);
  await page.goto(site.origin + "/account/downloads");
  const link = page
    .locator("article")
    .filter({ hasText: "www.browser.example.test" })
    .getByRole("link", { name: "دانلود ZIP قابل نصب" });
  const downloading = page.waitForEvent("download");
  await link.click();
  assert.match((await downloading).suggestedFilename(), /pro-0\.2\.0\.zip$/);
  console.log("Browser purchase and customer panel download passed");
} finally {
  await browser.close();
}
