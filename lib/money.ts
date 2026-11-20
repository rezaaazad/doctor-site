// Money is stored as BigInt Rial everywhere. The storefront and admin speak Toman (Rial / 10).

const faNumber = new Intl.NumberFormat("fa-IR");

export type Rial = bigint;

export function rial(value: bigint | number | string | null | undefined): bigint {
  if (value === null || value === undefined || value === "") return BigInt(0);
  if (typeof value === "bigint") return value;
  if (typeof value === "number") return BigInt(Math.round(value));
  const clean = toLatinDigits(String(value)).replace(/[^\d-]/g, "");
  return clean ? BigInt(clean) : BigInt(0);
}

export function tomanToRial(toman: bigint | number | string): bigint {
  return rial(toman) * BigInt(10);
}

export function rialToToman(value: bigint | number): number {
  return Number(rial(value) / BigInt(10));
}

export function toNumber(value: bigint | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "bigint" ? Number(value) : value;
}

export function formatToman(value: bigint | number, withUnit = true) {
  const toman = rialToToman(value);
  return withUnit ? `${faNumber.format(toman)} تومان` : faNumber.format(toman);
}

export function formatNumber(value: number | bigint) {
  return faNumber.format(typeof value === "bigint" ? Number(value) : value);
}

export function percentOff(price: bigint | number, compareAt: bigint | number | null | undefined) {
  const p = toNumber(price);
  const c = toNumber(compareAt ?? 0);
  if (!c || c <= p) return 0;
  return Math.round(((c - p) / c) * 100);
}

export function toLatinDigits(input: string) {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

export function toFaDigits(input: string | number) {
  return String(input).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

export function normalizeMobile(input: string) {
  const digits = toLatinDigits(input).replace(/\D/g, "");
  if (/^09\d{9}$/.test(digits)) return digits;
  if (/^9\d{9}$/.test(digits)) return `0${digits}`;
  if (/^989\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^00989\d{9}$/.test(digits)) return `0${digits.slice(4)}`;
  return "";
}

export function maskMobile(mobile: string) {
  return mobile.length === 11 ? `${mobile.slice(0, 4)}***${mobile.slice(7)}` : mobile;
}
