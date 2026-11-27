export const releaseVersion = "0.2.0";
export const tiers = ["starter", "pro", "business"] as const;
export function licenseHost(value: string): string {
  const raw = value
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
  if (!raw || /[\s/?#@:%\\]/.test(raw)) return "";
  try {
    const host = new URL("https://" + raw).hostname;
    const labels = host.split(".");
    if (host.length > 253 || labels.length < 2 || /^\d+$/.test(labels.at(-1)!))
      return "";
    return labels.every((label) =>
      /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label),
    )
      ? host
      : "";
  } catch {
    return "";
  }
}
export function nextExpiry(paidAt: Date, days: number, previous?: Date) {
  if (previous && previous >= paidAt)
    return new Date(previous.getTime() + days * 86400000);
  const end = new Date(paidAt);
  end.setUTCDate(end.getUTCDate() + days - 1);
  end.setUTCHours(23, 59, 59, 0);
  return end;
}
