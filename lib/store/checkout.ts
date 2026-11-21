import type { Customer } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGroup } from "@/lib/options";
import { normalizeMobile } from "@/lib/money";
import { PROVINCES } from "@/lib/iran";
import { RequestError, asStringArray } from "@/lib/utils";
import { availableGateways, type GatewayId, type GatewayOption } from "@/lib/payments";
import { newAccessKey } from "@/lib/store/orders";
import { priceOrder, shippingMethodsForProvince, type PricingCoupon, type PricingLineInput, type PricingResult, type PricingShippingMethod } from "@/lib/store/pricing";

export type CartLineInput = { productId: string; variantId?: string | null; quantity: number };

export type CartLineView = {
  key: string;
  productId: string;
  variantId: string | null;
  slug: string;
  title: string;
  variantTitle: string;
  image: string;
  type: string;
  unit: number;
  compareAt: number;
  quantity: number;
  total: number;
  maxQuantity: number;
};

export type ShippingOption = { id: string; title: string; cost: number; minDays: number; maxDays: number; kind: string; freeAbove: number };

export type Quote = {
  lines: CartLineView[];
  missing: string[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  taxIncluded: number;
  fee: number;
  wallet: number;
  total: number;
  payable: number;
  needsShipping: boolean;
  freeShipping: boolean;
  coupon: string;
  couponError: string;
  errors: string[];
  shippingOptions: ShippingOption[];
  shippingId: string;
  gateways: GatewayOption[];
  walletBalance: number;
  freeShippingRemaining: number;
};

export function sanitizeLines(raw: unknown): CartLineInput[] {
  if (!Array.isArray(raw)) return [];
  const map = new Map<string, CartLineInput>();
  for (const item of raw.slice(0, 50)) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const productId = typeof row.productId === "string" ? row.productId.slice(0, 40) : "";
    const variantId = typeof row.variantId === "string" && row.variantId ? row.variantId.slice(0, 40) : null;
    const quantity = Math.min(99, Math.max(1, Math.floor(Number(row.quantity) || 1)));
    if (!productId) continue;
    const key = `${productId}:${variantId ?? ""}`;
    const prev = map.get(key);
    map.set(key, { productId, variantId, quantity: Math.min(99, (prev?.quantity ?? 0) + quantity) });
  }
  return [...map.values()];
}

