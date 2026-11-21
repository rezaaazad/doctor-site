import nodemailer from "nodemailer";
import { getGroup } from "@/lib/options";
import { fetchWithTimeout, joinUrl, readJson } from "@/lib/http";

type EmailConfig = { enabled: boolean; host: string; port: number; secure: boolean; user: string; pass: string; from: string; adminEmails: string };
type TelegramConfig = { enabled: boolean; botToken: string; chatId: string; apiBase: string };

export async function sendEmail(to: string[], subject: string, text: string) {
  const cfg = (await getGroup("email")) as unknown as EmailConfig;
  if (!cfg.enabled || !cfg.host || to.length === 0) return { ok: false, message: "email is off" };
  try {
    const transport = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.user ? { user: cfg.user, pass: cfg.pass } : undefined,
      connectionTimeout: 10_000,
    });
    await transport.sendMail({ from: cfg.from, to: to.join(", "), subject, text });
    return { ok: true };
  } catch (error) {
    console.error("email failed", error);
    return { ok: false, message: (error as Error).message };
  }
}

export async function adminEmails() {
  const cfg = (await getGroup("email")) as unknown as EmailConfig;
  return cfg.adminEmails.split(/[,،\s]+/).map((item) => item.trim()).filter(Boolean);
}

export async function sendTelegram(text: string) {
  const cfg = (await getGroup("telegram")) as unknown as TelegramConfig;
  if (!cfg.enabled || !cfg.botToken || !cfg.chatId) return { ok: false, message: "telegram is off" };
  const chats = cfg.chatId.split(/[,،\s]+/).filter(Boolean);
  let ok = true;
  for (const chat of chats) {
    try {
      const res = await fetchWithTimeout(
        joinUrl(cfg.apiBase || "https://api.telegram.org", `bot${cfg.botToken}/sendMessage`),
        { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }) },
        10_000,
      );
      const json = (await readJson(res)) as { ok?: boolean } | null;
      ok = ok && res.ok && Boolean(json?.ok);
    } catch (error) {
      console.error("telegram failed", error);
      ok = false;
    }
  }
  return { ok };
}
