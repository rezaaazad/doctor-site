import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { PageHeader, Panel } from "@/components/admin/kit";

export const metadata = { title: "کتابخانه محتوا" };

export default async function LibraryPage() {
  await requireStaff("manage_content");
  const links = [
    ["/admin/pricing", "تعرفه‌ها"],
    ["/admin/faq", "پرسش‌های رایج"],
    ["/admin/testimonials", "نظرات"],
    ["/admin/services", "خدمات"],
    ["/admin/projects", "نمونه‌کارها"],
    ["/admin/process", "مراحل همکاری"],
  ] as const;
  return (
    <>
      <PageHeader title="تعرفه، نظرات، پرسش‌ها…" />
      <Panel>
        <ul className="grid gap-2 sm:grid-cols-2">
          {links.map(([href, label]) => (
            <li key={href}><Link href={href} className="btn btn-outline w-full justify-start">{label}</Link></li>
          ))}
        </ul>
      </Panel>
    </>
  );
}