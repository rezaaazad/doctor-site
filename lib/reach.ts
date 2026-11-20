export function telHref(phone: string) {
  const clean = phone.replace(/[^\d+]/g, "");
  return clean ? `tel:${clean}` : "";
}

export function whatsappHref(value: string) {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export function telegramHref(value: string) {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  const handle = value.replace(/^@/, "");
  return `https://t.me/${handle}`;
}
