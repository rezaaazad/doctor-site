"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, type CartLine } from "@/components/store/cart";

export function AddToCartButton({
  line,
  disabled,
  className,
  label = "افزودن به سبد",
  size,
  variant = "action",
  quantity = 1,
  iconOnly = false,
}: {
  line: Omit<CartLine, "quantity">;
  disabled?: boolean;
  className?: string;
  label?: string;
  size?: "sm" | "lg";
  variant?: "action" | "ink" | "outline";
  quantity?: number;
  iconOnly?: boolean;
}) {
  const { add } = useCart();
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        add({ ...line, quantity });
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className={cn("btn", `btn-${variant}`, size ? `btn-${size}` : "", iconOnly && "btn-icon", className)}
      aria-label={iconOnly ? label : undefined}
    >
      {done ? <Check className="size-[18px] anim-pop" aria-hidden /> : <ShoppingBag className="size-[18px]" aria-hidden />}
      {iconOnly ? null : <span>{done ? "به سبد اضافه شد" : label}</span>}
    </button>
  );
}
