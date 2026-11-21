import { cn } from "@/lib/utils";
import { formatNumber, percentOff } from "@/lib/money";

type Props = {
  /** Price in Rial. */
  value: number | bigint;
  /** Compare-at (before discount) price in Rial. */
  compareAt?: number | bigint | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showPercent?: boolean;
  free?: string;
  tone?: "default" | "light";
};

const sizes = {
  sm: { main: "text-[0.98rem]", unit: "text-[0.7rem]", old: "text-[0.75rem]" },
  md: { main: "text-[1.12rem]", unit: "text-[0.72rem]", old: "text-[0.8rem]" },
  lg: { main: "text-[1.5rem]", unit: "text-[0.8rem]", old: "text-[0.9rem]" },
  xl: { main: "text-[1.9rem] md:text-[2.2rem]", unit: "text-[0.85rem]", old: "text-[0.95rem]" },
};

export function Price({ value, compareAt, size = "md", className, showPercent = true, free = "رایگان", tone = "default" }: Props) {
  const rial = Number(value);
  const old = Number(compareAt ?? 0);
  const pct = old > rial ? percentOff(rial, old) : 0;
  const s = sizes[size];
  if (rial <= 0) return <span className={cn("font-display font-extrabold text-success", s.main, className)}>{free}</span>;
  return (
    <span className={cn("inline-flex flex-col items-start gap-0.5 leading-none", className)}>
      {pct > 0 ? (
        <span className="flex items-center gap-2">
          <del className={cn("num decoration-1", tone === "light" ? "text-white/55" : "text-muted", s.old)}>{formatNumber(Math.floor(old / 10))}</del>
          {showPercent ? <span className="badge badge-urgency !h-5 !px-1.5 !text-[0.68rem] num">٪{formatNumber(pct)}</span> : null}
        </span>
      ) : null}
      <span className="flex items-baseline gap-1">
        <b className={cn("num font-display font-extrabold tracking-tight", s.main)}>{formatNumber(Math.floor(rial / 10))}</b>
        <span className={cn("font-medium", tone === "light" ? "text-white/70" : "text-muted", s.unit)}>تومان</span>
      </span>
    </span>
  );
}
