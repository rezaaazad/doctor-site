import type { CSSProperties } from "react";
import type { OptionRecord } from "@/lib/options-schema";

const HEX = /^#[0-9a-f]{6}$/i;
const FONTS = new Set(["Vazirmatn", "Estedad"]);

function color(value: unknown, fallback: string) {
  return typeof value === "string" && HEX.test(value) ? value : fallback;
}

export function themeStyle(theme: OptionRecord): CSSProperties {
  const radius = Math.min(40, Math.max(0, Number(theme.radius) || 16));
  const body = FONTS.has(String(theme.fontBody)) ? String(theme.fontBody) : "Vazirmatn";
  const display = FONTS.has(String(theme.fontDisplay)) ? String(theme.fontDisplay) : "Vazirmatn";
  return {
    "--ink": color(theme.ink, "#102E33"),
    "--primary": color(theme.primary, "#075D60"),
    "--action": color(theme.action, "#BE3823"),
    "--success": color(theme.success, "#047857"),
    "--urgency": color(theme.urgency, "#923557"),
    "--gold": color(theme.gold, "#ECB878"),
    "--bg": color(theme.bg, "#F7F7F2"),
    "--surface": color(theme.surface, "#FFFFFF"),
    "--text": color(theme.text, "#102E33"),
    "--muted": color(theme.muted, "#506568"),
    "--border": color(theme.border, "#D9E2DD"),
    "--r": `${radius}px`,
    "--ff-body": `"${body}"`,
    "--ff-display": `"${display}"`,
  } as CSSProperties;
}

export function themeFonts(theme: OptionRecord) {
  const set = new Set([String(theme.fontBody || "Vazirmatn"), String(theme.fontDisplay || "Vazirmatn")].filter((f) => FONTS.has(f)));
  return [...set].map((font) => `/fonts/${font}-Variable.woff2`);
}
