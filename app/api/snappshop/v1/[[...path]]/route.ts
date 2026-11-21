import { SNAPPSHOP_BASE, authorizeSnappshop, ok, fail, listProducts, productByCode, resolveUrl, categories, attributes } from "@/lib/feeds/snappshop";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(request: Request, { path = [] }: { path?: string[] }) {
  const denied = await authorizeSnappshop(request);
  if (denied) return denied;
  const segment = path.join("/");
  const url = new URL(request.url);
  if (request.method === "GET") {
    if (segment === "" || segment === "status") return ok({ shop: "doctor-site", base: SNAPPSHOP_BASE });
    if (segment === "products") return ok(await listProducts(url.searchParams));
    if (segment === "categories") return ok(await categories());
    if (segment === "attributes") return ok(await attributes());
    if (segment === "resolve") {
      const target = url.searchParams.get("url") || "";
      const data = await resolveUrl(target);
      return data ? ok(data) : fail("آدرس شناسایی نشد.", 404);
    }
    const productMatch = /^products\/(\d+)$/.exec(segment);
    if (productMatch) {
      const data = await productByCode(Number(productMatch[1]));
      return data ? ok(data) : fail("محصول پیدا نشد.", 404);
    }
  }
  return fail("مسیر نامعتبر است.", 404);
}

export async function GET(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(request, { path });
}

export async function POST(request: Request, ctx: Ctx) {
  const { path } = await ctx.params;
  return handle(request, { path });
}