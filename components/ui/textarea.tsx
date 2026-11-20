import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm leading-7 text-white outline-none placeholder:text-white/30 focus-visible:border-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
