import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { sendOtpSms, sendSms } from "@/lib/messaging/sms";

const config = vi.hoisted(() => ({
  provider: "farazsms", farazsmsApiKey: "test-option", farazsmsLineNumber: "90001234", farazsmsOtpPattern: "test-pattern",
}));
vi.mock("@/lib/options", () => ({ getGroup: async () => config }));
const fetchMock = vi.fn<typeof fetch>();
const otp = () => sendOtpSms("09121112233", "12345", "fallback");
const base = "https://api.iranpayamak.com/ws/v1/sms/";
beforeEach(() => {
  config.farazsmsApiKey = "test-option";
  config.farazsmsOtpPattern = "test-pattern";
  vi.stubEnv("FARAZSMS_API_TOKEN", "test-env");
  vi.stubGlobal("fetch", fetchMock.mockReset());
  fetchMock.mockResolvedValue(Response.json({ status: "success" }, { status: 201 }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it("uses the pattern endpoint, configured key and unchanged OTP", async () => {
  expect(await otp()).toEqual({ ok: true, provider: "farazsms" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe(base + "pattern");
  expect(init).toMatchObject({ method: "POST", headers: { "Api-Key": "test-option", "Content-Type": "application/json" } });
  expect(JSON.parse(String(init?.body))).toEqual({ code: "test-pattern", recipient: "09121112233", attributes: { code: "12345" }, line_number: "90001234", number_format: "english" });
});
it.each([[200, "error"], [202, "success"], [403, "success"]] as const)("rejects %i/%s without retrying as plain SMS", async (status, result) => {
  fetchMock.mockResolvedValue(Response.json({status: result}, {status}));
  expect((await otp()).ok).toBe(false);
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([base + "pattern"]);
});
it("uses the environment token when the option is empty", async () => {
  config.farazsmsApiKey = "";
  expect((await otp()).ok).toBe(true);
  expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({"Api-Key": "test-env"});
});
it("rejects missing credentials, missing pattern and oversized codes before making a request", async () => {
  expect((await sendOtpSms("09121112233", "1234567", "fallback")).ok).toBe(false);
  config.farazsmsOtpPattern = "";
  expect((await otp()).message).toContain("الگو");
  config.farazsmsApiKey = "";
  vi.stubEnv("FARAZSMS_API_TOKEN", "");
  expect((await otp()).message).toContain("کلید");
  expect(fetchMock).not.toHaveBeenCalled();
});
it("keeps network errors private and never falls back to simple", async () => {
  fetchMock.mockRejectedValue(new Error("test-option"));
  const result = await otp();
  expect(result.ok).toBe(false);
  expect(result.message).not.toContain("test-option");
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([base + "pattern"]);
});
it("sends notices with a recipients list and text", async () => {
  config.farazsmsOtpPattern = "";
  expect((await sendSms("+989121112233", "notice")).ok).toBe(true);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe(base + "simple");
  expect(JSON.parse(String(init?.body))).toEqual({ recipients: ["09121112233"], text: "notice", line_number: "90001234", number_format: "english" });
});
