"use server";

import { redirect } from "next/navigation";
import { assertRateLimit, assertSameOrigin, clearFailures, clientIp, createSession, destroySession, getSessionUser, recordFailure, safeNext, verifyPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { failState, type AdminState } from "@/lib/admin/action";

export async function loginStaffAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));
  try {
    await assertSameOrigin();
    const ip = await clientIp();
    await assertRateLimit(ip);
    const user = await verifyPassword(email, password);
    if (!user) {
      await recordFailure(ip);
      return { ok: false, message: "ایمیل یا رمز عبور نادرست است." };
    }
    await clearFailures(ip);
    await createSession(user.id);
    await logActivity({ id: user.id, email: user.email, name: user.name, role: user.role }, "login", "session");
  } catch (error) {
    return failState(error);
  }
  redirect(next);
}

export async function logoutStaffAction() {
  await assertSameOrigin();
  const user = await getSessionUser();
  if (user) await logActivity(user, "logout", "session");
  await destroySession();
  redirect("/admin/login");
}
