import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader, Panel, Table, Th, Td } from "@/components/admin/kit";

export const metadata = { title: "دسته و برچسب" };
export const dynamic = "force-dynamic";

export default async function TermsPage() {
  await requireStaff("manage_content");
  const terms = await prisma.term.findMany({ orderBy: [{ taxonomy: "asc" }, { sortOrder: "asc" }] });
  return (
    <>
      <PageHeader title="دسته و برچسب نوشته‌ها" />
      <Panel>
        <p className="mb-4 text-[0.88rem] text-muted">مدیریت پیشرفته از طریق پایگاه داده یا افزودن در ویرایشگر نوشته. فهرست فعلی:</p>
        <Table>
          <thead><tr><Th>نام</Th><Th>نامک</Th><Th>نوع</Th></tr></thead>
          <tbody>{terms.map((t) => <tr key={t.id}><Td>{t.name}</Td><Td><span dir="ltr">{t.slug}</span></Td><Td>{t.taxonomy}</Td></tr>)}</tbody>
        </Table>
        <Link href="/admin/blog" className="btn btn-outline btn-sm mt-4 inline-flex">رفتن به نوشته‌ها</Link>
      </Panel>
    </>
  );
}