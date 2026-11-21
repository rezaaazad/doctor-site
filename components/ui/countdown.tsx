"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const fa = (n: number) => String(n).padStart(2, "0").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Honest countdown: renders nothing once the real end date has passed. */
export function Countdown({ endsAt, className, tone = "dark", compact = false }: { endsAt: string; className?: string; tone?: "dark" | "light"; compact?: boolean }) {
  const end = new Date(endsAt).getTime();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  if (!Number.isFinite(end)) return null;
  if (now !== null && end <= now) return null;
  const p = parts(now === null ? 0 : end - now);
  const cells = [
    ...(p.d > 0 ? [{ v: p.d, l: "روز" }] : []),
    { v: p.h, l: "ساعت" },
    { v: p.m, l: "دقیقه" },
    { v: p.s, l: "ثانیه" },
  ];
  if (compact) {
    return (
      <span className={cn("num inline-flex items-center gap-1 font-bold", className)} aria-live="off" suppressHydrationWarning>
        {now === null ? "—" : `${p.d > 0 ? `${fa(p.d)} روز و ` : ""}${fa(p.h)}:${fa(p.m)}:${fa(p.s)}`}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} aria-label="زمان باقی‌مانده تا پایان پیشنهاد">
      {cells.map((cell, index) => (
        <span key={cell.l} className="flex items-center gap-1.5">
          <span
            className={cn(
              "flex min-w-[46px] flex-col items-center rounded-xl px-2 py-1.5 leading-none",
              tone === "dark" ? "bg-ink text-white" : "bg-white/12 text-white ring-1 ring-white/15",
            )}
          >
            <b className="num font-display text-[1.15rem]" suppressHydrationWarning>
              {now === null ? "--" : fa(cell.v)}
            </b>
            <small className="mt-1 text-[0.62rem] opacity-70">{cell.l}</small>
          </span>
          {index < cells.length - 1 ? <span className={cn("font-bold", tone === "dark" ? "text-ink/40" : "text-white/40")}>:</span> : null}
        </span>
      ))}
    </span>
  );
}
