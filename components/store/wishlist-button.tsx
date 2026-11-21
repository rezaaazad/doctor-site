"use client";

import { useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleWishlistAction } from "@/lib/actions/shop";

export function WishlistButton({ productId, initial = false, className, withLabel = false }: { productId: string; initial?: boolean; className?: string; withLabel?: boolean }) {
  const [wished, setWished] = useState(initial);
  const [pending, start] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  return (
    <button
      type="button"
      aria-pressed={wished}
      aria-label={wished ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      disabled={pending}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const prev = wished;
        setWished(!prev);
        start(async () => {
          const res = await toggleWishlistAction(productId);
          if (res.login) {
            setWished(prev);
            router.push(`/account/login?next=${encodeURIComponent(pathname)}`);
            return;
          }
          if (!res.ok) setWished(prev);
          else setWished(Boolean(res.wished));
        });
      }}
      className={cn(
        "z-[2] grid place-items-center rounded-full transition-[transform,background] active:scale-90",
        withLabel ? "btn btn-outline" : "size-9 bg-white/90 shadow-1 backdrop-blur hover:bg-white",
        className,
      )}
    >
      <Heart className={cn("size-[18px] transition-colors", wished ? "fill-urgency text-urgency" : "text-ink")} aria-hidden />
      {withLabel ? <span>{wished ? "در علاقه‌مندی‌ها" : "علاقه‌مندی"}</span> : null}
    </button>
  );
}
