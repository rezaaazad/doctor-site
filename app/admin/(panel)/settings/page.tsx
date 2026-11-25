import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { OPTION_GROUPS } from "@/lib/options-schema";
import { can, type Capability } from "@/lib/roles";
import { PageHeader } from "@/components/admin/kit";

export const metadata = { title: "تنظیمات" };

const SECTIONS: { title: string; items: { href: string; label: string; description: string; cap: Capability }[] }[] = [
  {
    title: "سایت",
    items: [
      { href: "/admin/profile", label: "هویت، تماس و نماد اعتماد", description: "نام، تلفن، شبکه‌های اجتماعی و اینماد.", cap: "manage_settings" },
      { href: "/admin/appearance", label: "لوگو و فونت", description: "لوگو، فاویکن، فونت و رنگ.", cap: "manage_appearance" },
      ...["theme", "header", "reading", "seo"].map((id) => ({ id, g: OPTION_GROUPS.find((g) => g.id === id)! })).map(({ id, g }) => ({ href: `/admin/settings/${id}`, label: g.label, description: g.description, cap: g.cap as Capability })),
    ],
  },
  {
    title: "فروشگاه",
    items: ["store", "invoice"].map((id) => OPTION_GROUPS.find((g) => g.id === id)!).map((g) => ({ href: `/admin/settings/${g.id}`, label: g.label, description: g.description, cap: g.cap as Capability })),
  },
  {
    title: "پرداخت و اتصال‌ها",
    items: ["pay_zarinpal","pay_snapppay","pay_torobpay","pay_bank","pay_mock","torob","snappshop"].map(id=>OPTION_GROUPS.find(g=>g.id===id)!).map(g=>({href:`/admin/settings/${g.id}`,label:g.label,description:g.description,cap:g.cap as Capability})),
  },
  {
    title: "اطلاع‌رسانی",
    items: ["notify", "sms", "email", "telegram", "templates"].map((id) => OPTION_GROUPS.find((g) => g.id === id)!).map((g) => ({ href: `/admin/settings/${g.id}`, label: g.label, description: g.description, cap: g.cap as Capability })),
  },
];

export default async function SettingsIndex() {
  const user = await requireStaff();
  return (
    <>
      <PageHeader title="تنظیمات" description="هر بخش جداگانه ذخیره می‌شود. کلیدها و رمزها پس از ذخیره نمایش داده نمی‌شوند." />
      <div className="space-y-8">
        {SECTIONS.map((section) => {
          const items = section.items.filter((i) => can(user.role, i.cap));
          if (!items.length) return null;
          return (
            <section key={section.title}>
              <h2 className="mb-3 text-[0.85rem] font-bold text-muted">{section.title}</h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <Link key={item.href} href={item.href} className="group rounded-[18px] border border-line bg-surface p-4 shadow-1 transition hover:border-primary/40 hover:shadow-2">
                    <b className="flex items-center justify-between text-[0.95rem]">
                      {item.label}
                      <ArrowLeft className="size-4 text-muted transition-transform group-hover:-translate-x-1 group-hover:text-primary" aria-hidden />
                    </b>
                    <p className="mt-1.5 line-clamp-2 text-[0.8rem] leading-6 text-muted">{item.description}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
