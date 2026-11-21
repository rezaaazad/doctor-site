import type { CSSProperties } from "react";
import type { OptionRecord } from "@/lib/options-schema";

const HEX = /^#[0-9a-f]{6}$/i;
const FONTS = new Set(["Vazirmatn", "Estedad"]);

function color(value: unknown, fallback: string) {
  return typeof value === "string" && HEX.test(value) ? value : fallback;
}

export function themeStyle(theme: OptionRecord): CSSProperties {
  const radius = Math.min(40, Math.max(0, Number(theme.radius) || 18));
  const body = FONTS.has(String(theme.fontBody)) ? String(theme.fontBody) : "Vazirmatn";
  const display = FONTS.has(String(theme.fontDisplay)) ? String(theme.fontDisplay) : "Estedad";
  return {
    "--ink": color(theme.ink, "#0B1530"),
    "--primary": color(theme.primary, "#3B5BDB"),
    "--action": color(theme.action, "#D04A0D"),
    "--success": color(theme.success, "#047857"),
    "--urgency": color(theme.urgency, "#E11D48"),
    "--gold": color(theme.gold, "#F5B301"),
    "--bg": color(theme.bg, "#F6F5F1"),
    "--surface": color(theme.surface, "#FFFFFF"),
    "--text": color(theme.text, "#0B1530"),
    "--muted": color(theme.muted, "#5B6478"),
    "--border": color(theme.border, "#E4E6EE"),
    "--r": `${radius}px`,
    "--ff-body": `"${body}"`,
    "--ff-display": `"${display}"`,
  } as CSSProperties;
}

export function themeFonts(theme: OptionRecord) {
  const set = new Set([String(theme.fontBody || "Vazirmatn"), String(theme.fontDisplay || "Estedad")].filter((f) => FONTS.has(f)));
  return [...set].map((font) => `/fonts/${font}-Variable.woff2`);
}
