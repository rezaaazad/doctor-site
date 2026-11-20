// Pure order math. All amounts are bigint Rial. No database access here so it can be unit-tested.

export type PricingProduct = {
  id: string;
  title: string;
  type: string;
  priceRial: bigint;
  categoryId: string;
  categoryName: string;
  weightGrams: number;
  manageStock: boolean;
  stock: number;
  allowBackorder: boolean;
  maxPerOrder: number;
  published: boolean;
  sku: string;
};

export type PricingVariant = { id: string; title: string; priceRial: bigint; stock: number; active: boolean; sku: string };

export type PricingLineInput = { product: PricingProduct; variant?: PricingVariant | null; quantity: number };

export type PricingCoupon = {
  code: string;
  type: string;
  amount: bigint;
  maxDiscount: bigint | null;
  minSubtotal: bigint;
  usageLimit: number | null;
  usedCount: number;
  productIds: string[];
  categoryIds: string[];
  customerMobile: string;
  startsAt: Date | null;
  expiresAt: Date | null;
  active: boolean;
};

export type PricingShippingMethod = {
  id: string;
  title: string;
  kind: string;
  costRial: bigint;
  perKgRial: bigint;
  freeAbove: bigint | null;
  minDays: number;
  maxDays: number;
};

export type PricingTaxRate = { rateBp: number; provinces: string[]; appliesTo: string };

export type PricingInput = {
  lines: PricingLineInput[];
  coupon?: PricingCoupon | null;
  couponUsesByCustomer?: number;
  couponPerCustomer?: number | null;
  mobile?: string;
  shipping?: PricingShippingMethod | null;
  taxRates?: PricingTaxRate[];
  pricesIncludeTax?: boolean;
  province?: string;
  codFeeRial?: bigint;
  walletBalanceRial?: bigint;
  useWallet?: boolean;
  now?: Date;
};

export type PricedLine = {
  productId: string;
  variantId: string | null;
  title: string;
  variantTitle: string;
  sku: string;
  type: string;
  category: string;
  unitRial: bigint;
  quantity: number;
  totalRial: bigint;
};

export type PricingResult = {
  lines: PricedLine[];
  subtotalRial: bigint;
  discountRial: bigint;
  shippingRial: bigint;
  taxRial: bigint;
  taxIncludedRial: bigint;
  feeRial: bigint;
  walletRial: bigint;
  totalRial: bigint;
  payableRial: bigint;
  needsShipping: boolean;
  freeShipping: boolean;
  couponApplied: string;
  couponError: string;
  errors: string[];
};

const ZERO = BigInt(0);
const big = (n: number) => BigInt(Math.round(n));

export function couponProblem(coupon: PricingCoupon, eligibleSubtotal: bigint, input: PricingInput): string {
  const now = input.now ?? new Date();
  if (!coupon.active) return "این کد تخفیف فعال نیست.";
  if (coupon.startsAt && coupon.startsAt > now) return "زمان استفاده از این کد هنوز نرسیده است.";
  if (coupon.expiresAt && coupon.expiresAt < now) return "مهلت این کد تخفیف تمام شده است.";
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return "ظرفیت این کد تخفیف تمام شده است.";
  if (input.couponPerCustomer && (input.couponUsesByCustomer ?? 0) >= input.couponPerCustomer) return "سهم استفاده شما از این کد تمام شده است.";
  if (coupon.customerMobile && coupon.customerMobile !== (input.mobile ?? "")) return "این کد مخصوص مشتری دیگری است.";
  if (eligibleSubtotal <= ZERO) return "این کد برای محصولات سبد شما نیست.";
  if (coupon.minSubtotal > ZERO && eligibleSubtotal < coupon.minSubtotal) return "مبلغ سبد برای این کد کافی نیست.";
  return "";
}

