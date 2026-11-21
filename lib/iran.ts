export const PROVINCES = [
  "تهران",
  "البرز",
  "اصفهان",
  "فارس",
  "خراسان رضوی",
  "آذربایجان شرقی",
  "آذربایجان غربی",
  "اردبیل",
  "ایلام",
  "بوشهر",
  "چهارمحال و بختیاری",
  "خراسان جنوبی",
  "خراسان شمالی",
  "خوزستان",
  "زنجان",
  "سمنان",
  "سیستان و بلوچستان",
  "قزوین",
  "قم",
  "کردستان",
  "کرمان",
  "کرمانشاه",
  "کهگیلویه و بویراحمد",
  "گلستان",
  "گیلان",
  "لرستان",
  "مازندران",
  "مرکزی",
  "هرمزگان",
  "همدان",
  "یزد",
] as const;

const tehranTime = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "long",
  day: "numeric",
});
const tehranDateTime = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});
const shortDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: "Asia/Tehran",
  month: "short",
  day: "numeric",
});

export function faDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return tehranTime.format(new Date(value));
}

export function faDateTime(value: Date | string | null | undefined) {
  if (!value) return "";
  return tehranDateTime.format(new Date(value));
}

export function faShortDate(value: Date | string) {
  return shortDate.format(new Date(value));
}

export function tehranDayKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tehran" }).format(value);
}

export function relativeFa(value: Date | string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "همین حالا";
  if (minutes < 60) return `${minutes.toLocaleString("fa-IR")} دقیقه پیش`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours.toLocaleString("fa-IR")} ساعت پیش`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days.toLocaleString("fa-IR")} روز پیش`;
  return faDate(value);
}
