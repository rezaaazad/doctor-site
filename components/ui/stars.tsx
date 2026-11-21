import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/money";

export function Stars({ value, count, size = 14, className, showValue = true }: { value: number; count?: number; size?: number; className?: string; showValue?: boolean }) {
  const rounded = Math.round(value * 2) / 2;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} aria-label={`امتیاز ${value.toFixed(1)} از ۵`}>
      <span className="flex items-center" aria-hidden>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className="relative" style={{ width: size, height: size }}>
            <Star width={size} height={size} className="absolute inset-0 text-line" fill="currentColor" strokeWidth={0} />
            {rounded >= i - 0.5 ? (
              <span className="absolute inset-0 overflow-hidden" style={{ width: rounded >= i ? "100%" : "50%", insetInlineStart: 0 }}>
                <Star width={size} height={size} className="text-gold" fill="currentColor" strokeWidth={0} />
              </span>
            ) : null}
          </span>
        ))}
      </span>
      {showValue ? (
        <span className="num text-[0.78rem] font-bold">
          {value > 0 ? value.toLocaleString("fa-IR", { maximumFractionDigits: 1, minimumFractionDigits: 1 }) : "—"}
          {count !== undefined ? <span className="font-medium text-muted"> ({formatNumber(count)})</span> : null}
        </span>
      ) : null}
    </span>
  );
}
