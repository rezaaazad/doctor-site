export type Addon = {
  id: string;
  title: string;
  description: string;
  priceRial: string;
  required: boolean;
};
export function readAddons(raw: unknown): Addon[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((row) => {
    if (
      !row ||
      typeof row.id !== "string" ||
      typeof row.title !== "string" ||
      !/^\d{1,18}$/.test(String(row.priceRial))
    )
      return [];
    return [
      {
        id: row.id,
        title: row.title,
        description: String(row.description || ""),
        priceRial: String(row.priceRial),
        required: row.required === true,
      },
    ];
  });
}
export function cartKey(
  productId: string,
  variantId?: string | null,
  ids: string[] = [],
) {
  return JSON.stringify([productId, variantId || "", [...new Set(ids)].sort()]);
}
