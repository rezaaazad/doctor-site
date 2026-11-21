import { prisma } from "@/lib/db";
import { clientIp, type StaffUser } from "@/lib/auth";

export async function logActivity(user: StaffUser | null, action: string, entity = "", entityId = "", summary = "") {
  try {
    await prisma.activityLog.create({
      data: {
        userId: user?.id ?? null,
        userName: user?.name ?? "سیستم",
        action,
        entity,
        entityId,
        summary: summary.slice(0, 500),
        ip: user ? await clientIp().catch(() => "") : "",
      },
    });
  } catch (error) {
    console.error("activity log failed", error);
  }
}
