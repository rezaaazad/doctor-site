import Link from "next/link";
import { cn } from "@/lib/utils";
import { statusLabel, statusTone } from "@/lib/store/status";

export function SectionHead({
  eyebrow,
  title,
  body,
  action,
  align = "start",
  className,
  tone = "default",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  action?: { label: string; href: string };
  align?: "start" | "center";
  className?: string;
  tone?: "default" | "light";
}) {
  return (
    <div className={cn("mb-7 flex flex-wrap items-end justify-between gap-4 md:mb-10", align === "center" && "flex-col items-center text-center", className)}>
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? <span className={cn("eyebrow mb-3", tone === "light" && "!text-white/75")}>{eyebrow}</span> : null}
        <h2 className={cn("h-section", tone === "light" && "text-white")}>{title}</h2>
        {body ? <p className={cn("lead mt-3", tone === "light" && "!text-white/70")}>{body}</p> : null}
      </div>
      {action ? (
        <Link href={action.href} className={cn("btn btn-sm", tone === "light" ? "btn-light" : "btn-outline")}>
          {action.label}
          <span aria-hidden>←</span>
        </Link>
      ) : null}
    </div>
  );
}

export function EmptyState({ icon, title, body, action, className }: { icon?: React.ReactNode; title: string; body?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("card flex flex-col items-center px-6 py-12 text-center", className)}>
      {icon ? <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">{icon}</span> : null}
      <h3 className="font-display text-lg font-extrabold">{title}</h3>
      {body ? <p className="mt-2 max-w-sm text-[0.92rem] leading-7 text-muted">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = statusTone(status);
  return <span className={cn("badge", `badge-${tone}`, className)}>{statusLabel(status)}</span>;
}

export function Tone({ tone, children, className }: { tone: "success" | "warn" | "danger" | "info" | "muted" | "ink" | "gold"; children: React.ReactNode; className?: string }) {
  return <span className={cn("badge", `badge-${tone}`, className)}>{children}</span>;
}

export function Breadcrumbs({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="مسیر صفحه" className={cn("text-[0.8rem] text-muted", className)}>
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
            {item.href ? (
              <Link href={item.href} className="hover:text-fg">
                {item.label}
              </Link>
            ) : (
              <span className="text-fg" aria-current="page">
                {item.label}
              </span>
            )}
            {index < items.length - 1 ? <span aria-hidden className="opacity-50">/</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
