import { getGroup } from "@/lib/options";
import { fetchWithTimeout, readJson } from "@/lib/http";

export type SmsResult = { ok: boolean; provider: string; message?: string };

type SmsConfig = {
  provider: string;
  kavenegarKey: string;
  kavenegarSender: string;
  kavenegarOtpTemplate: string;
  melipayamakUser: string;
  melipayamakPass: string;
  melipayamakFrom: string;
  melipayamakOtpBodyId: string;
  adminMobiles: string;
};

export const sentInConsole: { to: string; text: string; at: number }[] = [];

async function config() {
  return (await getGroup("sms")) as unknown as SmsConfig;
}

async function kavenegarSend(cfg: SmsConfig, to: string, text: string): Promise<SmsResult> {
  const url = `https://api.kavenegar.com/v1/${encodeURIComponent(cfg.kavenegarKey)}/sms/send.json`;
  const body = new URLSearchParams({ receptor: to, message: text });
  if (cfg.kavenegarSender) body.set("sender", cfg.kavenegarSender);
  const res = await fetchWithTimeout(url, { method: "POST", body }, 10_000);
  const json = (await readJson(res)) as { return?: { status?: number; message?: string } } | null;
  return { ok: res.ok && json?.return?.status === 200, provider: "kavenegar", message: json?.return?.message };
}

async function kavenegarLookup(cfg: SmsConfig, to: string, code: string): Promise<SmsResult> {
  const params = new URLSearchParams({ receptor: to, token: code, template: cfg.kavenegarOtpTemplate });
  const url = `https://api.kavenegar.com/v1/${encodeURIComponent(cfg.kavenegarKey)}/verify/lookup.json?${params}`;
  const res = await fetchWithTimeout(url, {}, 10_000);
  const json = (await readJson(res)) as { return?: { status?: number; message?: string } } | null;
  return { ok: res.ok && json?.return?.status === 200, provider: "kavenegar", message: json?.return?.message };
}

async function melipayamakSend(cfg: SmsConfig, to: string, text: string): Promise<SmsResult> {
  const body = new URLSearchParams({ username: cfg.melipayamakUser, password: cfg.melipayamakPass, to, from: cfg.melipayamakFrom, text, isflash: "false" });
  const res = await fetchWithTimeout("https://rest.payamak-panel.com/api/SendSMS/SendSMS", { method: "POST", body }, 10_000);
  const json = (await readJson(res)) as { RetStatus?: number; StrRetStatus?: string } | null;
  return { ok: res.ok && json?.RetStatus === 1, provider: "melipayamak", message: json?.StrRetStatus };
}

async function melipayamakPattern(cfg: SmsConfig, to: string, args: string[]): Promise<SmsResult> {
  const body = new URLSearchParams({
    username: cfg.melipayamakUser,
    password: cfg.melipayamakPass,
    to,
    bodyId: cfg.melipayamakOtpBodyId,
    text: args.join(";"),
  });
  const res = await fetchWithTimeout("https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber", { method: "POST", body }, 10_000);
  const json = (await readJson(res)) as { RetStatus?: number; Value?: string; StrRetStatus?: string } | null;
  return { ok: res.ok && json?.RetStatus === 1, provider: "melipayamak", message: json?.StrRetStatus };
}

function consoleSend(to: string, text: string): SmsResult {
  sentInConsole.push({ to, text, at: Date.now() });
  if (sentInConsole.length > 50) sentInConsole.shift();
  console.log(`[sms:console] to=${to} text=${JSON.stringify(text)}`);
  return { ok: true, provider: "console" };
}

export async function sendSms(to: string, text: string): Promise<SmsResult> {
  const cfg = await config();
  try {
    if (cfg.provider === "kavenegar" && cfg.kavenegarKey) return await kavenegarSend(cfg, to, text);
    if (cfg.provider === "melipayamak" && cfg.melipayamakUser) return await melipayamakSend(cfg, to, text);
    if (cfg.provider === "console") return consoleSend(to, text);
    return { ok: false, provider: cfg.provider, message: "sms provider is off" };
  } catch (error) {
    console.error("sms failed", error);
    return { ok: false, provider: cfg.provider, message: (error as Error).message };
  }
}

/** Uses the provider's OTP pattern when configured (faster delivery, not filtered), else plain text. */
export async function sendOtpSms(to: string, code: string, fallbackText: string): Promise<SmsResult> {
  const cfg = await config();
  try {
    if (cfg.provider === "kavenegar" && cfg.kavenegarKey && cfg.kavenegarOtpTemplate) return await kavenegarLookup(cfg, to, code);
    if (cfg.provider === "melipayamak" && cfg.melipayamakUser && cfg.melipayamakOtpBodyId) return await melipayamakPattern(cfg, to, [code]);
  } catch (error) {
    console.error("otp pattern failed", error);
  }
  return sendSms(to, fallbackText);
}

export async function adminMobiles() {
  const cfg = await config();
  return cfg.adminMobiles.split(/[,،\s]+/).map((item) => item.trim()).filter(Boolean);
}
