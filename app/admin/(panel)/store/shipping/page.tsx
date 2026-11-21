import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel } from "@/components/admin/kit";
import { saveShippingZoneFormAction } from "@/lib/actions/admin/commerce";
import { asStringArray } from "@/lib/utils";
import { rialToToman } from "@/lib/money";

export const metadata = { title: "حمل و مالیات" };
export const dynamic = "force-dynamic";

export default async function ShippingAdminPage() {
  await requireStaff("manage_store");
  const [zones, taxes] = await Promise.all([
    prisma.shippingZone.findMany({ include: { methods: true }, orderBy: { sortOrder: "asc" } }),
    prisma.taxRate.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return (
    <>
      <PageHeader title="حمل‌ونقل و مالیات" />
      <Panel title="منطقه ارسال" className="mb-6">
        <form action={saveShippingZoneFormAction} className="grid gap-3 md:grid-cols-2">
          <input name="name" required className="input" placeholder="نام منطقه" />
          <textarea name="provinces" className="input md:col-span-2" rows={3} placeholder="استان‌ها، هر خط یکی" />
          <input name="methodTitle" className="input" placeholder="عنوان روش (مثلاً پست پیشتاز)" />
          <select name="methodKind" className="input" defaultValue="flat"><option value="flat">ثابت</option><option value="per_kg">وزنی</option><option value="courier">پیک</option></select>
          <input name="methodCost" className="input" dir="ltr" placeholder="هزینه تومان" />
          <input name="methodFreeAbove" className="input" dir="ltr" placeholder="رایگان بالای (تومان)" />
          <button type="submit" className="btn btn-primary btn-sm w-fit md:col-span-2">ذخیره</button>
        </form>
      </Panel>
      <Panel title="مناطق و روش‌ها">
        <ul className="space-y-4 text-[0.86rem]">
          {zones.map((z) => (
            <li key={z.id}>
              <b>{z.name}</b> — {asStringArray(z.provinces).join("، ") || "همه"}
              <ul className="mt-1 ms-4 text-muted">
                {z.methods.map((m) => (
                  <li key={m.id}>{m.title}: {rialToToman(m.costRial)} تومان{m.freeAbove ? ` (رایگان از ${rialToToman(m.freeAbove)})` : ""}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="نرخ مالیات" className="mt-6">
        <ul className="text-[0.86rem]">{taxes.map((t) => <li key={t.id}>{t.name}: {t.rateBp / 100}%</li>)}</ul>
      </Panel>
    </>
  );
}