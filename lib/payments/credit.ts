// Client for the Snapp Pay "online purchase" API and Torob Pay CPG, which share the same contract:
// OAuth password grant -> eligible -> payment token -> redirect -> callback -> verify -> settle
// (+ status, revert, cancel, update). Amounts are always Rial.

import { UpstreamError, fetchWithTimeout, joinUrl, readJson } from "@/lib/http";
import { asObject } from "@/lib/utils";

export type CreditGatewayId = "snapppay" | "torobpay";

export type CreditConfig = {
  gateway: CreditGatewayId;
  mode: "live" | "stage" | "mock";
  baseUrl: string;
  stageBaseUrl: string;
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  commissionType?: string;
};

export type CreditCartItem = { id: number; name: string; category: string; amount: number; count: number; commissionType?: number };

export type CreditTokenRequest = {
  amount: number;
  discountAmount: number;
  externalSourceAmount: number;
  mobile: string;
  returnURL: string;
  transactionId: string;
  postalCode?: string;
  cart: { id: number; items: CreditCartItem[]; shippingAmount: number; taxAmount: number };
};

type FetchLike = typeof fetchWithTimeout;

const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export function creditMobile(mobile: string) {
  const digits = mobile.replace(/\D/g, "");
  if (digits.startsWith("98")) return `+${digits}`;
  if (digits.startsWith("0")) return `+98${digits.slice(1)}`;
  return `+98${digits}`;
}

export function buildCartList(request: CreditTokenRequest) {
  const itemsTotal = request.cart.items.reduce((sum, item) => sum + item.amount * item.count, 0);
  return [
    {
      cartId: request.cart.id,
      cartItems: request.cart.items.map((item) => ({
        id: item.id,
        name: item.name.slice(0, 120),
        category: item.category.slice(0, 60) || "عمومی",
        amount: item.amount,
        count: item.count,
        ...(item.commissionType ? { commissionType: item.commissionType } : {}),
      })),
      isShipmentIncluded: true,
      isTaxIncluded: true,
      shippingAmount: request.cart.shippingAmount,
      taxAmount: request.cart.taxAmount,
      totalAmount: itemsTotal + request.cart.shippingAmount + request.cart.taxAmount,
    },
  ];
}

export class CreditClient {
  constructor(
    private config: CreditConfig,
    private http: FetchLike = fetchWithTimeout,
  ) {}

  get isMock() {
    return this.config.mode === "mock";
  }

  private base() {
    const base = this.config.mode === "live" ? this.config.baseUrl : this.config.stageBaseUrl || this.config.baseUrl;
    if (!base) throw new UpstreamError("آدرس پایه درگاه تنظیم نشده است.");
    return base;
  }

  private cacheKey() {
    return `${this.config.gateway}:${this.config.mode}:${this.config.clientId}:${this.config.username}`;
  }

  async accessToken(force = false) {
    const key = this.cacheKey();
    const cached = tokenCache.get(key);
    if (!force && cached && cached.expiresAt > Date.now() + 30_000) return cached.token;
    const { clientId, clientSecret, username, password } = this.config;
    if (!clientId || !clientSecret || !username || !password) throw new UpstreamError("اطلاعات احراز هویت درگاه کامل نیست.");
    const body = new URLSearchParams({ grant_type: "password", scope: "online-merchant", username, password });
    const response = await this.http(joinUrl(this.base(), "api/online/v1/oauth/token"), {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    });
    const json = asObject(await readJson(response));
    const token = typeof json.access_token === "string" ? json.access_token : "";
    if (!response.ok || !token) throw new UpstreamError("دریافت توکن درگاه ناموفق بود.", response.status, json);
    const ttl = typeof json.expires_in === "number" ? json.expires_in : 3600;
    tokenCache.set(key, { token, expiresAt: Date.now() + ttl * 1000 });
    return token;
  }

