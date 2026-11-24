"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { listOf, str } from "@/lib/sections";
import type { ProductCard } from "@/lib/store/catalog";

export function StoreHero({ content, spotlight, dark }: {
  content: Record<string, unknown>;
  spotlight: ProductCard | null;
  dark: boolean;
}) {
  const slides = [
    {
      eyebrow: str(content.eyebrow), title: str(content.title), highlight: str(content.highlight),
      body: str(content.body), label: str(content.primaryLabel), href: str(content.primaryHref, "/store"),
      image: str(content.spotlightImage) || spotlight?.image || "/covers/atrium.svg",
    },
    ...listOf(content.slides).filter(slide => slide.title && slide.href),
  ];
  const [index, setIndex] = useState(0);
  const slide = slides[index] ?? slides[0];
  const move = (step: number) => setIndex((index + step + slides.length) % slides.length);
  return (
    <section className="campaign" data-light={!dark || undefined} aria-label="ویترین فروشگاه" aria-roledescription="اسلایدر">
      <div className="container-x campaign-grid" key={index}>
        <div className="campaign-copy" aria-live="polite">
          <p className="campaign-kicker">{slide.eyebrow}</p>
          <h1>{slide.title} <em>{slide.highlight}</em></h1>
          <p className="campaign-description">{slide.body}</p>
          <div className="campaign-links">
            <Link href={slide.href || "/store"}>{slide.label || "مشاهده محصولات"} <ArrowLeft size={18}/></Link>
            {index === 0 && str(content.secondaryLabel) && <Link href={str(content.secondaryHref) || "/contact"}>{str(content.secondaryLabel)}</Link>}
          </div>
        </div>
        <div className="campaign-stage">
          <div className="campaign-orbit" aria-hidden="true"/>
          <Link className="campaign-cover" href={index === 0 && spotlight ? `/store/${spotlight.slug}` : slide.href || "/store"} aria-label={index === 0 && spotlight ? spotlight.title : slide.title}>
            <Image unoptimized src={slide.image || "/covers/lumen.svg"} alt="" fill priority={index===0} sizes="(min-width: 900px) 42vw, 84vw"/>
          </Link>
          {index===0 && spotlight && <Link className="campaign-caption" href={`/store/${spotlight.slug}`}>{spotlight.title}<ArrowLeft size={16}/></Link>}
        </div>
      </div>
      {slides.length>1 && <div className="container-x campaign-controls">
        <button aria-label="اسلاید قبلی" onClick={()=>move(-1)}><ChevronRight/></button>
        <span dir="ltr">{new Intl.NumberFormat("fa").format(index+1)} / {new Intl.NumberFormat("fa").format(slides.length)}</span>
        <button aria-label="اسلاید بعدی" onClick={()=>move(1)}><ChevronLeft/></button>
      </div>}
    </section>
  );
}
