import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Panel } from "@/components/admin/kit";

export const metadata = { title: "درگاه‌ها و اتصال‌ها" };

const LINKS = [
  { href: "/admin/settings/pay_zarinpal", label: "زرین‌پال" },
  { href: "/admin/settings/pay_snapppay", label: "اسنپ‌پی" },
  { href: "/admin/settings/pay_torobpay", label: "ترب‌پی" },
  { href: "/admin/settings/pay_bank", label: "کارت‌به‌کارت" },
  { href: "/admin/settings/pay_cod", label: "پرداخت در محل" },
  { href: "/admin/settings/pay_mock", label: "درگاه آزمایشی" },
  { href: "/admin/settings/torob", label: "API محصولات ترب" },
  { href: "/admin/settings/snappshop", label: "کاتالوگ اسنپ‌شاپ" },
];

export default async function PaymentsSettingsPage() {
  await requireStaff("manage_payments");
  return (
    <>
      <PageHeader title="درگاه‌ها و اتصال‌ها" back={{ href: "/admin/settings", label: "تنظیمات" }} />
      <Panel>
        <ul className="grid gap-2 sm:grid-cols-2">
          {LINKS.map((l) => (
            <li key={l.href}><Link href={l.href} className="btn btn-outline w-full justify-between">{l.label}</Link></li>
          ))}
        </ul>
      </Panel>
    </>
  );
}