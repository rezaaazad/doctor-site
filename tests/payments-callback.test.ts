import { beforeEach, describe, expect, it, vi } from "vitest";

type Row = {
  id: string;
  orderId: string;
  gateway: string;
  amountRial: bigint;
  transactionId: string;
  authority: string;
  status: string;
  sandbox: boolean;
  message: string;
  refId: string;
  cardPan: string;
  raw: Record<string, unknown>;
};

const state = vi.hoisted(() => ({
  payments: new Map<string, Row>(),
  options: {} as Record<string, Record<string, unknown>>,
}));

const order = { id: "ord_1", number: 1042, accessKey: "k3y", totalRial: BigInt(12_000_000), walletRial: BigInt(0) };

function withOrder(row: Row | undefined) {
  return row ? { ...row, order } : null;
}

function matches(row: Row, where: Record<string, unknown>) {
  return Object.entries(where).every(([key, value]) => {
    const current = row[key as keyof Row];
    if (value && typeof value === "object" && "in" in (value as object)) return (value as { in: unknown[] }).in.includes(current);
    return current === value;
  });
}

vi.mock("@/lib/db", () => ({
  prisma: {
    payment: {
      findUnique: async ({ where }: { where: Record<string, unknown> }) =>
        withOrder([...state.payments.values()].find((row) => matches(row, where))),
      findFirst: async ({ where }: { where: Record<string, unknown> }) =>
        withOrder([...state.payments.values()].find((row) => matches(row, where))),
      updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Partial<Row> }) => {
        let count = 0;
        for (const row of state.payments.values()) {
          if (matches(row, where)) {
            Object.assign(row, data);
            count++;
          }
        }
        return { count };
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<Row> }) => {
        const row = state.payments.get(where.id)!;
        Object.assign(row, data);
        return row;
      },
    },
  },
}));
vi.mock("@/lib/options", () => ({ getGroup: async (id: string) => state.options[id] ?? {} }));
vi.mock("@/lib/store/orders", () => ({ markOrderPaid: vi.fn(async (_orderId, info) => { if (info.receipt) Object.assign(state.payments.get(info.paymentId)!, info.receipt); return true; }), addOrderNote: vi.fn(), reduceStockOnce: vi.fn() }));
vi.mock("@/lib/messaging/notify", () => ({ defer: vi.fn(), notifyOrderPaid: vi.fn(), notifyOrderStatus: vi.fn() }));

import { handleCallback, recordMockDecision } from "@/lib/payments";
import { markOrderPaid } from "@/lib/store/orders";

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function addPayment(patch: Partial<Row>): Row {
  const row: Row = {
    id: `pay_${state.payments.size + 1}`,
    orderId: order.id,
    gateway: "zarinpal",
    amountRial: BigInt(12_000_000),
    transactionId: `DS1042-${state.payments.size + 1}`,
    authority: "A0000000000000000000000000000123456",
    status: "redirected",
    sandbox: true,
    message: "",
    refId: "",
    cardPan: "",
    raw: {},
    ...patch,
  };
  state.payments.set(row.id, row);
  return row;
}

function calls(path: string) {
  return fetchMock.mock.calls.filter(([url]) => String(url).includes(path));
}

beforeEach(() => {
  state.payments.clear();
  state.options = {
    pay_zarinpal: { enabled: true, merchantId: "11111111-2222-3333-4444-555555555555", sandbox: true },
    pay_mock: { enabled: true },
    pay_snapppay: { enabled: true, mode: "stage", stageBaseUrl: "https://fms-gateway-staging.apps.public.teh-1.snappcloud.io", clientId: "cid", clientSecret: "sec", username: "user", password: "pass" },
    pay_torobpay: { enabled: true, mode: "stage", stageBaseUrl: "https://cpg-stage.torob.example", clientId: "tid", clientSecret: "tsec", username: "tuser", password: "tpass", settle: true },
  };
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(markOrderPaid).mockClear();
});

