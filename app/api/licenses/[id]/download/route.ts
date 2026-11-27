import { readFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { getCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";
import { paidPurchases } from "@/lib/licenses/delivery";
export const dynamic = "force-dynamic";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const customer = await getCustomer();
  if (!customer) return new Response(null, { status: 401 });
  const { id } = await params;
  const where = {
    id,
    customerId: customer.id,
    blocked: "",
    state: "ready",
    expiresAt: { gte: new Date() },
    purchases: paidPurchases,
  };
  const license = await prisma.pluginLicense.findFirst({ where });
  if (!license || !/^[a-f0-9-]{36}\.zip$/.test(license.artifact))
    return new Response(null, { status: 404 });
  const bytes = await readFile(
    path.join(
      process.env.PLUGIN_STORAGE || "/data/licenses",
      "artifacts",
      license.artifact,
    ),
  ).catch(() => null);
  if (
    !bytes ||
    createHash("sha256").update(bytes).digest("hex") !== license.checksum
  )
    return new Response("فایل نیاز به بازسازی دارد.", { status: 503 });
  const allowed = await prisma.pluginLicense.updateMany({
    where: { ...where, artifact: license.artifact },
    data: { downloads: { increment: 1 } },
  });
  if (!allowed.count) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="smart-commerce-${license.tier}-${license.version}.zip"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
