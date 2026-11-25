import { cn } from "@/lib/utils";

export function PageHero({
  crumb,

  title,
  body,
  className,
}: {
  crumb?: string;
  headline?: string;
  title: string;
  body?: string;
  className?: string;
}) {
  return (
    <header className={cn("container-x pb-6 pt-10 md:pt-16", className)} data-reveal>
      {crumb ? <p className="kicker">{crumb}</p> : null}
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-snug font-black md:text-5xl">{title}</h1>
      {body ? <p className="mt-4 max-w-2xl text-[0.95rem] leading-8 text-muted">{body}</p> : null}
    </header>
  );
}

export const fallbackTypes = ["سایت فروشگاهی", "سایت شرکتی", "اپلیکیشن", "سئو و تبلیغات", "نامشخص"];
export const fallbackBudgets = ["زیر ۲۰ میلیون", "۲۰ تا ۵۰ میلیون", "۵۰ تا ۱۰۰ میلیون", "بیشتر از ۱۰۰ میلیون", "هنوز مشخص نیست"];