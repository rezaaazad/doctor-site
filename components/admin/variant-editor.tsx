"use client";
import { useState } from "react";
import { RowsField } from "./forms";
export function VariantEditor({
  axes,
  rows,
}: {
  axes: string[];
  rows: Record<string, string>[];
}) {
  const [names, setNames] = useState(axes.join("\n"));
  return (
    <section className="card grid gap-3 p-4">
      <label>
        ویژگی‌های تنوع (هر خط یک نام)
        <textarea
          className="input"
          name="axes"
          value={names}
          onChange={(e) => setNames(e.target.value)}
        />
      </label>
      <RowsField<Record<string, string>>
        name="variants"
        label="ترکیب‌ها و قیمت هر گزینه"
        columns={[
          { key: "title", label: "عنوان" },
          ...names
            .split("\n")
            .filter(Boolean)
            .map((name, i) => ({ key: "axis" + i, label: name })),
          { key: "price", label: "قیمت به تومان" },
          { key: "compareAt", label: "قیمت قبل" },
          { key: "sku", label: "شناسه" },
          { key: "imageUrl", label: "تصویر" },
          {
            key: "active",
            label: "وضعیت",
            type: "select",
            options: [
              { value: "yes", label: "فعال" },
              { value: "no", label: "غیرفعال" },
            ],
          },
        ]}
        defaultValue={rows}
      />
    </section>
  );
}