export function priceOrder(input: PricingInput): PricingResult {
  const errors: string[] = [];
  const lines: PricedLine[] = [];
  for (const line of input.lines) {
    const { product, variant } = line;
    const quantity = Math.max(1, Math.floor(line.quantity));
    if (!product.published) {
      errors.push(`«${product.title}» دیگر فروخته نمی‌شود.`);
      continue;
    }
    if (variant && !variant.active) {
      errors.push(`گزینه انتخابی «${product.title}» موجود نیست.`);
      continue;
    }
    if (product.maxPerOrder > 0 && quantity > product.maxPerOrder) {
      errors.push(`حداکثر ${product.maxPerOrder} عدد از «${product.title}» در هر سفارش.`);
    }
    const available = variant ? variant.stock : product.stock;
    if (product.manageStock && !product.allowBackorder && quantity > available) {
      errors.push(available > 0 ? `از «${product.title}» فقط ${available} عدد موجود است.` : `«${product.title}» ناموجود است.`);
    }
    const unit = variant ? variant.priceRial : product.priceRial;
    lines.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      title: product.title,
      variantTitle: variant?.title ?? "",
      sku: variant?.sku || product.sku,
      type: product.type,
      category: product.categoryName,
      unitRial: unit,
      quantity,
      totalRial: unit * BigInt(quantity),
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.totalRial, ZERO);
  const needsShipping = input.lines.some((line) => line.product.type === "physical");
  const weightGrams = input.lines.reduce((sum, line) => sum + (line.product.type === "physical" ? line.product.weightGrams * line.quantity : 0), 0);

  let discount = ZERO;
  let couponApplied = "";
  let couponError = "";
  let freeShipping = false;
  if (input.coupon) {
    const coupon = input.coupon;
    const restricted = coupon.productIds.length > 0 || coupon.categoryIds.length > 0;
    const eligibleSubtotal = restricted
      ? input.lines.reduce((sum, line, index) => {
          const priced = lines[index];
          if (!priced) return sum;
          const match = coupon.productIds.includes(line.product.id) || coupon.categoryIds.includes(line.product.categoryId);
          return match ? sum + priced.totalRial : sum;
        }, ZERO)
      : subtotal;
    couponError = couponProblem(coupon, eligibleSubtotal, input);
    if (!couponError) {
      couponApplied = coupon.code;
      if (coupon.type === "percent") {
        const pct = coupon.amount > BigInt(100) ? BigInt(100) : coupon.amount;
        discount = (eligibleSubtotal * pct) / BigInt(100);
      } else if (coupon.type === "fixed") {
        discount = coupon.amount;
      } else if (coupon.type === "free_shipping") {
        freeShipping = true;
      }
      if (coupon.maxDiscount !== null && coupon.maxDiscount > ZERO && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
      if (discount > eligibleSubtotal) discount = eligibleSubtotal;
    }
  }

  const afterDiscount = subtotal - discount;
  let shipping = ZERO;
  if (needsShipping) {
    const method = input.shipping;
    if (!method) {
      errors.push("روش ارسال را انتخاب کنید.");
    } else if (!freeShipping) {
      if (method.kind === "free") shipping = ZERO;
      else if (method.kind === "per_kg") shipping = method.costRial + method.perKgRial * big(Math.ceil(weightGrams / 1000));
      else shipping = method.costRial;
      if (method.freeAbove !== null && method.freeAbove > ZERO && afterDiscount >= method.freeAbove) {
        shipping = ZERO;
        freeShipping = true;
      }
    }
  }

  const rates = (input.taxRates ?? []).filter((rate) => rate.provinces.length === 0 || (input.province ? rate.provinces.includes(input.province) : false));
  const bp = rates.reduce((sum, rate) => sum + rate.rateBp, 0);
  let tax = ZERO;
  let taxIncluded = ZERO;
  if (bp > 0) {
    if (input.pricesIncludeTax) taxIncluded = (afterDiscount * BigInt(bp)) / BigInt(10000 + bp);
    else tax = (afterDiscount * BigInt(bp)) / BigInt(10000);
  }

  const fee = input.codFeeRial ?? ZERO;
  const total = afterDiscount + shipping + tax + fee;
  let wallet = ZERO;
  if (input.useWallet && input.walletBalanceRial && input.walletBalanceRial > ZERO) {
    wallet = input.walletBalanceRial > total ? total : input.walletBalanceRial;
  }

  return {
    lines,
    subtotalRial: subtotal,
    discountRial: discount,
    shippingRial: shipping,
    taxRial: tax,
    taxIncludedRial: taxIncluded,
    feeRial: fee,
    walletRial: wallet,
    totalRial: total,
    payableRial: total - wallet,
    needsShipping,
    freeShipping,
    couponApplied,
    couponError,
    errors,
  };
}

export function shippingMethodsForProvince<M>(zones: { provinces: string[]; methods: M[] }[], province: string): M[] {
  const exact = zones.find((zone) => zone.provinces.includes(province));
  if (exact) return exact.methods;
  const rest = zones.find((zone) => zone.provinces.length === 0);
  return rest ? rest.methods : [];
}
