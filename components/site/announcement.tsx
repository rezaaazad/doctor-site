import Link from "next/link";
import { Countdown } from "@/components/ui/countdown";

export function Announcement({ text, href, endsAt }: { text: string; href: string; endsAt: string }) {
  if (!text) return null;
  const ends = endsAt && new Date(endsAt).getTime() > Date.now() ? endsAt : "";
  const inner = (
    <span className="flex items-center justify-center gap-3">
      <span className="truncate">{text}</span>
      {ends ? (
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 sm:flex">
          <span className="text-white/60">پایان:</span>
          <Countdown endsAt={ends} compact className="text-gold" />
        </span>
      ) : null}
    </span>
  );
  return (
    <div className="relative z-50 bg-ink text-[0.78rem] font-semibold text-white md:text-[0.82rem]">
      <div className="container-x flex h-9 items-center justify-center">
        {href ? (
          <Link href={href} className="min-w-0 hover:text-white/85">
            {inner}
          </Link>
        ) : (
          inner
        )}
      </div>
    </div>
  );
}
