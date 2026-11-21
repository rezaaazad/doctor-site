"use server";

import { prisma } from "@/lib/db";
import { clientIp } from "@/lib/auth";
import { captureLead, readLead } from "@/lib/leads";

export type PublicFormState = { ok?: boolean; message?: string; errors?: Record<string, string> } | null;

export async function submitLeadAction(_prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  try {
    const ip = await clientIp();
    const result = await captureLead(readLead(formData), ip);
    return { ok: result.ok, message: result.message, errors: result.errors };
  } catch (error) {
    console.error("lead failed", error);
    return { ok: false, message: "ارسال انجام نشد. لطفاً تماس بگیرید یا دوباره تلاش کنید." };
  }
}

export async function subscribeAction(_prev: PublicFormState, formData: FormData): Promise<PublicFormState> {
  const value = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 160);
  if (String(formData.get("company") ?? "")) return { ok: true, message: "ثبت شد." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { ok: false, message: "ایمیل معتبر نیست." };
  try {
    await prisma.newsletterSubscriber.upsert({ where: { email: value }, update: {}, create: { email: value, source: String(formData.get("source") ?? "footer").slice(0, 60) } });
    return { ok: true, message: "عضو شدید. پیشنهادهای ویژه را زودتر از همه می‌بینید." };
  } catch {
    return { ok: false, message: "ثبت انجام نشد." };
  }
}
