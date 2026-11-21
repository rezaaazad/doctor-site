import { getGroup } from "@/lib/options";
import { torobProducts, verifyTorobToken } from "@/lib/feeds/torob";

export async function POST(request: Request) {
  const cfg = await getGroup("torob");
  if (!cfg.enabled) return Response.json({ error: "disabled" }, { status: 404 });
  const token = request.headers.get("x-torob-token") ?? "";
  const audience = String(cfg.audience || new URL(process.env.SITE_URL || "https://doctor-site.ir").host);
  const check = verifyTorobToken(token, audience, cfg.publicKey ? { publicKey: String(cfg.publicKey) } : {});
  if (!check.ok) return Response.json({ error: check.reason }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const result = await torobProducts(body as Record<string, unknown>);
  return Response.json(result.body, { status: result.status, headers: { "Cache-Control": "private, no-store" } });
}