import { cn } from "@/lib/utils";

export function PageHero({
  crumb,
  headline,
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
    <header className={cn("wrap pad pb-8 pt-6 md:pb-10", className)} data-reveal>
      {crumb ? <p className="kicker">{crumb}</p> : null}
      {headline ? <p className="mt-2 font-display text-[2.4rem] leading-none font-extrabold text-muted md:text-[3rem]">{headline}</p> : null}
      <h1 className="mt-3 max-w-3xl font-display text-[1.65rem] font-extrabold md:text-[2.2rem]">{title}</h1>
      {body ? <p className="mt-4 max-w-2xl text-[0.95rem] leading-8 text-muted">{body}</p> : null}
    </header>
  );
}

export const fallbackTypes = ["سایت فروشگاهی", "سایت شرکتی", "اپلیکیشن", "سئو و تبلیغات", "نامشخص"];
export const fallbackBudgets = ["زیر ۲۰ میلیون", "۲۰ تا ۵۰ میلیون", "۵۰ تا ۱۰۰ میلیون", "بیشتر از ۱۰۰ میلیون", "هنوز مشخص نیست"];