import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td } from "@/components/admin/kit";
import { saveCouponFormAction } from "@/lib/actions/admin/commerce";
import { rialToToman } from "@/lib/money";

export const metadata = { title: "کدهای تخفیف" };
export const dynamic = "force-dynamic";

export default async function CouponsPage() {
  await requireStaff("manage_coupons");
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="کدهای تخفیف" />
      <Panel title="کد جدید" className="mb-6">
        <form action={saveCouponFormAction} className="grid gap-3 md:grid-cols-3">
          <input name="code" required className="input uppercase" placeholder="کد" dir="ltr" />
          <select name="type" className="input" defaultValue="percent"><option value="percent">درصدی</option><option value="fixed">مبلغ ثابت</option></select>
          <input name="amount" className="input" dir="ltr" placeholder="مقدار" />
          <input name="description" className="input md:col-span-2" placeholder="توضیح" />
          <label className="flex items-center gap-2 text-[0.85rem]"><input type="checkbox" name="active" value="1" defaultChecked /> فعال</label>
          <button type="submit" className="btn btn-primary btn-sm">افزودن</button>
        </form>
      </Panel>
      <Panel>
        <Table>
          <thead><tr><Th>کد</Th><Th>نوع</Th><Th>استفاده</Th><Th>وضعیت</Th></tr></thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <Td className="font-bold"><span dir="ltr">{c.code}</span></Td>
                <Td>{c.type === "percent" ? `%${Number(c.amount)}` : `${rialToToman(c.amount)} تومان`}</Td>
                <Td className="num">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</Td>
                <Td>{c.active ? "فعال" : "غیرفعال"}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </>
  );
}