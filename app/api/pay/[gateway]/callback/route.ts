import { NextResponse } from "next/server";
import { handleCallback, resultUrl } from "@/lib/payments";

type Props = { params: Promise<{ gateway: string }> };

export async function GET(request: Request, { params }: Props) {
  const { gateway } = await params;
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const outcome = await handleCallback(gateway, query);
  if (!outcome) return NextResponse.json({ ok: false, message: "not found" }, { status: 404 });
  const dest = new URL(resultUrl({ number: outcome.orderNumber, accessKey: outcome.accessKey }), url.origin);
  dest.searchParams.set("paid", outcome.ok ? "1" : "0");
  dest.searchParams.set("msg", outcome.message);
  return NextResponse.redirect(dest.toString());
}

export async function POST(request: Request, ctx: Props) {
  const body = await request.json().catch(() => ({}));
  const merged = { ...Object.fromEntries(new URL(request.url).searchParams.entries()), ...Object.fromEntries(Object.entries(body).map(([k, v]) => [k, String(v)])) };
  const req = new Request(request.url, { headers: request.headers });
  void req;
  const { gateway } = await ctx.params;
  const outcome = await handleCallback(gateway, merged);
  if (!outcome) return NextResponse.json({ ok: false }, { status: 404 });
  const url = new URL(request.url);
  const dest = new URL(resultUrl({ number: outcome.orderNumber, accessKey: outcome.accessKey }), url.origin);
  dest.searchParams.set("paid", outcome.ok ? "1" : "0");
  dest.searchParams.set("msg", outcome.message);
  return NextResponse.redirect(dest.toString());
}