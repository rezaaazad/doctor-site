import Link from "next/link";
import { AlertTriangle, CheckCircle2, Info, OctagonAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { headingAnchor, safeUrl, videoEmbed, type Block } from "@/lib/blocks";
import { productCards } from "@/lib/store/catalog";
import { ProductGrid } from "@/components/store/product-card";
import { JsonLd } from "@/components/site/json-ld";

/** Renders **bold**, *italic*, `code` and [label](url) without HTML injection. */
export function Inline({ text }: { text: string }) {
  const nodes: React.ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[1]) nodes.push(<strong key={k++}>{m[1]}</strong>);
    else if (m[2]) nodes.push(<em key={k++}>{m[2]}</em>);
    else if (m[3]) nodes.push(<code key={k++}>{m[3]}</code>);
    else if (m[4]) {
      const href = safeUrl(m[5]);
      if (!href) nodes.push(m[4]);
      else if (href.startsWith("/")) nodes.push(<Link key={k++} href={href}>{m[4]}</Link>);
      else nodes.push(<a key={k++} href={href} target="_blank" rel="noopener noreferrer nofollow">{m[4]}</a>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return (
    <>
      {nodes.map((n, i) =>
        typeof n === "string" ? (
          <span key={`t${i}`}>
            {n.split("\n").map((line, j, all) => (
              <span key={j}>
                {line}
                {j < all.length - 1 ? <br /> : null}
              </span>
            ))}
          </span>
        ) : (
          n
        ),
      )}
    </>
  );
}

const CALLOUT = {
  info: { icon: Info, cls: "bg-primary-soft text-primary" },
  success: { icon: CheckCircle2, cls: "bg-success-soft text-success" },
  warn: { icon: AlertTriangle, cls: "bg-gold-soft text-[color-mix(in_oklab,var(--gold)_45%,black)]" },
  danger: { icon: OctagonAlert, cls: "bg-urgency-soft text-urgency" },
};

export async function Blocks({ blocks, className }: { blocks: Block[]; className?: string }) {
  const faqs = blocks.flatMap((b) => (b.type === "faq" ? b.items.filter((i) => i.q && i.a) : []));
  const productSets = await Promise.all(
    blocks.map((b) => (b.type === "products" && b.slugs.length ? productCards({ slug: { in: b.slugs } }, [{ sortOrder: "asc" }], 12).catch(() => []) : Promise.resolve(null))),
  );
  return (
    <div className={cn("prose-fa", className)}>
      {faqs.length ? (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      ) : null}
      {blocks.map((b, i) => {
        switch (b.type) {
          case "heading": {
            const Tag = b.level === 3 ? "h3" : "h2";
            return (
              <Tag key={b.id} id={headingAnchor(b, i)}>
                {b.text}
              </Tag>
            );
          }
          case "paragraph":
            return b.text.trim() ? (
              <p key={b.id}>
                <Inline text={b.text} />
              </p>
            ) : null;
          case "list": {
            if (b.style === "check")
              return (
                <ul key={b.id} className="!list-none !ps-0">
                  {b.items.filter(Boolean).map((item, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <CheckCircle2 className="mt-[0.45em] size-[1.05em] shrink-0 text-success" aria-hidden />
                      <span>
                        <Inline text={item} />
                      </span>
                    </li>
                  ))}
                </ul>
              );
            const Tag = b.style === "number" ? "ol" : "ul";
            return (
              <Tag key={b.id}>
                {b.items.filter(Boolean).map((item, j) => (
                  <li key={j}>
                    <Inline text={item} />
                  </li>
                ))}
              </Tag>
            );
          }
          case "image":
            return b.url ? (
              <figure key={b.id} className={cn(b.width === "wide" && "md:-mx-12", b.width === "full" && "md:-mx-24")}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.url} alt={b.alt} loading="lazy" decoding="async" className="w-full" />
                {b.caption ? <figcaption className="mt-2 text-center text-[0.85rem] text-muted">{b.caption}</figcaption> : null}
              </figure>
            ) : null;
          case "gallery":
            return b.images.length ? (
              <div key={b.id} className="grid grid-cols-2 gap-2 md:grid-cols-3">
                {b.images.map((img, j) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={j} src={img.url} alt={img.alt} loading="lazy" className="aspect-square w-full object-cover" />
                ))}
              </div>
            ) : null;
          case "quote":
            return (
              <blockquote key={b.id}>
                <Inline text={b.text} />
                {b.cite ? <cite className="mt-2 block text-[0.85rem] not-italic text-muted">— {b.cite}</cite> : null}
              </blockquote>
            );
          case "callout": {
            const c = CALLOUT[b.tone];
            const Icon = c.icon;
            return (
              <div key={b.id} className={cn("flex gap-3 rounded-[var(--r)] p-4", c.cls)}>
                <Icon className="mt-1 size-5 shrink-0" aria-hidden />
                <div className="text-fg">
                  {b.title ? <b className="block">{b.title}</b> : null}
                  <Inline text={b.text} />
                </div>
              </div>
            );
          }
          case "button":
            return b.label && b.href ? (
              <p key={b.id}>
                <Link href={b.href} className={cn("btn !no-underline", `btn-${b.style}`, b.style !== "outline" && "!text-white")}>
                  {b.label}
                </Link>
              </p>
            ) : null;
          case "faq":
            return (
              <div key={b.id} className="space-y-2">
                {b.items
                  .filter((f) => f.q)
                  .map((f, j) => (
                    <details key={j} className="group card !mt-0 overflow-hidden">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 font-bold [&::-webkit-details-marker]:hidden">
                        {f.q}
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sunken transition-transform group-open:rotate-45">+</span>
                      </summary>
                      <p className="px-4 pb-4 text-muted">
                        <Inline text={f.a} />
                      </p>
                    </details>
                  ))}
              </div>
            );
          case "video": {
            const src = videoEmbed(b.url);
            return src ? (
              <figure key={b.id}>
                <div className="relative aspect-video overflow-hidden rounded-[var(--r)] bg-ink">
                  <iframe src={src} title={b.caption || "ویدیو"} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="absolute inset-0 size-full" />
                </div>
                {b.caption ? <figcaption className="mt-2 text-center text-[0.85rem] text-muted">{b.caption}</figcaption> : null}
              </figure>
            ) : null;
          }
          case "code":
            return (
              <pre key={b.id}>
                <code>{b.code}</code>
              </pre>
            );
          case "table":
            return b.rows.length ? (
              <div key={b.id} className="overflow-x-auto">
                <table>
                  {b.header ? (
                    <thead>
                      <tr>
                        {b.rows[0].map((c, j) => (
                          <th key={j}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                  ) : null}
                  <tbody>
                    {(b.header ? b.rows.slice(1) : b.rows).map((row, j) => (
                      <tr key={j}>
                        {row.map((c, x) => (
                          <td key={x}>
                            <Inline text={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null;
          case "products": {
            const products = productSets[i];
            return products && products.length ? (
              <div key={b.id} className="not-prose">
                {b.title ? <h3>{b.title}</h3> : null}
                <ProductGrid products={products} className="!mt-3 lg:grid-cols-3" />
              </div>
            ) : null;
          }
          case "divider":
            return <hr key={b.id} className="divider my-8" />;
          default:
            return null;
        }
      })}
    </div>
  );
}

export function Toc({ blocks }: { blocks: Block[] }) {
  const items = blocks.map((b, i) => (b.type === "heading" ? { level: b.level, text: b.text, id: headingAnchor(b, i) } : null)).filter((x): x is { level: 2 | 3; text: string; id: string } => Boolean(x && x.text));
  if (items.length < 2) return null;
  return (
    <nav aria-label="فهرست مطالب" className="card p-4">
      <b className="text-[0.85rem]">فهرست مطالب</b>
      <ol className="mt-2 space-y-1.5 text-[0.85rem]">
        {items.map((item) => (
          <li key={item.id} className={cn(item.level === 3 && "ps-3")}>
            <a href={`#${item.id}`} className="text-muted hover:text-primary">
              {item.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
