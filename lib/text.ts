import { asObject, asStringArray } from "@/lib/utils";

export type Locale = "fa" | "en";

export function tr(locale: Locale, fa: string, en?: string | null) {
  if (locale === "en" && en && en.trim()) return en;
  return fa;
}

export function tx(content: Record<string, unknown>, key: string, locale: Locale, fallback = "") {
  if (locale === "en") {
    const en = asObject(content.en);
    const value = en[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  const value = content[key];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function txLines(content: Record<string, unknown>, key: string, locale: Locale) {
  if (locale === "en") {
    const en = asObject(content.en);
    const value = en[key];
    if (Array.isArray(value) && value.some((item) => typeof item === "string" && item.trim())) {
      return asStringArray(value);
    }
  }
  return asStringArray(content[key]);
}

export type Pair = { title: string; body: string };

export function txPairs(content: Record<string, unknown>, key: string, locale: Locale): Pair[] {
  const read = (value: unknown): Pair[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        const row = asObject(item);
        return {
          title: typeof row.title === "string" ? row.title : "",
          body: typeof row.body === "string" ? row.body : "",
        };
      })
      .filter((item) => item.title.trim() || item.body.trim());
  };
  if (locale === "en") {
    const en = read(asObject(content.en)[key]);
    if (en.length) return en;
  }
  return read(content[key]);
}

export function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}
