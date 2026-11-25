import Link from "next/link";
import { PhotoSlot } from "@/components/ui/photo-slot";

export function MarketingHero({ kicker, title, body, image, secondary }: {
  kicker: string; title: string; body: string; image: string; secondary?: { href: string; label: string };
}) {
  return <header className="container-x pt-6">
    <div className="card-raised grid overflow-hidden lg:grid-cols-2">
      <div className="flex flex-col items-start justify-center p-6 md:p-12">
        <p className="eyebrow">{kicker}</p><h1 className="mt-4 font-display text-4xl leading-snug font-black md:text-5xl">{title}</h1>
        <p className="my-5 max-w-xl leading-8 text-muted">{body}</p>
        <div className="flex flex-wrap gap-2"><Link href="/contact" className="btn btn-primary">درخواست مشاوره</Link>
          {secondary && <a href={secondary.href} className="btn btn-outline">{secondary.label}</a>}</div>
      </div>
      <div className="relative min-h-52 bg-sunken md:min-h-80"><PhotoSlot src={image} alt={title} sizes="(min-width:1024px) 50vw, 100vw" priority /></div>
    </div>
  </header>;
}
