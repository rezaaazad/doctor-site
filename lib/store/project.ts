export const stages = {
  awaiting_brief: "تکمیل بریف",
  kickoff: "شروع پروژه",
  designing: "طراحی و توسعه",
  review: "بازبینی",
  delivered: "تحویل نهایی",
};
export type Question = { id: string; title: string; required: boolean };
export function questions(
  items: {
    productId: string | null;
    type: string;
    product: { briefSchema: unknown } | null;
  }[],
): Question[] {
  const result: Question[] = [
    { id: "brand", title: "نام برند", required: true },
    { id: "domain", title: "وضعیت دامنه", required: true },
    { id: "references", title: "سایت‌های مرجع", required: false },
    { id: "style", title: "رنگ‌ها و سبک مورد نظر", required: false },
    { id: "contact", title: "روش ارتباط ترجیحی", required: true },
  ];
  for (const item of items) {
    if (item.type !== "service" || !Array.isArray(item.product?.briefSchema))
      continue;
    for (const q of item.product.briefSchema) {
      if (!q || typeof q.title !== "string" || typeof q.id !== "string")
        continue;
      const id = item.productId + "." + q.id;
      if (!result.some((row) => row.id === id))
        result.push({ id, title: q.title, required: q.required === true });
    }
  }
  return result;
}
export function briefAnswers(fields: Question[], data: FormData) {
  return fields.flatMap((q) => {
    const value = String(data.get(q.id) || "").trim();
    if ((q.required && !value) || value.length > 2000)
      throw new Error("پاسخ «" + q.title + "» را بررسی کنید.");
    return value ? [{ id: q.id, title: q.title, value }] : [];
  });
}
export function briefOwner(
  order: { customerId: string | null; accessKey: string },
  customerId?: string,
  key?: string,
) {
  return Boolean(
    (customerId && customerId === order.customerId) ||
    (key && key === order.accessKey),
  );
}
