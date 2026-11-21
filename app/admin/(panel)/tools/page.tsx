import { requireStaff } from "@/lib/auth";
import { PageHeader, Panel } from "@/components/admin/kit";
import { exportProductsCsvFormAction, importProductsCsvFormAction } from "@/lib/actions/admin/commerce";

export const metadata = { title: "ابزارها و پشتیبان" };

export default async function ToolsPage() {
  await requireStaff("manage_backups");
  return (
    <>
      <PageHeader title="ابزارها و پشتیبان" description="خروجی CSV محصولات و راهنمای پشتیبان دیتابیس (DEPLOY.md)." />
      <Panel title="محصولات CSV" className="mb-6">
        <form action={exportProductsCsvFormAction} className="mb-4"><button type="submit" className="btn btn-outline btn-sm">خروجی CSV</button></form>
        <form action={importProductsCsvFormAction} className="grid gap-2">
          <textarea name="csv" rows={6} className="input font-mono text-[0.8rem]" dir="ltr" placeholder="slug,title,category,price_toman,published,type" />
          <button type="submit" className="btn btn-primary btn-sm w-fit">ورود CSV</button>
        </form>
      </Panel>
      <Panel title="پشتیبان PostgreSQL">
        <p className="text-[0.88rem] leading-7 text-muted">روی سرور از <code className="text-[0.8rem]">ops/release.sh</code> برای انتشار امن و بک‌آپ خودکار استفاده کنید. برای بک‌آپ دستی: <code className="text-[0.8rem]">pg_dump</code> طبق DEPLOY.md.</p>
      </Panel>
    </>
  );
}