async function loadLines(inputs: CartLineInput[]) {
  const products = await prisma.storeProduct.findMany({
    where: { id: { in: inputs.map((line) => line.productId) } },
    include: { category: { select: { name: true } }, variants: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: (PricingLineInput & { view: Omit<CartLineView, "unit" | "total" | "quantity"> })[] = [];
  const missing: string[] = [];
  for (const input of inputs) {
    const product = byId.get(input.productId);
    if (!product || !product.published) {
      missing.push(input.productId);
      continue;
    }
    const activeVariants = product.variants.filter((v) => v.active);
    const variant = input.variantId ? product.variants.find((v) => v.id === input.variantId) ?? null : null;
    if (input.variantId && !variant) {
      missing.push(input.productId);
      continue;
    }
    if (!variant && activeVariants.length > 0) {
      missing.push(input.productId);
      continue;
    }
    const images = asStringArray(product.images);
    const stock = variant ? variant.stock : product.stock;
    const cap = product.manageStock && !product.allowBackorder ? Math.max(0, stock) : 99;
    lines.push({
      product: {
        id: product.id,
        title: product.title,
        type: product.type,
        priceRial: product.priceRial,
        categoryId: product.categoryId,
        categoryName: product.category.name,
        weightGrams: product.weightGrams,
        manageStock: product.manageStock,
        stock: product.stock,
        allowBackorder: product.allowBackorder,
        maxPerOrder: product.maxPerOrder,
        published: product.published,
        sku: product.sku,
      },
      variant: variant ? { id: variant.id, title: variant.title, priceRial: variant.priceRial, stock: variant.stock, active: variant.active, sku: variant.sku } : null,
      quantity: input.quantity,
      view: {
        key: `${product.id}:${variant?.id ?? ""}`,
        productId: product.id,
        variantId: variant?.id ?? null,
        slug: product.slug,
        title: product.title,
        variantTitle: variant?.title ?? "",
        image: variant?.imageUrl || images[0] || "",
        type: product.type,
        compareAt: Number((variant ? variant.compareAtRial : product.compareAtRial) ?? 0),
        maxQuantity: Math.min(product.maxPerOrder > 0 ? product.maxPerOrder : 99, cap),
      },
    });
  }
  return { lines, missing };
}

async function loadCoupon(code: string): Promise<(PricingCoupon & { perCustomer: number | null }) | null> {
  const clean = code.trim().toUpperCase().slice(0, 40);
  if (!clean) return null;
  const coupon = await prisma.coupon.findFirst({ where: { code: { equals: clean, mode: "insensitive" } } });
  if (!coupon) return null;
  return {
    code: coupon.code,
    type: coupon.type,
    amount: coupon.amount,
    maxDiscount: coupon.maxDiscount,
    minSubtotal: coupon.minSubtotal,
    usageLimit: coupon.usageLimit,
    usedCount: coupon.usedCount,
    productIds: asStringArray(coupon.productIds),
    categoryIds: asStringArray(coupon.categoryIds),
    customerMobile: coupon.customerMobile,
    startsAt: coupon.startsAt,
    expiresAt: coupon.expiresAt,
    active: coupon.active,
    perCustomer: coupon.perCustomer,
  };
}

async function shippingFor(province: string): Promise<PricingShippingMethod[]> {
  const zones = await prisma.shippingZone.findMany({
    orderBy: { sortOrder: "asc" },
    include: { methods: { where: { active: true }, orderBy: { sortOrder: "asc" } } },
  });
  const shaped = zones.map((zone) => ({ provinces: asStringArray(zone.provinces), methods: zone.methods }));
  return shippingMethodsForProvince(shaped, province).map((m) => ({
    id: m.id,
    title: m.title,
    kind: m.kind,
    costRial: m.costRial,
    perKgRial: m.perKgRial,
    freeAbove: m.freeAbove,
    minDays: m.minDays,
    maxDays: m.maxDays,
  }));
}

export type QuoteInput = {
  lines: CartLineInput[];
  couponCode?: string;
  province?: string;
  shippingId?: string;
  gateway?: string;
  useWallet?: boolean;
  mobile?: string;
  customer?: Pick<Customer, "id" | "mobile" | "walletRial"> | null;
  withGateways?: boolean;
};

export async function computeQuote(input: QuoteInput): Promise<{ quote: Quote; pricing: PricingResult; shipping: PricingShippingMethod | null }> {
  const [store, codCfg, { lines, missing }] = await Promise.all([getGroup("store"), getGroup("pay_cod"), loadLines(input.lines)]);
  const province = input.province && (PROVINCES as readonly string[]).includes(input.province) ? input.province : "";
  const needsShipping = lines.some((line) => line.product.type === "physical");
  const methods = needsShipping ? await shippingFor(province || "تهران") : [];
  const shipping = methods.find((m) => m.id === input.shippingId) ?? methods[0] ?? null;
  const coupon = input.couponCode ? await loadCoupon(input.couponCode) : null;
  const mobile = normalizeMobile(input.mobile || input.customer?.mobile || "");
  const couponUses = coupon?.perCustomer && mobile
    ? await prisma.order.count({ where: { couponCode: coupon.code, mobile, paymentStatus: { not: "unpaid" } } })
    : 0;
  const taxRates = await prisma.taxRate.findMany({ where: { active: true } });
  const codFee = input.gateway === "cod" ? BigInt((Number(codCfg.feeToman) || 0) * 10) : BigInt(0);
  const walletEnabled = Boolean(store.walletEnabled);

  const pricing = priceOrder({
    lines,
    coupon,
    couponPerCustomer: coupon?.perCustomer ?? null,
    couponUsesByCustomer: couponUses,
    mobile,
    shipping,
    taxRates: taxRates.map((t) => ({ rateBp: t.rateBp, provinces: asStringArray(t.provinces), appliesTo: t.appliesTo })),
    pricesIncludeTax: Boolean(store.pricesIncludeTax),
    province,
    codFeeRial: codFee,
    walletBalanceRial: walletEnabled ? input.customer?.walletRial ?? BigInt(0) : BigInt(0),
    useWallet: walletEnabled && input.useWallet,
  });

  if (input.couponCode && !coupon) pricing.couponError = "این کد تخفیف پیدا نشد.";
  const minOrder = BigInt((Number(store.minOrderToman) || 0) * 10);
  if (minOrder > BigInt(0) && pricing.subtotalRial < minOrder && lines.length) pricing.errors.push(`حداقل مبلغ سفارش ${Number(store.minOrderToman).toLocaleString("fa-IR")} تومان است.`);

  const gateways = input.withGateways ? await availableGateways({ payableRial: pricing.payableRial, needsShipping, province }) : [];
  const freeAbove = BigInt((Number(store.freeShippingAboveToman) || 0) * 10);
  const after = pricing.subtotalRial - pricing.discountRial;

  const quote: Quote = {
    lines: lines.map((line, index) => {
      const priced = pricing.lines[index];
      return { ...line.view, unit: Number(priced?.unitRial ?? 0), quantity: priced?.quantity ?? line.quantity, total: Number(priced?.totalRial ?? 0) };
    }),
    missing,
    subtotal: Number(pricing.subtotalRial),
    discount: Number(pricing.discountRial),
    shipping: Number(pricing.shippingRial),
    tax: Number(pricing.taxRial),
    taxIncluded: Number(pricing.taxIncludedRial),
    fee: Number(pricing.feeRial),
    wallet: Number(pricing.walletRial),
    total: Number(pricing.totalRial),
    payable: Number(pricing.payableRial),
    needsShipping,
    freeShipping: pricing.freeShipping,
    coupon: pricing.couponApplied,
    couponError: pricing.couponError,
    errors: pricing.errors,
    shippingOptions: methods.map((m) => ({
      id: m.id,
      title: m.title,
      cost: Number(m.kind === "free" ? BigInt(0) : m.costRial),
      minDays: m.minDays,
      maxDays: m.maxDays,
      kind: m.kind,
      freeAbove: Number(m.freeAbove ?? 0),
    })),
    shippingId: shipping?.id ?? "",
    gateways,
    walletBalance: walletEnabled ? Number(input.customer?.walletRial ?? 0) : 0,
    freeShippingRemaining: needsShipping && freeAbove > BigInt(0) && after < freeAbove ? Number(freeAbove - after) : 0,
  };
  return { quote, pricing, shipping };
}

export type PlaceOrderInput = QuoteInput & {
  gateway: GatewayId;
  name: string;
  mobile: string;
  email?: string;
  city?: string;
  addressLine?: string;
  postalCode?: string;
  note?: string;
  ip: string;
};

export async function createOrder(input: PlaceOrderInput) {
  const store = await getGroup("store");
  if (!store.enabled) throw new RequestError("فروشگاه موقتاً بسته است.");
  const mobile = normalizeMobile(input.mobile);
  if (!mobile) throw new RequestError("شماره موبایل معتبر نیست.");
  if (!input.customer && !store.guestCheckout) throw new RequestError("برای خرید ابتدا وارد حساب کاربری شوید.");
  const { quote, pricing, shipping } = await computeQuote({ ...input, mobile, withGateways: true });
  if (!quote.lines.length) throw new RequestError("سبد خرید خالی است.");
  if (quote.missing.length) throw new RequestError("بعضی از کالاهای سبد دیگر موجود نیستند. سبد را بازبینی کنید.");
  if (pricing.errors.length) throw new RequestError(pricing.errors[0]);
  if (input.couponCode && pricing.couponError) throw new RequestError(pricing.couponError);
  const hasDigital = quote.lines.some((line) => line.type === "digital");
  if (hasDigital && store.requireLoginForDigital && !input.customer) throw new RequestError("برای خرید محصول دیجیتال وارد حساب شوید تا فایل‌ها همیشه در دسترس باشند.");
  if (quote.needsShipping) {
    if (!input.province || !input.city?.trim() || (input.addressLine?.trim().length ?? 0) < 8) throw new RequestError("نشانی کامل ارسال را وارد کنید.");
    if (input.postalCode && !/^\d{10}$/.test(input.postalCode)) throw new RequestError("کد پستی باید ۱۰ رقم باشد.");
  }
  if (pricing.payableRial > BigInt(0) && !quote.gateways.some((g) => g.id === input.gateway)) throw new RequestError("روش پرداخت انتخاب‌شده در دسترس نیست.");

  const order = await prisma.order.create({
    data: {
      accessKey: newAccessKey(),
      customerId: input.customer?.id ?? null,
      status: "pending",
      paymentStatus: "unpaid",
      gateway: pricing.payableRial > BigInt(0) ? input.gateway : "free",
      subtotalRial: pricing.subtotalRial,
      discountRial: pricing.discountRial,
      shippingRial: pricing.shippingRial,
      taxRial: pricing.taxRial,
      feeRial: pricing.feeRial,
      walletRial: pricing.walletRial,
      totalRial: pricing.totalRial,
      couponCode: pricing.couponApplied,
      shippingTitle: quote.needsShipping ? shipping?.title ?? "" : "",
      shippingMethod: quote.needsShipping ? shipping?.id ?? "" : "",
      needsShipping: quote.needsShipping,
      name: input.name.trim().slice(0, 120),
      mobile,
      email: (input.email ?? "").trim().slice(0, 160),
      province: quote.needsShipping ? input.province ?? "" : "",
      city: quote.needsShipping ? (input.city ?? "").trim().slice(0, 80) : "",
      addressLine: quote.needsShipping ? (input.addressLine ?? "").trim().slice(0, 500) : "",
      postalCode: quote.needsShipping ? input.postalCode ?? "" : "",
      customerNote: (input.note ?? "").trim().slice(0, 1000),
      ip: input.ip,
      items: {
        create: pricing.lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          title: line.title,
          variantTitle: line.variantTitle,
          sku: line.sku,
          type: line.type,
          category: line.category,
          unitRial: line.unitRial,
          quantity: line.quantity,
          totalRial: line.totalRial,
        })),
      },
      notes: { create: { body: "سفارش ثبت شد.", system: true, authorName: "سیستم" } },
    },
  });
  if (input.customer && !input.customer.mobile) await prisma.customer.update({ where: { id: input.customer.id }, data: { mobile } });
  return order;
}
