import { BadgeCheck, Headphones, Lock, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { icon: Lock, title: "پرداخت امن", body: "اتصال رمزنگاری‌شده به درگاه‌های شتاب و تأیید سمت سرور" },
  { icon: Shield, title: "حریم خصوصی", body: "شماره موبایل و اطلاعات تماس فقط برای سفارش شما استفاده می‌شود" },
  { icon: BadgeCheck, title: "ضمانت تحویل", body: "دانلود فایل یا تحویل آنلاین پروژه همراه با پشتیبانی" },
  { icon: Headphones, title: "پشتیبانی فارسی", body: "پاسخ تیم در کمتر از یک روز کاری از طریق تیکت و تماس" },
] as const;

export function CheckoutTrustStrip({ compact, className }: { compact?: boolean; className?: string }) {
  const list = compact ? ITEMS.slice(0, 3) : ITEMS;
  return (
    <ul className={cn("grid gap-2", compact ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4", className)}>
      {list.map((item) => (
        <li key={item.title} className="flex items-start gap-2.5 rounded-xl border border-line bg-sunken/60 px-3 py-2.5">
          <item.icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0">
            <b className="block text-[0.8rem] leading-5">{item.title}</b>
            {!compact ? <span className="mt-0.5 block text-[0.72rem] leading-5 text-muted">{item.body}</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}