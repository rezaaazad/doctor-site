import { prisma } from "@/lib/db";
import { normalizeMobile } from "@/lib/money";
import { defer, notifyLead } from "@/lib/messaging/notify";

export type LeadInput = {
  name: string;
  phone: string;
  email: string;
  projectType: string;
  budget: string;
  message: string;
  source: string;
  company: string;
};

export type LeadValidation = { ok: true; data: LeadInput & { phone: string } } | { ok: false; errors: Record<string, string> };

const s = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : "");

export function readLead(form: FormData | Record<string, unknown>): LeadInput {
  const get = (key: string) => (form instanceof FormData ? form.get(key) : form[key]);
  return {
    name: s(get("name"), 120),
    phone: s(get("phone"), 30),
    email: s(get("email"), 160),
    projectType: s(get("projectType"), 120),
    budget: s(get("budget"), 120),
    message: s(get("message"), 4000),
    source: s(get("source"), 120),
    company: s(get("company"), 120),
  };
}

export function validateLead(input: LeadInput): LeadValidation {
  const errors: Record<string, string> = {};
  if (input.name.length < 2) errors.name = "نام را بنویسید.";
  const phone = normalizeMobile(input.phone) || (/^0\d{9,10}$/.test(input.phone.replace(/[^\d]/g, "")) ? input.phone.replace(/[^\d]/g, "") : "");
  if (!phone) errors.phone = "شماره تماس معتبر نیست.";
  if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.email = "ایمیل معتبر نیست.";
  if (/https?:\/\/\S+/gi.test(input.message) && (input.message.match(/https?:\/\//gi)?.length ?? 0) > 3) errors.message = "پیام شامل لینک‌های زیاد است.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { ...input, phone } };
}

export type LeadResult = { ok: boolean; message: string; errors?: Record<string, string>; spam?: boolean };

/** Validates, rate-limits (5/hour/IP), stores and notifies. Honeypot hits are acknowledged but dropped. */
export async function captureLead(input: LeadInput, ip: string): Promise<LeadResult> {
  if (input.company) return { ok: true, message: "درخواست شما ثبت شد.", spam: true };
  const checked = validateLead(input);
  if (!checked.ok) return { ok: false, message: Object.values(checked.errors)[0], errors: checked.errors };
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.contactMessage.count({ where: { ip, createdAt: { gte: since } } });
  if (recent >= 5) return { ok: false, message: "درخواست‌های زیادی ثبت شده. کمی بعد دوباره تلاش کنید یا تماس بگیرید." };
  const data = checked.data;
  const lead = await prisma.contactMessage.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email,
      subject: data.projectType || "درخواست مشاوره",
      projectType: data.projectType,
      budget: data.budget,
      message: data.message || [data.projectType, data.budget].filter(Boolean).join(" — ") || "درخواست تماس",
      source: data.source || "site",
      ip,
      status: "new",
    },
  });
  defer(() => notifyLead(lead.id));
  return { ok: true, message: "درخواست شما ثبت شد. معمولاً در کمتر از یک ساعت کاری تماس می‌گیریم." };
}
