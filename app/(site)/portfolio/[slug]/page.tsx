import { decodeRouteSlug } from "@/lib/route-slug";
import { PhotoSlot } from "@/components/ui/photo-slot";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/site/json-ld";
import { getLocale, getSiteSafe } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { tr } from "@/lib/text";
import { siteUrl } from "@/lib/utils";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const slug = decodeRouteSlug((await params).slug);
  const site = await getSiteSafe();
  const project = site.projects.find((item) => item.slug === slug);
  if (!project) return {};
  const image = /\.(png|jpe?g|webp|gif|avif)$/i.test(project.coverUrl) ? project.coverUrl : "";
  return pageMetadata(
    {
      id: project.slug,
      path: `/portfolio/${project.slug}`,
      title: project.seoTitle || project.title,
      description: project.seoDescription || project.excerpt,
      ogImage: image,
      keywords: project.tags.join(","),
    },
    site.settings,
    `/portfolio/${project.slug}`,
  );
}

export default async function ProjectPage({ params }: Params) {
  const slug = decodeRouteSlug((await params).slug);
  const [site, locale] = await Promise.all([getSiteSafe(), getLocale()]);
  const index = site.projects.findIndex((item) => item.slug === slug);
  const project = site.projects[index];
  if (!project) notFound();
  const next = site.projects[(index + 1) % site.projects.length];
  const gallery = [project.coverUrl, ...project.images].filter((url, i, all) => url && all.indexOf(url) === i);
  const facts = [
    [locale === "en" ? "Client" : "کارفرما", project.client],
    [locale === "en" ? "Role" : "نقش", project.role],
    [locale === "en" ? "Year" : "سال", project.year],
  ].filter((row): row is [string, string] => Boolean(row[1]));
  return (
    <article className="wrap pad pb-16">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: tr(locale, project.title, project.titleEn),
          description: tr(locale, project.excerpt, project.excerptEn),
          dateCreated: project.year,
          url: `${siteUrl()}/portfolio/${project.slug}`,
          creator: { "@type": "Organization", name: site.settings.siteName },
        }}
      />
      <header style={{ paddingTop: "2rem" }}>
        <p className="kicker">
          <Link href="/portfolio">{locale === "en" ? "Work" : "نمونه‌کارها"}</Link>
          {project.year ? `  /  ${project.year}` : ""}
        </p>
        <h1 className="grad" style={{ fontSize: "clamp(32px, 6vw, 64px)" }}>{tr(locale, project.title, project.titleEn)}</h1>
        <p className="muted mt-3">{tr(locale, project.excerpt, project.excerptEn)}</p>
      </header>
      {project.coverUrl ? (
        <div className="relative mt-6 aspect-[4/3]"><PhotoSlot src={project.coverUrl} alt={project.title} sizes="100vw" priority />
        </div>
      ) : null}
      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <dl className="grid content-start gap-5">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="muted">{label}</dt>
              <dd className="mt-1 text-lg">{value}</dd>
            </div>
          ))}
          <div className="flex flex-wrap gap-2 text-base text-[var(--muted)]">
            {project.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </dl>
        <div className="grid gap-4">{tr(locale, project.body, project.bodyEn).split(/\n{2,}/).map((p) => <p key={p.slice(0, 18)}>{p}</p>)}</div>
      </div>
      {gallery.length > 1 ? (
        <div className="mt-8 grid gap-4">
          {gallery.slice(1).map((url, index) => (
            <div key={url} className="relative aspect-[4/3]"><PhotoSlot src={url} alt={`نمای ${index + 2} پروژه ${project.title}`} sizes="100vw" /></div>
          ))}
        </div>
      ) : null}
      {next && next.slug !== project.slug ? (
        <Link href={`/portfolio/${next.slug}`} className="mt-12 block border-t border-[var(--line)] py-8">
          <span className="kicker">{locale === "en" ? "Next" : "پروژه بعدی"}</span>
          <span className="mt-2 block text-3xl font-extrabold">{tr(locale, next.title, next.titleEn)}</span>
        </Link>
      ) : null}
    </article>
  );
}
