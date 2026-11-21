import Link from "next/link";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/money";

export function PageHeader({
  title,
  description,
  actions,
  back,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-[0.8rem] font-semibold text-muted hover:text-primary">
            <ChevronRight className="size-4" aria-hidden />
            {back.label}
          </Link>
        ) : null}
        <h1 className="font-display text-[1.45rem] leading-tight font-extrabold md:text-[1.7rem]">{title}</h1>
        {description ? <p className="mt-1.5 max-w-3xl text-[0.88rem] leading-7 text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  id,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
}) {
  return (
    <section id={id} className={cn("rounded-[18px] border border-line bg-surface shadow-1", className)}>
      {title || actions ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5 md:px-5">
          <div className="min-w-0">
            {title ? <h2 className="text-[0.98rem] font-bold">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-[0.8rem] leading-6 text-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={cn("p-4 md:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "primary" | "success" | "action" | "urgency";
  href?: string;
}) {
  const toneCls = {
    default: "bg-sunken text-fg",
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    action: "bg-action-soft text-action",
    urgency: "bg-urgency-soft text-urgency",
  }[tone];
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[0.8rem] font-semibold text-muted">{label}</span>
        {icon ? <span className={cn("grid size-9 place-items-center rounded-xl", toneCls)}>{icon}</span> : null}
      </div>
      <p className="num mt-2 font-display text-[1.5rem] leading-tight font-extrabold">{value}</p>
      {hint ? <p className="mt-1 text-[0.76rem] text-muted">{hint}</p> : null}
    </>
  );
  const cls = "block rounded-[18px] border border-line bg-surface p-4 shadow-1 transition hover:border-[color-mix(in_oklab,var(--text)_18%,var(--border))]";
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Responsive table: horizontal scroll on small screens. */
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-4 overflow-x-auto md:-mx-5", className)}>
      <table className="w-full min-w-[640px] border-collapse text-[0.86rem]">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("border-b border-line bg-sunken/60 px-4 py-2.5 text-start text-[0.75rem] font-bold whitespace-nowrap text-muted first:ps-4 md:first:ps-5", className)}>{children}</th>;
}

export function Td({ children, className, colSpan }: { children?: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn("border-b border-line px-4 py-3 align-middle first:ps-4 md:first:ps-5", className)}>
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-[0.9rem] text-muted">
        {children}
      </td>
    </tr>
  );
}

function withParams(base: string, params: Record<string, string | undefined>, patch: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...patch })) if (v) sp.set(k, v);
  const q = sp.toString();
  return q ? `${base}?${q}` : base;
}

export function Pagination({ page, pages, total, base, params }: { page: number; pages: number; total: number; base: string; params: Record<string, string | undefined> }) {
  if (pages <= 1) return <p className="mt-4 text-[0.8rem] text-muted num">{formatNumber(total)} مورد</p>;
  return (
    <nav className="mt-4 flex items-center justify-between gap-3 text-[0.85rem]" aria-label="صفحه‌بندی">
      <span className="num text-muted">
        {formatNumber(total)} مورد · صفحه {formatNumber(page)} از {formatNumber(pages)}
      </span>
      <span className="flex gap-2">
        {page > 1 ? (
          <Link className="btn btn-outline btn-sm" href={withParams(base, params, { page: String(page - 1) })}>
            <ChevronRight className="size-4" aria-hidden /> قبلی
          </Link>
        ) : null}
        {page < pages ? (
          <Link className="btn btn-outline btn-sm" href={withParams(base, params, { page: String(page + 1) })}>
            بعدی <ChevronLeft className="size-4" aria-hidden />
          </Link>
        ) : null}
      </span>
    </nav>
  );
}

/** GET filter bar. Keeps other params as hidden inputs. */
export function FilterBar({
  base,
  params,
  search = true,
  placeholder = "جستجو…",
  selects = [],
  children,
}: {
  base: string;
  params: Record<string, string | undefined>;
  search?: boolean;
  placeholder?: string;
  selects?: { name: string; label: string; options: { value: string; label: string }[] }[];
  children?: React.ReactNode;
}) {
  const own = new Set(["q", "page", ...selects.map((s) => s.name)]);
  return (
    <form action={base} className="mb-4 flex flex-wrap items-center gap-2">
      {Object.entries(params)
        .filter(([k, v]) => v && !own.has(k))
        .map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      {search ? (
        <label className="relative min-w-[200px] flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input name="q" defaultValue={params.q ?? ""} placeholder={placeholder} className="input !min-h-10 !pr-9" />
        </label>
      ) : null}
      {selects.map((s) => (
        <select key={s.name} name={s.name} defaultValue={params[s.name] ?? ""} aria-label={s.label} className="input !min-h-10 !w-auto">
          <option value="">{s.label}: همه</option>
          {s.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      {children}
      <button type="submit" className="btn btn-ink btn-sm !min-h-10">
        اعمال
      </button>
    </form>
  );
}

export function Tabs({ items, active }: { items: { href: string; label: string; key: string; count?: number }[]; active: string }) {
  return (
    <div className="scrollbar-none mb-4 flex gap-1 overflow-x-auto border-b border-line">
      {items.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={cn(
            "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-[0.86rem] font-semibold",
            active === t.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-fg",
          )}
        >
          {t.label}
          {t.count !== undefined ? <span className="num rounded-full bg-sunken px-1.5 text-[0.7rem] text-muted">{formatNumber(t.count)}</span> : null}
        </Link>
      ))}
    </div>
  );
}

export function KeyValue({ items, className }: { items: { label: string; value: React.ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("grid gap-x-4 gap-y-2.5 text-[0.86rem] sm:grid-cols-[minmax(110px,auto)_1fr]", className)}>
      {items.map((i) => (
        <div key={i.label} className="contents">
          <dt className="text-muted">{i.label}</dt>
          <dd className="min-w-0 font-medium break-words">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function FormGrid({ children, cols = 2, className }: { children: React.ReactNode; cols?: 1 | 2 | 3; className?: string }) {
  return <div className={cn("grid gap-4", cols === 2 && "md:grid-cols-2", cols === 3 && "md:grid-cols-3", className)}>{children}</div>;
}

export function parsePage(value: string | undefined) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}
