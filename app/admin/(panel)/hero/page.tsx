import { requireStaff } from "@/lib/auth";
import { HeroForm } from "@/components/admin/settings-forms";
import { requireSettings } from "@/lib/admin-data";

export default async function HeroAdminPage() {
  await requireStaff("manage_appearance");
  const settings = await requireSettings();
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">هیرو سه‌بعدی</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">شکل حجم، رنگ، سرعت و تعداد ذرات بلافاصله روی صفحه اول اعمال می‌شود. دستگاه‌های ضعیف و حالت کاهش حرکت، نسخه سبک را می‌بینند.</p>
      </div>
      <HeroForm settings={settings} />
    </div>
  );
}
