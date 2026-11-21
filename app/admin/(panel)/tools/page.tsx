import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { PageHeader,Panel } from "@/components/admin/kit";
import { ActionForm } from "@/components/admin/forms";
import { importCsv } from "@/lib/actions/admin/import";
import { can } from "@/lib/roles";
export default async function ToolsPage(){
  const user=await requireStaff("manage_backups");
  const groups=[["products","محصولات","manage_store"],["customers","مشتریان","manage_customers"],["orders","سفارش‌ها","manage_orders"]] as const;
  return <><PageHeader title="ورود و خروج اطلاعات"/><div className="grid gap-4">{groups.filter(g=>can(user.role,g[2])).map(([kind,label])=><Panel key={kind} title={label}><Link href={"/admin/export/"+kind} className="text-primary font-bold">دانلود CSV</Link><ActionForm action={importCsv.bind(null,kind)}><input name="file" type="file" accept=".csv" required/><p className="text-sm text-muted">{kind==="orders"?"ورود CSV فقط اطلاعات رهگیری سفارش موجود را به‌روزرسانی می‌کند.":"فایل با ستون‌های خروجی CSV سازگار است."}</p><button className="rounded-lg bg-primary text-white px-4 py-2">ورود CSV</button></ActionForm></Panel>)}<Panel title="خروجی پشتیبان محتوا"><Link href="/admin/export/content">دانلود JSON محتوا و کاتالوگ</Link><p className="text-sm text-muted">خروجی منطقی محتوا؛ شامل فایل‌ها، اسرار، نشست‌ها یا نسخه کامل دیتابیس نیست.</p></Panel></div></>;
}