describe("Zarinpal callback", () => {
  it("verifies server-side with the stored amount and authority before marking paid", async () => {
    const p = addPayment({});
    fetchMock.mockResolvedValueOnce(json({ data: { code: 100, ref_id: 98765, card_pan: "6037**1234" }, errors: [] }));
    const result = await handleCallback("zarinpal", { tx: p.transactionId, Authority: p.authority, Status: "OK" });
    expect(result).toMatchObject({ ok: true, orderNumber: 1042, accessKey: "k3y" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://sandbox.zarinpal.com/pg/v4/payment/verify.json");
    expect(JSON.parse(String(init?.body))).toEqual({ merchant_id: "11111111-2222-3333-4444-555555555555", amount: 12_000_000, authority: p.authority });
    expect(state.payments.get(p.id)).toMatchObject({ status: "verified", refId: "98765", cardPan: "6037**1234" });
    expect(markOrderPaid).toHaveBeenCalledOnce();
  });

  it("treats code 101 (already verified) as paid", async () => {
    const p = addPayment({});
    fetchMock.mockResolvedValueOnce(json({ data: { code: 101, ref_id: 1 }, errors: [] }));
    expect((await handleCallback("zarinpal", { tx: p.transactionId, Status: "OK" }))?.ok).toBe(true);
  });

  it("fails without calling verify when Status is NOK", async () => {
    const p = addPayment({});
    const result = await handleCallback("zarinpal", { tx: p.transactionId, Authority: p.authority, Status: "NOK" });
    expect(result?.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.payments.get(p.id)?.status).toBe("failed");
    expect(markOrderPaid).not.toHaveBeenCalled();
  });

  it("does not trust Status=OK when the gateway rejects verification", async () => {
    const p = addPayment({});
    fetchMock.mockResolvedValueOnce(json({ data: [], errors: { code: -51, message: "Session is not valid" } }));
    const result = await handleCallback("zarinpal", { tx: p.transactionId, Status: "OK" });
    expect(result?.ok).toBe(false);
    expect(state.payments.get(p.id)?.status).toBe("failed");
    expect(markOrderPaid).not.toHaveBeenCalled();
  });

  it("rejects a callback whose Authority does not match the stored one", async () => {
    const p = addPayment({});
    const result = await handleCallback("zarinpal", { tx: p.transactionId, Authority: "A-forged", Status: "OK" });
    expect(result?.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("is idempotent: a replayed callback does not pay the order twice", async () => {
    const p = addPayment({});
    fetchMock.mockResolvedValue(json({ data: { code: 100, ref_id: 5 }, errors: [] }));
    await handleCallback("zarinpal", { tx: p.transactionId, Status: "OK" });
    const again = await handleCallback("zarinpal", { tx: p.transactionId, Status: "OK" });
    expect(again?.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(markOrderPaid).toHaveBeenCalledOnce();
  });

  it("keeps the payment retryable when the verify request errors", async () => {
    const p = addPayment({});
    fetchMock.mockRejectedValueOnce(new Error("socket hang up"));
    const result = await handleCallback("zarinpal", { tx: p.transactionId, Status: "OK" });
    expect(result?.ok).toBe(false);
    expect(state.payments.get(p.id)?.status).toBe("redirected");
  });

  it("ignores unknown gateways and unknown payments", async () => {
    expect(await handleCallback("paypal", { tx: "x" })).toBeNull();
    expect(await handleCallback("zarinpal", { tx: "missing" })).toBeNull();
  });

  it("does not let one gateway's callback resolve another gateway's payment", async () => {
    const p = addPayment({ gateway: "snapppay", authority: "tok" });
    expect(await handleCallback("zarinpal", { tx: p.transactionId, Status: "OK" })).toBeNull();
  });
});

function creditRoutes(prefix: string, opts: { verifyTx?: string; settleStatus?: number } = {}) {
  fetchMock.mockImplementation(async (url) => {
    const u = String(url);
    if (!u.startsWith(prefix)) throw new Error(`unexpected host ${u}`);
    if (u.endsWith("/oauth/token")) return json({ access_token: "jwt", expires_in: 3600 });
    if (u.endsWith("/payment/v1/verify")) return json({ successful: true, response: { transactionId: opts.verifyTx } });
    if (u.endsWith("/payment/v1/settle")) {
      return opts.settleStatus && opts.settleStatus >= 400
        ? json({ successful: false, errorData: { message: "settle failed" } }, opts.settleStatus)
        : json({ successful: true, response: { transactionId: opts.verifyTx } });
    }
    throw new Error(`unexpected path ${u}`);
  });
}

describe("Snapp Pay / Torob Pay callback", () => {
  it("Snapp Pay: verifies, then settles, then marks paid", async () => {
    const p = addPayment({ gateway: "snapppay", authority: "snapp-token-1", transactionId: "DS1042-aa" });
    creditRoutes("https://fms-gateway-staging.apps.public.teh-1.snappcloud.io", { verifyTx: "DS1042-aa" });
    const result = await handleCallback("snapppay", { transactionId: "DS1042-aa", state: "OK" });
    expect(result?.ok).toBe(true);
    expect(calls("/payment/v1/verify")).toHaveLength(1);
    expect(JSON.parse(String(calls("/payment/v1/verify")[0][1]?.body))).toEqual({ paymentToken: "snapp-token-1" });
    expect(calls("/payment/v1/settle")).toHaveLength(1);
    expect(state.payments.get(p.id)?.status).toBe("settled");
    expect(markOrderPaid).toHaveBeenCalledOnce();
  });

  it("rejects when the verified transaction id belongs to another order", async () => {
    addPayment({ gateway: "snapppay", authority: "snapp-token-2", transactionId: "DS1042-bb" });
    creditRoutes("https://fms-gateway-staging.apps.public.teh-1.snappcloud.io", { verifyTx: "DS9999-zz" });
    const result = await handleCallback("snapppay", { transactionId: "DS1042-bb", state: "OK" });
    expect(result?.ok).toBe(false);
    expect(calls("/payment/v1/settle")).toHaveLength(0);
    expect(markOrderPaid).not.toHaveBeenCalled();
  });

  it("does not mark paid when settle fails after verify", async () => {
    const p = addPayment({ gateway: "snapppay", authority: "snapp-token-3", transactionId: "DS1042-cc" });
    creditRoutes("https://fms-gateway-staging.apps.public.teh-1.snappcloud.io", { verifyTx: "DS1042-cc", settleStatus: 500 });
    const result = await handleCallback("snapppay", { transactionId: "DS1042-cc", state: "OK" });
    expect(result?.ok).toBe(false);
    expect(state.payments.get(p.id)?.status).toBe("verified");
    expect(markOrderPaid).not.toHaveBeenCalled();
  });

  it("Torob Pay: a FAILED state never reaches verify", async () => {
    const p = addPayment({ gateway: "torobpay", authority: "torob-token", transactionId: "DS1042-dd" });
    const result = await handleCallback("torobpay", { transactionId: "DS1042-dd", state: "FAILED" });
    expect(result?.ok).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.payments.get(p.id)?.status).toBe("failed");
  });

  it("Torob Pay: uses its own base URL and settles", async () => {
    addPayment({ gateway: "torobpay", authority: "torob-token-2", transactionId: "DS1042-ee" });
    creditRoutes("https://cpg-stage.torob.example", { verifyTx: "DS1042-ee" });
    expect((await handleCallback("torobpay", { transactionId: "DS1042-ee", state: "OK" }))?.ok).toBe(true);
    expect(markOrderPaid).toHaveBeenCalledOnce();
  });
});

describe("mock gateway cannot be forged", () => {
  it("a callback without a server-side decision fails even with state=OK", async () => {
    const p = addPayment({ gateway: "mock", authority: "mock_DS1042-ff", transactionId: "DS1042-ff" });
    const result = await handleCallback("mock", { tx: p.transactionId, state: "OK", Status: "OK" });
    expect(result?.ok).toBe(false);
    expect(markOrderPaid).not.toHaveBeenCalled();
  });

  it("succeeds only after the mock page records approval", async () => {
    const p = addPayment({ gateway: "mock", authority: "mock_DS1042-gg", transactionId: "DS1042-gg" });
    expect(await recordMockDecision(p.transactionId, true)).not.toBeNull();
    const result = await handleCallback("mock", { tx: p.transactionId });
    expect(result?.ok).toBe(true);
    expect(markOrderPaid).toHaveBeenCalledOnce();
  });

  it("refuses to record a decision for a non-mock payment", async () => {
    const p = addPayment({ gateway: "zarinpal" });
    expect(await recordMockDecision(p.transactionId, true)).toBeNull();
  });

  it("credit gateways in mock mode also require the server-side decision", async () => {
    state.options.pay_snapppay.mode = "mock";
    const p = addPayment({ gateway: "snapppay", authority: "mock_DS1042-hh", transactionId: "DS1042-hh" });
    expect((await handleCallback("snapppay", { transactionId: p.transactionId, state: "OK" }))?.ok).toBe(false);
    const q = addPayment({ gateway: "snapppay", authority: "mock_DS1042-ii", transactionId: "DS1042-ii" });
    await recordMockDecision(q.transactionId, true);
    expect((await handleCallback("snapppay", { transactionId: q.transactionId, state: "OK" }))?.ok).toBe(true);
  });
});
