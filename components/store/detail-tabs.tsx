"use client";

import { useState } from "react";

const tabs = ["توضیحات", "مشخصات", "دیدگاه‌ها"];
export function DetailTabs({ panels }: { panels: React.ReactNode[] }) {
  const [active, setActive] = useState(0);
  return (
    <section className="detail-tabs">
      <div role="tablist" aria-label="اطلاعات محصول">
        {tabs.map((label, i) => (
          <button
            key={label}
            role="tab"
            id={"product-tab-" + i}
            aria-controls={"product-panel-" + i}
            aria-selected={active === i}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => {
              const next = { ArrowLeft: (i + 1) % 3, ArrowRight: (i + 2) % 3, Home: 0, End: 2 }[
                e.key as "ArrowLeft" | "ArrowRight" | "Home" | "End"
              ];
              if (next !== undefined) {
                e.preventDefault();
                setActive(next);
                document.getElementById("product-tab-" + next)?.focus();
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {panels.map((panel, i) => (
        <div
          key={i}
          role="tabpanel"
          tabIndex={0}
          hidden={active !== i}
          id={"product-panel-" + i}
          aria-labelledby={"product-tab-" + i}
        >
          {panel}
        </div>
      ))}
    </section>
  );
}
