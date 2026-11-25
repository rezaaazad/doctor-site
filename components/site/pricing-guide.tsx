import Link from "next/link";
import { FaqList, PricingPlans } from "@/components/home/sections";
import { sectionOn, type SiteData } from "@/lib/site";

export function PricingGuide({ site }: { site: SiteData }) {
  const plans = site.packages;
  const pricing = sectionOn(site, "home", "pricingPlans") ?? sectionOn(site, "home", "pricing");
  const features = [...new Set(plans.flatMap(plan => plan.features))];
  return <>
    <PricingPlans packages={plans} content={{ title: "بسته‌های همکاری", ...pricing?.content }} />
    {features.length > 0 && <section className="container-x mt-12">
      <div className="card overflow-x-auto" tabIndex={0} role="region" aria-label="جدول مقایسه بسته‌ها">
        <table className="w-full text-start text-sm">
          <caption className="p-5 text-start font-display text-xl font-bold">مقایسه امکانات بسته‌ها</caption>
          <thead className="bg-primary-soft"><tr><th scope="col" className="p-4 text-start">امکانات</th>{plans.map(p => <th key={p.id} scope="col" className="min-w-28 p-3">{p.name}</th>)}</tr></thead>
          <tbody>{features.map(f => <tr key={f} className="border-t border-line"><th scope="row" className="min-w-40 p-4 text-start">{f}</th>{plans.map(p => <td key={p.id} className="p-3 text-center">{p.features.includes(f) ? "دارد" : "—"}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </section>}
    <FaqList content={{title:"پرسش‌های پیش از سفارش", limit:site.faqs.length}} faqs={site.faqs} />
    <section className="container-x my-16"><div className="surface-ink rounded-[var(--r)] p-8 md:p-12">
      <h2 className="h-section text-white">درباره پروژه‌تان صحبت کنیم</h2>
      <p className="my-5 leading-8 text-white/85">مشاوره اولیه رایگان، پیشنهاد قیمت مکتوب و پشتیبانی پس از راه‌اندازی طبق قرارداد.</p>
      <Link className="btn bg-white text-ink" href="/contact">درخواست مشاوره رایگان</Link>
    </div></section>
  </>;
}
