"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Filter, SlidersHorizontal } from "lucide-react";
import type { CategoryView } from "@/lib/store/catalog";
import { Drawer } from "@/components/ui/drawer";

const SORTS = [
  { value: "", label: "پیشنهادی" },
  { value: "newest", label: "جدیدترین" },
  { value: "bestseller", label: "پرفروش‌ترین" },
  { value: "cheap", label: "ارزان‌ترین" },
  { value: "expensive", label: "گران‌ترین" },
  { value: "rating", label: "بیشترین امتیاز" },
] as const;

export function CatalogToolbar({ categories, total }: { categories: CategoryView[]; total: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [sheet, setSheet] = useState(false);
  const q = sp.get("q") ?? "";
  const sort = sp.get("sort") ?? "";
  const category = sp.get("category") ?? "";

  const patch = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(sp.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      params.delete("page");
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, sp],
  );

  return (
    <>
      <div className="card mb-5 flex flex-wrap items-center justify-between gap-3 p-3" data-reveal>
        <p className="text-[0.85rem] text-muted">
          <span className="num font-bold text-fg">{total.toLocaleString("fa-IR")}</span> محصول
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="hidden items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-[0.82rem] sm:flex">
            <span className="text-muted">مرتب‌سازی</span>
            <select
              value={sort}
              onChange={(e) => patch({ sort: e.target.value || null })}
              className="bg-transparent font-semibold outline-none"
              aria-label="مرتب‌سازی"
            >
              {SORTS.map((s) => (
                <option key={s.value || "default"} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => setSheet(true)} className="btn btn-outline btn-sm">
            <Filter className="size-4" aria-hidden />
            فیلتر
          </button>
        </div>
      </div>

      <div className="mb-6 hidden flex-wrap gap-2 lg:flex">
        <button type="button" onClick={() => patch({ category: null })} className="chip" data-active={!category ? "true" : undefined}>
          همه
        </button>
        {categories.map((c) => (
          <button key={c.id} type="button" onClick={() => patch({ category: c.slug })} className="chip" data-active={category === c.slug ? "true" : undefined}>
            {c.icon ? <span aria-hidden>{c.icon}</span> : null} {c.name}
            <span className="num opacity-60">({c.count})</span>
          </button>
        ))}
      </div>

      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          patch({ q: String(fd.get("q") || "").trim() || null });
        }}
      >
        <input name="q" key={q} defaultValue={q} aria-label="جستجوی محصول" placeholder="جستجوی محصول، برند یا کد…" className="input min-w-0 flex-1 text-base" autoComplete="off" />
        <button type="submit" className="btn btn-primary">
          جستجو
        </button>
      </form>

      <Drawer open={sheet} onOpenChange={setSheet} title="فیلتر محصولات" className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <b className="flex items-center gap-2 font-bold">
                <SlidersHorizontal className="size-4" /> فیلتر و مرتب‌سازی
              </b>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSheet(false)}>
                بستن
              </button>
            </div>
            <label className="mb-4 grid gap-2 text-[0.85rem] font-semibold">
              مرتب‌سازی
              <select value={sort} onChange={(e) => patch({ sort: e.target.value || null })} className="field">
                {SORTS.map((s) => (
                  <option key={s.value || "d"} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="mb-4 grid gap-3"><label className="flex items-center gap-2"><input type="checkbox" checked={sp.get("stock")==="1"} onChange={e=>patch({stock:e.target.checked?"1":null})}/> فقط موجود</label><label className="flex items-center gap-2"><input type="checkbox" checked={sp.get("sale")==="1"} onChange={e=>patch({sale:e.target.checked?"1":null})}/> فقط تخفیف‌دار</label></div>
            <p className="mb-2 text-[0.85rem] font-bold">دسته‌بندی</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => { patch({ category: null }); setSheet(false); }} className="chip" data-active={!category ? "true" : undefined}>
                همه
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    patch({ category: c.slug });
                    setSheet(false);
                  }}
                  className="chip"
                  data-active={category === c.slug ? "true" : undefined}
                >
                  {c.name}
                </button>
              ))}
            </div>
      </Drawer>
    </>
  );
}
