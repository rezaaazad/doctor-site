"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";
import type { ProductDetail } from "@/lib/store/catalog";
import { ProductImage } from "./product-card";

export function ProductGallery({ product, image }: { product: ProductDetail; image: string }) {
  const images = [...new Set([image, product.image, ...product.images].filter(Boolean))];
  const [index, setIndex] = useState(0);
  const current = { ...product, image: images[index] || "" };
  const modal = useRef<HTMLDialogElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  function move(step: number) {
    if (images.length) setIndex((i) => (i + step + images.length) % images.length);
  }
  const swipe = {
    onTouchStart: (e: React.TouchEvent) => {
      swiped.current = false;
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    },
    onTouchEnd: (e: React.TouchEvent) => {
      if (!start.current) return;
      const dx = e.changedTouches[0].clientX - start.current.x;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(e.changedTouches[0].clientY - start.current.y)) {
        move(dx > 0 ? 1 : -1);
        swiped.current = true;
      }
      start.current = null;
    },
  };
  return (
    <div>
      <button
        className="gallery-main"
        aria-label="بزرگ‌نمایی تصویر محصول"
        disabled={!images.length}
        {...swipe}
        onClick={() => {
          if (!swiped.current) modal.current?.showModal();
          swiped.current = false;
        }}
      >
        <ProductImage product={current} priority sizes="(min-width:1024px) 45vw, 100vw" />
        {images.length > 0 && (
          <span>
            <ZoomIn size={18} />
          </span>
        )}
      </button>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={src}
              aria-pressed={i === index}
              aria-label={`تصویر ${(i + 1).toLocaleString("fa-IR")}`}
              onClick={() => setIndex(i)}
            >
              <ProductImage product={{ ...product, image: src }} sizes="64px" />
            </button>
          ))}
        </div>
      )}
      <dialog
        ref={modal}
        className="gallery-dialog"
        aria-label={product.title}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") move(1);
          if (e.key === "ArrowRight") move(-1);
        }}
      >
        <div className="gallery-dialog-bar">
          <b>{product.title}</b>
          <button className="btn btn-icon" aria-label="بستن تصویر" onClick={() => modal.current?.close()}>
            <X />
          </button>
        </div>
        <div className="gallery-zoom" {...swipe}>
          <ProductImage product={current} sizes="90vw" />
        </div>
        {images.length > 1 && (
          <div className="gallery-dialog-controls">
            <button aria-label="تصویر قبلی" onClick={() => move(-1)}>
              <ChevronRight />
            </button>
            {(index + 1).toLocaleString("fa-IR")} / {images.length.toLocaleString("fa-IR")}
            <button aria-label="تصویر بعدی" onClick={() => move(1)}>
              <ChevronLeft />
            </button>
          </div>
        )}
      </dialog>
    </div>
  );
}