  private async call(method: "GET" | "POST", path: string, payload?: unknown, retry = true): Promise<Record<string, unknown>> {
    const token = await this.accessToken();
    const response = await this.http(joinUrl(this.base(), path), {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", ...(payload ? { "Content-Type": "application/json" } : {}) },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    if (response.status === 401 && retry) {
      tokenCache.delete(this.cacheKey());
      return this.call(method, path, payload, false);
    }
    const json = asObject(await readJson(response));
    if (!response.ok || json.successful === false) {
      const err = asObject(json.errorData);
      const message = typeof err.message === "string" ? err.message : typeof json.message === "string" ? json.message : `HTTP ${response.status}`;
      throw new UpstreamError(message, response.status, json);
    }
    return json;
  }

  async eligible(amountRial: number) {
    if (this.isMock) return { eligible: amountRial >= 10_000, title: "", description: "" };
    const json = await this.call("GET", `api/online/offer/v1/eligible?amount=${Math.round(amountRial)}`);
    const res = asObject(json.response);
    return {
      eligible: res.eligible === true,
      title: typeof res.title_message === "string" ? res.title_message : "",
      description: typeof res.description === "string" ? res.description : "",
    };
  }

  tokenPayload(request: CreditTokenRequest) {
    return {
      amount: request.amount,
      discountAmount: request.discountAmount,
      externalSourceAmount: request.externalSourceAmount,
      mobile: creditMobile(request.mobile),
      paymentMethodTypeDto: "INSTALLMENT",
      returnURL: request.returnURL,
      transactionId: request.transactionId,
      cartList: buildCartList(request),
      ...(this.config.gateway === "torobpay" && request.postalCode ? { postalCode: request.postalCode } : {}),
    };
  }

  async createToken(request: CreditTokenRequest) {
    const json = await this.call("POST", "api/online/payment/v1/token", this.tokenPayload(request));
    const res = asObject(json.response);
    const paymentToken = typeof res.paymentToken === "string" ? res.paymentToken : "";
    const paymentPageUrl = typeof res.paymentPageUrl === "string" ? res.paymentPageUrl : "";
    if (!paymentToken || !paymentPageUrl) throw new UpstreamError("پاسخ درگاه ناقص است.", 200, json);
    return { paymentToken, paymentPageUrl, raw: json };
  }

  async verify(paymentToken: string) {
    const json = await this.call("POST", "api/online/payment/v1/verify", { paymentToken });
    const res = asObject(json.response);
    return { transactionId: String(res.transactionId ?? ""), raw: json };
  }

  async settle(paymentToken: string) {
    const json = await this.call("POST", "api/online/payment/v1/settle", { paymentToken });
    const res = asObject(json.response);
    return { transactionId: String(res.transactionId ?? ""), raw: json };
  }

  async revert(paymentToken: string) {
    return this.call("POST", "api/online/payment/v1/revert", { paymentToken });
  }

  async cancel(paymentToken: string) {
    return this.call("POST", "api/online/payment/v1/cancel", { paymentToken });
  }

  async status(paymentToken: string) {
    const json = await this.call("GET", `api/online/payment/v1/status?paymentToken=${encodeURIComponent(paymentToken)}`);
    const res = asObject(json.response);
    return { status: String(res.status ?? ""), transactionId: String(res.transactionId ?? ""), raw: json };
  }

  /** Partial cancel / cart update after settle (e.g. one item returned). */
  async update(paymentToken: string, request: Omit<CreditTokenRequest, "mobile" | "returnURL" | "transactionId">) {
    return this.call("POST", "api/online/payment/v1/update", {
      paymentToken,
      amount: request.amount,
      discountAmount: request.discountAmount,
      externalSourceAmount: request.externalSourceAmount,
      paymentMethodTypeDto: "INSTALLMENT",
      cartList: buildCartList({ ...request, mobile: "", returnURL: "", transactionId: "" }),
    });
  }
}
