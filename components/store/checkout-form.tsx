"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, MapPin, Wallet } from "lucide-react";
import { useCart, type CartLine } from "@/components/store/cart";
import { ProductImage } from "@/components/store/product-card";
import { Price } from "@/components/ui/price";
import { formatToman, formatNumber } from "@/lib/money";
import { PROVINCES } from "@/lib/iran";
import { placeOrderAction, quoteAction, type Quote } from "@/lib/actions/shop";
import type { GatewayOption } from "@/lib/payments";
import type { CartLineView } from "@/lib/store/checkout";
import type { ShippingOption } from "@/lib/store/checkout";
import { cn } from "@/lib/utils";

type Props = {
  signedIn: boolean;
  customer?: { name: string; mobile: string; email: string; walletRial: number } | null;
  guestCheckout: boolean;
  termsUrl: string;
};

export function CheckoutForm({ signedIn, customer, guestCheckout, termsUrl }: Props) {
  const { lines, ready, clear } = useCart();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const [name, setName] = useState(customer?.name ?? "");
  const [mobile, setMobile] = useState(customer?.mobile ?? "");
  const [email, setEmail] = useState(customer?.email ?? "");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [note, setNote] = useState("");
  const [coupon, setCoupon] = useState("");
  const [shippingId, setShippingId] = useState("");
  const [gateway, setGateway] = useState("");
  const [useWallet, setUseWallet] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const payload = useMemo(
    () => ({ lines, couponCode: coupon, province, shippingId, gateway, useWallet, mobile, withGateways: true }),
    [lines, coupon, province, shippingId, gateway, useWallet, mobile],
  );

  useEffect(() => {
    if (!ready || !lines.length) return;
    let cancelled = false;
    setLoading(true);
    quoteAction(payload).then((q) => {
      if (cancelled) return;
      setQuote(q);
      if (!shippingId && q.shippingId) setShippingId(q.shippingId);
      if (!gateway && q.gateways[0]) setGateway(q.gateways[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [payload, ready, lines.length, shippingId, gateway]);

  if (!ready) {
    return <p className="text-muted">در حال آماده‌سازی سبد…</p>;
  }
  if (!lines.length) {
    return (
      <div className="card p-8 text-center">
        <p className="font-bold">سبد خرید شما خالی است.</p>
        <Link href="/store" className="btn btn-action mt-4">
          رفتن به فروشگاه
        </Link>
      </div>
    );
  }
  if (!signedIn && !guestCheckout) {
    return (
      <div className="card p-8 text-center">
        <p className="font-bold">برای تکمیل خرید وارد حساب کاربری شوید.</p>
        <Link href={`/account/login?next=${encodeURIComponent("/checkout")}`} className="btn btn-action mt-4">
          ورود با پیامک
        </Link>
      </div>
    );
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    start(async () => {
      const result = await placeOrderAction({
        ...payload,
        gateway,
        name,
        mobile,
        email,
        city,
        addressLine,
        postalCode,
        note,
        acceptTerms,
        saveAddress: signedIn,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      clear();
      window.location.href = result.redirect;
    });
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="grid gap-5">
        <section className="card p-4 md:p-5">
          <h2 className="mb-4 font-display text-[1.1rem] font-extrabold">اطلاعات تماس</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 text-[0.82rem] font-semibold md:col-span-2">
              نام و نام خانوادگی *
              <input value={name} onChange={(e) => setName(e.target.value)} required className="field text-base" autoComplete="name" />
            </label>
            <label className="grid gap-1.5 text-[0.82rem] font-semibold">
              موبایل *
              <input value={mobile} onChange={(e) => setMobile(e.target.value)} required className="field text-base" dir="ltr" autoComplete="tel" inputMode="tel" />
            </label>
            <label className="grid gap-1.5 text-[0.82rem] font-semibold">
              ایمیل (اختیاری)
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="field text-base" dir="ltr" autoComplete="email" type="email" />
            </label>
          </div>
        </section>

        {quote?.needsShipping ? (
          <section className="card p-4 md:p-5">
            <h2 className="mb-4 flex items-center gap-2 font-display text-[1.1rem] font-extrabold">
              <MapPin className="size-4 text-primary" aria-hidden /> آدرس ارسال
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5 text-[0.82rem] font-semibold">
                استان *
                <select value={province} onChange={(e) => setProvince(e.target.value)} required className="field">
                  <option value="">انتخاب استان</option>
                  {PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-[0.82rem] font-semibold">
                شهر *
                <input value={city} onChange={(e) => setCity(e.target.value)} required className="field text-base" />
              </label>
              <label className="grid gap-1.5 text-[0.82rem] font-semibold md:col-span-2">
                آدرس کامل *
                <textarea value={addressLine} onChange={(e) => setAddressLine(e.target.value)} required rows={3} className="field text-base" />
              </label>
              <label className="grid gap-1.5 text-[0.82rem] font-semibold">
                کد پستی
                <input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="field text-base" dir="ltr" inputMode="numeric" />
              </label>
            </div>
          </section>
        ) : null}

        <section className="card p-4 md:p-5">
          <h2 className="mb-4 font-display text-[1.1rem] font-extrabold">روش ارسال و پرداخت</h2>
          {quote?.shippingOptions.length ? (
            <div className="mb-4 grid gap-2">
              {quote.shippingOptions.map((s: ShippingOption) => (
                <label key={s.id} className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-3", shippingId === s.id ? "border-primary bg-primary-soft" : "border-line")}>
                  <span className="flex items-center gap-2 text-[0.88rem]">
                    <input type="radio" name="shipping" checked={shippingId === s.id} onChange={() => setShippingId(s.id)} />
                    {s.title}
                    <span className="text-[0.78rem] text-muted">({formatNumber(s.minDays)}–{formatNumber(s.maxDays)} روز کاری)</span>
                  </span>
                  <span className="num text-[0.85rem] font-bold">{s.cost <= 0 ? "رایگان" : formatToman(s.cost)}</span>
                </label>
              ))}
            </div>
          ) : null}
          <div className="grid gap-2">
            {quote?.gateways.map((g: GatewayOption) => (
              <label key={g.id} className={cn("flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3", gateway === g.id ? "border-primary bg-primary-soft" : "border-line")}>
                <input type="radio" name="gateway" className="mt-1" checked={gateway === g.id} onChange={() => setGateway(g.id)} />
                <span>
                  <b className="block text-[0.9rem]">{g.title}</b>
                  <span className="text-[0.78rem] text-muted">{g.description}</span>
                </span>
              </label>
            ))}
          </div>
          {customer && Number(customer.walletRial) > 0 ? (
            <label className="mt-4 flex items-center gap-2 text-[0.85rem] font-semibold">
              <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} />
              <Wallet className="size-4 text-primary" aria-hidden />
              استفاده از کیف پول ({formatToman(customer.walletRial)})
            </label>
          ) : null}
          <label className="mt-4 grid gap-1.5 text-[0.82rem] font-semibold">
            کد تخفیف
            <div className="flex gap-2">
              <input value={coupon} onChange={(e) => setCoupon(e.target.value)} className="field flex-1 text-base uppercase" dir="ltr" placeholder="WELCOME10" />
            </div>
          </label>
          <label className="mt-3 grid gap-1.5 text-[0.82rem] font-semibold">
            یادداشت سفارش
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="field" />
          </label>
        </section>
      </div>

      <aside className="grid h-fit gap-4">
        <section className="card p-4 md:p-5">
          <h2 className="mb-3 font-bold">خلاصه سفارش</h2>
          <ul className="mb-4 divide-y divide-line">
            {(quote?.lines ?? lines.map(lineItem)).map((line: CartLineView | ReturnType<typeof lineItem>) => (
              <li key={line.key ?? `${line.productId}:${line.variantId}`} className="flex gap-3 py-3">
                <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-sunken">
                  <ProductImage product={{ image: line.image, slug: line.slug, title: line.title, type: "digital" }} className="size-full" sizes="56px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[0.82rem] font-bold">{line.title}</p>
                  {line.variantTitle ? <p className="text-[0.75rem] text-muted">{line.variantTitle}</p> : null}
                  <p className="mt-1 text-[0.78rem] text-muted">× {formatNumber(line.quantity)}</p>
                </div>
                <Price value={lineTotal(line)} showPercent={false} size="sm" />
              </li>
            ))}
          </ul>
          {loading && !quote ? (
            <p className="flex items-center gap-2 text-muted">
              <Loader2 className="size-4 animate-spin" /> محاسبه…
            </p>
          ) : quote ? (
            <dl className="space-y-2 text-[0.85rem]">
              <Row label="جمع کالا" value={formatToman(quote.subtotal)} />
              {quote.discount > 0 ? <Row label="تخفیف" value={`- ${formatToman(quote.discount)}`} accent /> : null}
              {quote.needsShipping ? <Row label="ارسال" value={quote.shipping <= 0 ? "رایگان" : formatToman(quote.shipping)} /> : null}
              {quote.tax > 0 ? <Row label="مالیات" value={formatToman(quote.tax)} /> : null}
              {quote.wallet > 0 ? <Row label="کیف پول" value={`- ${formatToman(quote.wallet)}`} /> : null}
              <Row label="مبلغ قابل پرداخت" value={formatToman(quote.payable)} bold />
            </dl>
          ) : null}
          {quote?.couponError ? <p className="mt-2 text-[0.8rem] text-urgency">{quote.couponError}</p> : null}
          {quote?.errors.map((e: string) => (
            <p key={e} className="mt-1 text-[0.8rem] text-urgency">{e}</p>
          ))}
          <label className="mt-4 flex items-start gap-2 text-[0.8rem]">
            <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-0.5" />
            <span>
              <a href={termsUrl} className="text-primary hover:underline" target="_blank" rel="noopener">
                قوانین خرید
              </a>{" "}
              را خوانده‌ام و می‌پذیرم.
            </span>
          </label>
          {error ? <p className="mt-2 text-[0.85rem] font-bold text-urgency">{error}</p> : null}
          <button type="submit" disabled={pending || loading || !quote || !!quote.errors.length} className="btn btn-action btn-lg mt-4 w-full">
            {pending ? "در حال انتقال به درگاه…" : "پرداخت و ثبت سفارش"}
          </button>
        </section>
      </aside>
    </form>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-3", bold && "border-t border-line pt-2 text-[0.95rem] font-extrabold")}>
      <dt className={accent ? "text-success" : "text-muted"}>{label}</dt>
      <dd className="num">{value}</dd>
    </div>
  );
}

function lineItem(line: CartLine) {
  return {
    key: `${line.productId}:${line.variantId ?? ""}`,
    productId: line.productId,
    variantId: line.variantId,
    slug: line.slug,
    title: line.title,
    variantTitle: line.variantTitle,
    image: line.image,
    quantity: line.quantity,
    price: line.price,
    total: line.price * line.quantity,
  };
}

function lineTotal(line: CartLineView | ReturnType<typeof lineItem>) {
  if ("total" in line && typeof line.total === "number") return line.total;
  const unit = "unit" in line ? line.unit : line.price;
  return unit * line.quantity;
}
