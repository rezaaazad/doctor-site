import Image from "next/image";
import Link from "next/link";
import { ArrowUpLeft } from "lucide-react";
import { listOf, str } from "@/lib/sections";

export function PromoStrip({content}: {content: Record<string, unknown>}) {
  const banners = listOf(content.promos).filter(item => item.href && item.title);
  if (!banners.length) return null;
  return <div className="container-x promo-strip" data-count={banners.length}>
    {banners.map((item,i)=><Link key={i} href={item.href}>
      {item.image && <Image unoptimized fill src={item.image} alt="" sizes="(min-width: 800px) 33vw, 90vw"/>}
      <strong>{item.title}</strong><ArrowUpLeft aria-hidden/>
    </Link>)}
  </div>;
}

export function StoreIntro({content}: {content: Record<string, unknown>}) {
  if (!str(content.seoBody)) return null;
  return <section className="container-x store-intro"><h2>{str(content.seoTitle)}</h2><p>{str(content.seoBody)}</p></section>;
}
