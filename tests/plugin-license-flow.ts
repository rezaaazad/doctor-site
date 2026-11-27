// Run only against a freshly migrated disposable loopback DB with the test Next server running.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID, createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { prisma } from "../lib/db";
import { createOrder } from "../lib/store/checkout";
import {
  startPayment,
  recordMockDecision,
  handleCallback,
} from "../lib/payments";
async function exercise() {
  const db = new URL(process.env.DATABASE_URL!);
  const site = new URL(process.env.SITE_URL!);
  assert.equal(db.hostname, "127.0.0.1");
  assert.equal(db.username, "license_qa");
  assert.equal(site.hostname, "127.0.0.1");
  for (const [key, value] of [
    ["store", { enabled: true }],
    ["pay_mock", { enabled: true }],
  ] as const)
    await prisma.option.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  const customer = await prisma.customer.create({
    data: { mobile: "09000000001", name: "خریدار آزمایشی" },
  });
  const other = await prisma.customer.create({
    data: { mobile: "09000000002" },
  });
  const category = await prisma.storeCategory.create({
    data: { slug: "qa", name: "افزونه‌ها" },
  });
  const product = await prisma.storeProduct.create({
    data: {
      categoryId: category.id,
      slug: "qa-plugin",
      title: "دستیار هوشمند مدیر فروشگاه ووکامرس",
      summary: "محصول آزمایشی",
      type: "digital",
      licensedPlugin: true,
      published: true,
      priceRial: 9900000,
      variants: {
        create: {
          title: "حرفه‌ای",
          pluginTier: "pro",
          pluginDays: 365,
          priceRial: 29900000,
        },
      },
    },
    include: { variants: true },
  });
  const line = {
    productId: product.id,
    variantId: product.variants[0].id,
    host: "https://Shop.Example.com/",
    quantity: 1,
    price: 1,
    tier: "business",
  };
  const order = (renewalId = "") =>
    createOrder({
      customer,
      lines: [{ ...line, renewalId }],
      gateway: "mock",
      name: customer.name,
      mobile: customer.mobile,
      ip: "127.0.0.1",
    });
  const pay = async (id: string, approve: boolean) => {
    const payment = await startPayment(id, "mock");
    const tx = payment.redirect.split("/").pop()!;
    if (approve) await recordMockDecision(tx, true);
    await Promise.all([
      handleCallback("mock", { tx }),
      handleCallback("mock", { tx }),
    ]);
  };
  await pay((await order()).id, false);
  assert.equal(await prisma.pluginLicense.count(), 0);
  const initial = await order();
  await pay(initial.id, true);
  const license = await prisma.pluginLicense.findFirstOrThrow();
  assert.equal(license.host, "shop.example.com");
  assert.equal(license.tier, "pro");
  assert.equal(license.state, "pending");
  const item = await prisma.orderItem.findFirstOrThrow({
    where: { orderId: initial.id },
  });
  assert.equal(item.unitRial, BigInt(29900000));
  const worker = (key: string) =>
    execFileSync(process.execPath, ["scripts/licenses/worker.mjs", "--once"], {
      env: { ...process.env, PLUGIN_SIGNING_KEY_FILE: key },
    });
  worker("/missing-test-key");
  assert.equal(
    (await prisma.order.findUniqueOrThrow({ where: { id: initial.id } }))
      .paymentStatus,
    "paid",
  );
  await prisma.pluginLicense.update({
    where: { id: license.id },
    data: { nextAttempt: new Date() },
  });
  worker(process.env.PLUGIN_SIGNING_KEY_FILE!);
  const token = async (customerId: string) => {
    const value = randomUUID();
    const tokenHash = createHash("sha256")
      .update(process.env.SESSION_SECRET + ":c:" + value)
      .digest("hex");
    await prisma.customerSession.create({
      data: {
        customerId,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    return value;
  };
  const own = await token(customer.id),
    stranger = await token(other.id);
  const url = new URL("/api/licenses/" + license.id + "/download", site);
  const download = (t: string) =>
    fetch(url, { headers: { cookie: "ds_customer=" + t } });
  assert.equal((await download("")).status, 401);
  assert.equal((await download(stranger)).status, 404);
  const panel = await fetch(new URL("/account/downloads", site), {
    headers: { cookie: "ds_customer=" + own },
  });
  assert.ok((await panel.text()).includes(url.pathname));
  for (let n = 0; n < 2; n++) {
    const r = await download(own);
    assert.equal(r.status, 200);
    assert.equal(
      Buffer.from(await r.arrayBuffer()).toString("ascii", 0, 2),
      "PK",
    );
  }
  const old = await prisma.pluginLicense.findUniqueOrThrow({
    where: { id: license.id },
  });
  assert.equal(old.expiresAt.getTime(), license.expiresAt.getTime());
  await pay((await order(license.id)).id, true);
  const renewed = await prisma.pluginLicense.findUniqueOrThrow({
    where: { id: license.id },
  });
  assert.equal(
    renewed.expiresAt.getTime() - old.expiresAt.getTime(),
    365 * 86400000,
  );
  assert.equal(await prisma.pluginLicense.count(), 1);
  assert.equal(await prisma.licensePurchase.count(), 2);
  worker(process.env.PLUGIN_SIGNING_KEY_FILE!);
  await prisma.pluginLicense.update({
    where: { id: license.id },
    data: { expiresAt: new Date(0) },
  });
  assert.equal((await download(own)).status, 404);
  const expiredRenewal = await order(license.id);
  await pay(expiredRenewal.id, true);
  const receipt = await prisma.licensePurchase.findFirstOrThrow({
    where: { item: { orderId: expiredRenewal.id } },
  });
  const end = new Date(receipt.paidAt);
  end.setUTCDate(end.getUTCDate() + 364);
  end.setUTCHours(23, 59, 59, 0);
  assert.equal(receipt.expiresAt.getTime(), end.getTime());
  assert.equal(await prisma.licensePurchase.count(), 3);
  worker(process.env.PLUGIN_SIGNING_KEY_FILE!);
  if (process.env.LICENSE_QA_SESSION_FILE) {
    const admin = await prisma.adminUser.create({
      data: {
        name: "مدیر آزمایشی",
        email: "qa@example.test",
        passwordHash: "disabled",
        role: "admin",
      },
    });
    const adminToken = randomUUID();
    await prisma.session.create({
      data: {
        userId: admin.id,
        tokenHash: createHash("sha256")
          .update(process.env.SESSION_SECRET + ":" + adminToken)
          .digest("hex"),
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    writeFileSync(
      process.env.LICENSE_QA_SESSION_FILE,
      JSON.stringify({ customer: own, admin: adminToken, id: license.id }),
      { mode: 0o600 },
    );
  }
  await prisma.pluginLicense.update({
    where: { id: license.id },
    data: { blocked: "آزمون توقف" },
  });
  assert.equal((await download(own)).status, 404);
  await prisma.pluginLicense.update({
    where: { id: license.id },
    data: { blocked: "" },
  });
  console.log(
    "Local checkout, concurrent mock callbacks, retry, renewal, customer panel and authorized ZIP downloads passed",
  );
}
exercise()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
