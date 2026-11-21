import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td } from "@/components/admin/kit";
import { saveAttributeFormAction } from "@/lib/actions/admin/commerce";
import { asStringArray } from "@/lib/utils";

export const metadata = { title: "ویژگی‌ها" };
export const dynamic = "force-dynamic";

export default async function AttributesPage() {
  await requireStaff("manage_store");
  const rows = await prisma.productAttribute.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <>
      <PageHeader title="ویژگی‌های محصول" />
      <Panel title="ویژگی جدید" className="mb-6">
        <form action={saveAttributeFormAction} className="grid gap-3">
          <input name="name" required className="input" placeholder="نام ویژگی (مثلاً رنگ)" />
          <input name="slug" required className="input" dir="ltr" placeholder="slug" />
          <textarea name="values" rows={3} className="input" placeholder="مقادیر، هر خط یک مورد" />
          <button type="submit" className="btn btn-primary btn-sm w-fit">ذخیره</button>
        </form>
      </Panel>
      <Panel>
        <Table>
          <thead><tr><Th>نام</Th><Th>مقادیر</Th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.id}><Td>{r.name}</Td><Td>{asStringArray(r.values).join("، ")}</Td></tr>)}</tbody>
        </Table>
      </Panel>
    </>
  );
}