import { SectionForm } from "@/components/admin/section-form";
import { prisma } from "@/lib/db";
import { PAGE_LABELS } from "@/lib/section-forms";
import { asObject } from "@/lib/utils";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const query = await searchParams;
  const page = query.page && PAGE_LABELS[query.page] ? query.page : "home";
  const sections = await prisma.section.findMany({ where: { page }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">متن‌ها</h1>
        <p className="mt-2 text-sm text-white/50">هر بخش را می‌توانید پنهان کنید، جابه‌جا کنید، یا متن فارسی و انگلیسی‌اش را عوض کنید.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(PAGE_LABELS).map(([key, label]) => (
          <a key={key} href={`/admin/content?page=${key}`} className={`rounded-full px-4 py-2 text-sm ${page === key ? "bg-[var(--accent)] text-black" : "border border-white/10"}`}>{label}</a>
        ))}
      </div>
      <div className="grid gap-5">
        {sections.map((section) => (
          <SectionForm
            key={section.id}
            section={{ ...section, content: asObject(section.content) }}
          />
        ))}
      </div>
    </div>
  );
}
