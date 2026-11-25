"use client";

import Image from "next/image";
import { useState } from "react";
import { ProductArt } from "@/components/ui/product-art";

type Props = {
  src?: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  fallback?: React.ReactNode;
};

export function PhotoSlot({ src, alt, sizes, priority, className = "object-cover", fallback }: Props) {
  const [failed, setFailed] = useState("");
  if (!src || failed === src || /^\/covers\/(noir|orbit|lumen|atrium|glyph)\.svg$/.test(src)) {
    return fallback ?? <ProductArt seed={alt} title={alt} type="digital" className="size-full" />;
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className}
    unoptimized={!/^\/(media|images|covers)\/[^?]+\.(webp|avif|jpe?g|png)$/i.test(src)}
    onError={() => setFailed(src)} />;
}
