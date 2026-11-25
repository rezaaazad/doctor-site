import { createElement } from "react";
import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BriefSummary } from "@/components/store/brief-summary";
import { briefOwner, briefAnswers, questions } from "@/lib/store/project";
import { CreditClient } from "@/lib/payments/credit";
import { cartKey } from "@/lib/store/addons";

it("renders a guest brief summary from the stored answers", () => {
  const html = renderToStaticMarkup(
    createElement(BriefSummary, {
      brief: {
        answers: [
          { id: "brand", title: "نام برند", value: "دکتر سایت" },
          { id: "notes", title: "توضیح", value: "خط اول\nخط دوم" },
          { title: "", value: "" },
        ],
      },
    }),
  );
  expect(html).toContain("دکتر سایت");
  expect(html).toContain("نام برند");
  expect(html).toContain("خط اول\nخط دوم");
  expect(html.match(/<dt/g)).toHaveLength(2);
});
it("requires a matching customer or order key, including for guests", () => {
  const o = { customerId: "c", accessKey: "secret" };
  expect(briefOwner(o, "c")).toBe(true);
  expect(briefOwner(o, "other", "secret")).toBe(true);
  expect(briefOwner(o, "other", "wrong")).toBe(false);
  expect(briefOwner({ ...o, customerId: null })).toBe(false);
});
it("validates required and per-service questions and only keeps defined answers", () => {
  const qs = questions([
    {
      type: "service",
      productId: "p",
      product: { briefSchema: [{ id: "goal", title: "هدف", required: true }] },
    },
  ]);
  const f = new FormData();
  expect(() => briefAnswers(qs, f)).toThrow();
  for (const q of qs) f.set(q.id, "پاسخ");
  f.set("projectStage", "delivered");
  expect(briefAnswers(qs, f).map((q) => q.id)).toEqual([
    "brand",
    "domain",
    "references",
    "style",
    "contact",
    "p.goal",
  ]);
  f.set("brand", "x".repeat(2001));
  expect(() => briefAnswers(qs, f)).toThrow();
});
it("keeps independent configurations and accepts pre-add-on cart lines", () => {
  expect(cartKey("a", "v")).toBe(cartKey("a", "v", []));
  expect(cartKey("a", "v", ["b", "a"])).toBe(cartKey("a", "v", ["a", "b"]));
  expect(cartKey("a", "v", ["b"])).not.toBe(cartKey("a", "v", ["a"]));
});
it.each(["snapppay", "torobpay"] as const)(
  "uses provider-specific OAuth and order payload for %s",
  async (gateway) => {
    const http = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ access_token: "ok" })));
    const client = new CreditClient(
      {
        gateway,
        mode: "stage",
        baseUrl: "https://example.org",
        stageBaseUrl: "",
        username: "user",
        password: "pass",
        clientId: "id",
        clientSecret: "secret",
      },
      http,
    );
    await client.accessToken(true);
    const [url, init] = http.mock.calls[0];
    expect(url).toContain("/api/online/v1/oauth/token");
    expect(init.headers.Authorization).toBe(
      "Basic " + Buffer.from("id:secret").toString("base64"),
    );
    if (gateway === "torobpay")
      expect(JSON.parse(init.body)).toEqual({
        username: "user",
        password: "pass",
      });
    else {
      expect(init.headers["User-Agent"]).toBe("SnappPay, id");
      expect(new URLSearchParams(init.body).get("grant_type")).toBe("password");
    }
    const req = client.tokenPayload({
      amount: 100,
      discountAmount: 0,
      externalSourceAmount: 0,
      mobile: "09120000000",
      name: "مشتری",
      returnURL: "",
      transactionId: "t",
      cart: { id: 1, items: [], shippingAmount: 0, taxAmount: 0 },
    });
    expect(req).toMatchObject({
      paymentMethodTypeDto:
        gateway === "torobpay" ? "ONLINE_CREDIT" : "INSTALLMENT",
      postalCode: "0000000000",
      address: "تحویل آنلاین",
      name: "مشتری",
    });
  },
);
