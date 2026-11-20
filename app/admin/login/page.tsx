import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getSessionUser } from "@/lib/auth";

export const metadata = { robots: { index: false, follow: false }, title: "ورود مدیر" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getSessionUser().catch(() => null);
  if (user) redirect("/admin");
  const query = await searchParams;
  return (
    <div className="grid min-h-[100svh] place-items-center bg-[#070708] px-4 text-white" dir="rtl">
      <div className="w-full max-w-md">
        <p className="kicker">پنل</p>
        <h1 className="mt-3 text-4xl font-black">ورود به دکتر سایت</h1>
        <p className="mt-3 text-sm leading-7 text-white/55">مدیریت متن، ظاهر، نمونه‌کار و پیام‌ها. نشست در کوکی httpOnly می‌ماند.</p>
        <LoginForm nextPath={query.next || "/admin"} />
      </div>
    </div>
  );
}
