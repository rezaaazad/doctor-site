// Zarinpal payment gateway v4 (https://www.zarinpal.com/docs/paymentGateway/). Amounts in Rial.

import { UpstreamError, fetchWithTimeout, readJson } from "@/lib/http";
import { asObject } from "@/lib/utils";

export type ZarinpalConfig = { merchantId: string; sandbox: boolean };
type FetchLike = typeof fetchWithTimeout;

export function zarinpalHost(sandbox: boolean) {
  return sandbox ? "https://sandbox.zarinpal.com" : "https://payment.zarinpal.com";
}

export function zarinpalStartUrl(sandbox: boolean, authority: string) {
  return `${zarinpalHost(sandbox)}/pg/StartPay/${encodeURIComponent(authority)}`;
}

function firstError(json: Record<string, unknown>) {
  const errors = json.errors;
  if (errors && typeof errors === "object" && !Array.isArray(errors)) {
    const e = errors as Record<string, unknown>;
    return { code: Number(e.code ?? 0), message: String(e.message ?? "") };
  }
  return null;
}

export const ZARINPAL_MESSAGES: Record<number, string> = {
  [-9]: "اطلاعات ارسالی به درگاه نامعتبر است.",
  [-10]: "IP یا مرچنت کد پذیرنده صحیح نیست.",
  [-11]: "مرچنت کد فعال نیست.",
  [-50]: "مبلغ پرداخت‌شده با مبلغ سفارش یکسان نیست.",
  [-51]: "پرداخت ناموفق بود.",
  [-54]: "شناسه پرداخت نامعتبر است.",
  [-55]: "تراکنش پیدا نشد.",
};

export class ZarinpalClient {
  constructor(
    private config: ZarinpalConfig,
    private http: FetchLike = fetchWithTimeout,
  ) {}

  private async post(path: string, payload: unknown) {
    if (!this.config.merchantId) throw new UpstreamError("مرچنت کد زرین‌پال تنظیم نشده است.");
    const response = await this.http(`${zarinpalHost(this.config.sandbox)}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    return { response, json: asObject(await readJson(response)) };
  }

  async request(input: { amountRial: number; callbackUrl: string; description: string; mobile?: string; email?: string; orderId?: string }) {
    const { response, json } = await this.post("/pg/v4/payment/request.json", {
      merchant_id: this.config.merchantId,
      amount: Math.round(input.amountRial),
      currency: "IRR",
      callback_url: input.callbackUrl,
      description: input.description.slice(0, 250),
      metadata: { mobile: input.mobile || undefined, email: input.email || undefined, order_id: input.orderId },
    });
    const data = asObject(json.data);
    if (Number(data.code) === 100 && typeof data.authority === "string") {
      return { authority: data.authority, url: zarinpalStartUrl(this.config.sandbox, data.authority), raw: json };
    }
    const err = firstError(json);
    throw new UpstreamError(ZARINPAL_MESSAGES[err?.code ?? 0] || err?.message || "ایجاد تراکنش زرین‌پال ناموفق بود.", response.status, json);
  }

  /** code 100 = verified now, 101 = already verified earlier. Both mean the money was received. */
  async verify(input: { amountRial: number; authority: string }) {
    const { json } = await this.post("/pg/v4/payment/verify.json", {
      merchant_id: this.config.merchantId,
      amount: Math.round(input.amountRial),
      authority: input.authority,
    });
    const data = asObject(json.data);
    const code = Number(data.code ?? firstError(json)?.code ?? 0);
    if (code === 100 || code === 101) {
      return { ok: true as const, code, refId: String(data.ref_id ?? ""), cardPan: String(data.card_pan ?? ""), raw: json };
    }
    return { ok: false as const, code, message: ZARINPAL_MESSAGES[code] || firstError(json)?.message || "تأیید پرداخت ناموفق بود.", raw: json };
  }
}
