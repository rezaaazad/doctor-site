"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import type { CategoryView } from "@/lib/store/catalog";
import { Drawer } from "@/components/ui/drawer";

const sorts = [
  ["", "پیشنهادی"],
  ["newest", "جدیدترین"],
  ["bestseller", "پرفروش‌ترین"],
  ["cheap", "ارزان‌ترین"],
  ["expensive", "گران‌ترین"],
  ["rating", "بیشترین امتیاز"],
];
export function CatalogToolbar({
  categories,
  total,
  category,
  children,
}: {
  categories: CategoryView[];
  total: number;
  category?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [open, setOpen] = useState(false);
  const base = category ? `/store/category/${category}` : "/store";
  const activeCategory = category || sp.get("category") || "";
  function destination(key: string, value: string) {
    const params = new URLSearchParams(sp);
    params.delete("page");
    if (value) params.set(key, value);
    else params.delete(key);
    return (key === "category" ? "/store" : base) + (params.size ? "?" + params : "");
  }
  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams(sp);
    params.delete("page");
    for (const key of ["category", "q", "min", "max", "sale", "stock"]) {
      const value = String(form.get(key) || "").trim();
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const keepCategory = category && params.get("category") === category;
    if (keepCategory) params.delete("category");
    router.push((keepCategory ? base : "/store") + (params.size ? "?" + params : ""));
    setOpen(false);
  }
  const filters = (
    <form key={base + sp.toString()} onSubmit={apply} className="catalog-filter-form">
      <label>
        جست‌وجو
        <input className="input" name="q" defaultValue={sp.get("q") || ""} placeholder="نام محصول یا برند" />
      </label>
      <label>
        دسته‌بندی
        <select className="input" name="category" defaultValue={activeCategory}>
          <option value="">همه دسته‌ها</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>محدوده قیمت (تومان)</legend>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["min", "از"],
            ["max", "تا"],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input
                name={key}
                type="number"
                min="0"
                max="99999999999999"
                step="1"
                dir="ltr"
                className="input"
                defaultValue={sp.get(key) || ""}
              />
            </label>
          ))}
        </div>
      </fieldset>
      {[
        ["stock", "فقط کالاهای موجود"],
        ["sale", "فقط تخفیف‌دارها"],
      ].map(([key, label]) => (
        <label className="catalog-check" key={key}>
          <input type="checkbox" name={key} value="1" defaultChecked={sp.get(key) === "1"} />
          {label}
        </label>
      ))}
      <button className="btn btn-primary">اعمال فیلترها</button>
    </form>
  );
  const chips = [
    ["category", categories.find((c) => c.slug === activeCategory)?.name],
    ["q", sp.get("q")],
    ...[
      ["min", "از"],
      ["max", "تا"],
    ].map(
      ([key, label]) =>
        [key, sp.get(key) && label + " " + Number(sp.get(key)).toLocaleString("fa-IR") + " تومان"] as const,
    ),
    ["stock", sp.get("stock") === "1" && "موجود"],
    ["sale", sp.get("sale") === "1" && "تخفیف‌دار"],
  ] as const;
  return (
    <div className="catalog-layout">
      <aside className="catalog-sidebar">
        <h2>
          <SlidersHorizontal size={18} /> فیلتر محصولات
        </h2>
        {filters}
      </aside>
      <div className="min-w-0">
        <div className="catalog-controls">
          <b>{total.toLocaleString("fa-IR")} محصول</b>
          <button className="btn btn-outline btn-sm lg:hidden" onClick={() => setOpen(true)}>
            فیلترها
          </button>
          <label>
            چیدمان{" "}
            <select
              value={sp.get("sort") || ""}
              onChange={(e) => router.push(destination("sort", e.target.value))}
            >
              {sorts.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
        </div>
        {chips.some(([, v]) => v) && (
          <div className="catalog-chips">
            {chips.map(
              ([key, label]) =>
                label && (
                  <Link key={key} href={destination(key, "")} aria-label={"حذف فیلتر " + label}>
                    {label}
                    <X size={14} />
                  </Link>
                ),
            )}
            <Link href="/store">پاک کردن همه</Link>
          </div>
        )}
        {children}
      </div>
      <Drawer open={open} onOpenChange={setOpen} title="فیلتر محصولات" className="catalog-sheet">
        <div className="flex items-center justify-between">
          <h2>فیلتر محصولات</h2>
          <button className="btn btn-icon" aria-label="بستن فیلترها" onClick={() => setOpen(false)}>
            <X />
          </button>
        </div>
        {filters}
      </Drawer>
    </div>
  );
}
