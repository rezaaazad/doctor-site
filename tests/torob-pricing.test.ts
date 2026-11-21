import { generateKeyPairSync, sign } from "crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/options", () => ({ getGroup: async () => ({}) }));

import { TOROB_PUBLIC_KEY, verifyTorobToken } from "@/lib/feeds/torob";
import { priceOrder, shippingMethodsForProvince, type PricingCoupon, type PricingProduct, type PricingShippingMethod } from "@/lib/store/pricing";

const { privateKey, publicKey } = generateKeyPairSync("ed25519");
const pem = publicKey.export({ type: "spki", format: "pem" }).toString();
const b64 = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");

function token(payload: Record<string, unknown>, header: Record<string, unknown> = { alg: "EdDSA", typ: "JWT" }, key = privateKey) {
  const body = `${b64(header)}.${b64(payload)}`;
  return `${body}.${sign(null, Buffer.from(body), key).toString("base64url")}`;
}

const now = Date.UTC(2026, 10, 20, 12);
const exp = Math.floor(now / 1000) + 300;

describe("Torob X-Torob-Token verification", () => {
  it("accepts a valid EdDSA token for our audience", () => {
    expect(verifyTorobToken(token({ aud: "doctor-site.ir", exp }), "doctor-site.ir", { publicKey: pem, now })).toEqual({ ok: true });
    expect(verifyTorobToken(token({ aud: ["x.ir", "doctor-site.ir"], exp }), "doctor-site.ir", { publicKey: pem, now }).ok).toBe(true);
  });

  it("rejects a token signed by another key", () => {
    const other = generateKeyPairSync("ed25519").privateKey;
    expect(verifyTorobToken(token({ aud: "doctor-site.ir", exp }, undefined, other), "doctor-site.ir", { publicKey: pem, now })).toEqual({ ok: false, reason: "bad signature" });
  });

  it("rejects a tampered payload", () => {
    const [h, , s] = token({ aud: "doctor-site.ir", exp }).split(".");
    const forged = `${h}.${b64({ aud: "doctor-site.ir", exp: exp + 99999 })}.${s}`;
    expect(verifyTorobToken(forged, "doctor-site.ir", { publicKey: pem, now }).ok).toBe(false);
  });

  it("rejects expired, not-yet-valid, wrong audience, wrong alg and malformed tokens", () => {
    expect(verifyTorobToken(token({ aud: "doctor-site.ir", exp: exp - 600 }), "doctor-site.ir", { publicKey: pem, now })).toMatchObject({ reason: "expired" });
    expect(verifyTorobToken(token({ aud: "doctor-site.ir", exp, nbf: exp }), "doctor-site.ir", { publicKey: pem, now })).toMatchObject({ reason: "not yet valid" });
    expect(verifyTorobToken(token({ aud: "other.ir", exp }), "doctor-site.ir", { publicKey: pem, now })).toMatchObject({ reason: "audience mismatch" });
    expect(verifyTorobToken(token({ aud: "doctor-site.ir", exp }, { alg: "none" }), "doctor-site.ir", { publicKey: pem, now })).toMatchObject({ reason: "unexpected alg" });
    expect(verifyTorobToken("abc", "doctor-site.ir", { publicKey: pem, now }).ok).toBe(false);
  });

  it("uses Torob's published key by default, so our own tokens fail", () => {
    expect(TOROB_PUBLIC_KEY).toContain("BEGIN PUBLIC KEY");
    expect(verifyTorobToken(token({ aud: "doctor-site.ir", exp }), "doctor-site.ir", { now }).ok).toBe(false);
  });
});

const product = (patch: Partial<PricingProduct> = {}): PricingProduct => ({
  id: "p1",
  title: "قالب فروشگاهی",
  type: "digital",
  priceRial: BigInt(10_000_000),
  categoryId: "c1",
  categoryName: "قالب",
  weightGrams: 0,
  manageStock: false,
  stock: 0,
  allowBackorder: false,
  maxPerOrder: 0,
  published: true,
  sku: "SKU1",
  ...patch,
});

const coupon = (patch: Partial<PricingCoupon> = {}): PricingCoupon => ({
  code: "WELCOME10",
  type: "percent",
  amount: BigInt(10),
  maxDiscount: null,
  minSubtotal: BigInt(0),
  usageLimit: null,
  usedCount: 0,
  productIds: [],
  categoryIds: [],
  customerMobile: "",
  startsAt: null,
  expiresAt: null,
  active: true,
  ...patch,
});

const post: PricingShippingMethod = { id: "s1", title: "پست", kind: "flat", costRial: BigInt(650_000), perKgRial: BigInt(0), freeAbove: BigInt(20_000_000), minDays: 2, maxDays: 4 };

describe("pricing engine", () => {
  it("digital orders need no shipping and apply a percent coupon with a cap", () => {
    const r = priceOrder({ lines: [{ product: product(), quantity: 2 }], coupon: coupon({ maxDiscount: BigInt(1_500_000) }) });
    expect(r.needsShipping).toBe(false);
    expect(r.subtotalRial).toBe(BigInt(20_000_000));
    expect(r.discountRial).toBe(BigInt(1_500_000));
    expect(r.totalRial).toBe(BigInt(18_500_000));
    expect(r.errors).toEqual([]);
  });

  it("physical orders require a method and get free shipping above the threshold", () => {
    const card = product({ id: "p2", type: "physical", weightGrams: 120, priceRial: BigInt(4_000_000) });
    expect(priceOrder({ lines: [{ product: card, quantity: 1 }] }).errors).toContain("روش ارسال را انتخاب کنید.");
    expect(priceOrder({ lines: [{ product: card, quantity: 1 }], shipping: post }).shippingRial).toBe(BigInt(650_000));
    const big = priceOrder({ lines: [{ product: card, quantity: 5 }], shipping: post });
    expect(big.shippingRial).toBe(BigInt(0));
    expect(big.freeShipping).toBe(true);
  });

  it("reports stock and coupon problems", () => {
    const limited = product({ manageStock: true, stock: 1 });
    expect(priceOrder({ lines: [{ product: limited, quantity: 3 }] }).errors[0]).toContain("فقط 1 عدد");
    const expired = priceOrder({ lines: [{ product: product(), quantity: 1 }], coupon: coupon({ expiresAt: new Date(now - 1000) }), now: new Date(now) });
    expect(expired.discountRial).toBe(BigInt(0));
    expect(expired.couponError).toContain("مهلت");
  });

  it("caps wallet usage at the order total", () => {
    const r = priceOrder({ lines: [{ product: product(), quantity: 1 }], useWallet: true, walletBalanceRial: BigInt(50_000_000) });
    expect(r.walletRial).toBe(BigInt(10_000_000));
    expect(r.payableRial).toBe(BigInt(0));
  });

  it("picks the shipping zone for a province, falling back to the catch-all zone", () => {
    const zones = [{ provinces: ["تهران"], methods: ["courier"] }, { provinces: [], methods: ["post"] }];
    expect(shippingMethodsForProvince(zones, "تهران")).toEqual(["courier"]);
    expect(shippingMethodsForProvince(zones, "فارس")).toEqual(["post"]);
  });
});
