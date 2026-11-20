import { NextResponse } from "next/server";
import { recordView } from "@/lib/analytics";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { path?: string; referrer?: string };
    const path = typeof body.path === "string" ? body.path : "";
    const referrer = typeof body.referrer === "string" ? body.referrer : "";
    const ua = request.headers.get("user-agent") || "";
    const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim() || "0";
    const country = request.headers.get("cf-ipcountry") || request.headers.get("x-vercel-ip-country") || "";
    await recordView({ path, referrer, ua, ip, country });
  } catch {
    /* analytics must not break the page */
  }
  return NextResponse.json({ ok: true });
}
