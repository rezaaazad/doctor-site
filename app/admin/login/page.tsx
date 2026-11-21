import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { getSessionUser } from "@/lib/auth";
import { getSiteSafe } from "@/lib/site";

export const metadata = { robots: { index: false, follow: false }, title: "ورود به پنل مدیریت" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getSessionUser().catch(() => null);
  if (user) redirect("/admin");
  const [query, site] = await Promise.all([searchParams, getSiteSafe()]);
  return (
    <div className="grid min-h-[100svh] lg:grid-cols-[1fr_1.1fr]">
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[400px]">
          <span className="grid size-12 place-items-center rounded-2xl bg-ink font-display text-xl font-black text-white">{site.settings.siteName.slice(0, 1)}</span>
          <h1 className="h-display mt-6 text-[1.9rem]">ورود به پنل {site.settings.siteName}</h1>
          <p className="mt-2 text-[0.92rem] text-muted">سفارش‌ها، محصولات، محتوا و تنظیمات سایت از همین‌جا مدیریت می‌شود.</p>
          <LoginForm nextPath={query.next || "/admin"} />
          <p className="mt-6 flex items-center gap-2 text-[0.78rem] text-muted">
            <ShieldCheck className="size-4 text-success" aria-hidden />
            نشست امن با کوکی httpOnly؛ پس از ۵ تلاش ناموفق، ورود ۱۵ دقیقه قفل می‌شود.
          </p>
        </div>
      </div>
      <div className="surface-ink grain relative m-3 hidden overflow-hidden rounded-[28px] lg:block">
        <div className="grid-lines absolute inset-0" aria-hidden />
        <div className="relative flex h-full flex-col justify-end p-12">
          <p className="eyebrow !text-white/70">پنل مدیریت</p>
          <p className="h-display mt-3 max-w-md text-[2.2rem] text-white">فروش امروز، سفارش‌های در انتظار و پیام‌های تازه؛ همه در یک نگاه.</p>
        </div>
      </div>
    </div>
  );
}
