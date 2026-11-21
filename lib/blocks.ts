// Block content format shared by the admin block editor and the public renderer.
// Stored as JSON (array of blocks) on BlogPost.blocks, LandingPage.blocks and StoreProduct.blocks.

export type Block =
  | { id: string; type: "heading"; level: 2 | 3; text: string; anchor?: string }
  | { id: string; type: "paragraph"; text: string }
  | { id: string; type: "list"; style: "bullet" | "number" | "check"; items: string[] }
  | { id: string; type: "image"; url: string; alt: string; caption: string; width: "normal" | "wide" | "full" }
  | { id: string; type: "gallery"; images: { url: string; alt: string }[] }
  | { id: string; type: "quote"; text: string; cite: string }
  | { id: string; type: "callout"; tone: "info" | "success" | "warn" | "danger"; title: string; text: string }
  | { id: string; type: "button"; label: string; href: string; style: "action" | "primary" | "outline" }
  | { id: string; type: "faq"; items: { q: string; a: string }[] }
  | { id: string; type: "video"; url: string; caption: string }
  | { id: string; type: "code"; code: string; lang: string }
  | { id: string; type: "table"; header: boolean; rows: string[][] }
  | { id: string; type: "products"; slugs: string[]; title: string }
  | { id: string; type: "divider" };

export type BlockType = Block["type"];

export const BLOCK_TYPES: { type: BlockType; label: string; hint: string }[] = [
  { type: "paragraph", label: "پاراگراف", hint: "متن با **پررنگ**، *کج* و [پیوند](https://...)" },
  { type: "heading", label: "تیتر", hint: "تیتر H2 یا H3؛ در فهرست مطالب هم می‌آید" },
  { type: "list", label: "فهرست", hint: "نقطه‌ای، شماره‌دار یا تیک‌دار" },
  { type: "image", label: "تصویر", hint: "از کتابخانه رسانه یا نشانی" },
  { type: "gallery", label: "گالری", hint: "چند تصویر کنار هم" },
  { type: "quote", label: "نقل‌قول", hint: "" },
  { type: "callout", label: "کادر نکته", hint: "نکته، هشدار یا موفقیت" },
  { type: "button", label: "دکمه", hint: "دعوت به اقدام" },
  { type: "faq", label: "پرسش و پاسخ", hint: "با اسکیمای FAQ" },
  { type: "video", label: "ویدیو", hint: "آپارات یا یوتیوب" },
  { type: "table", label: "جدول", hint: "" },
  { type: "products", label: "محصولات", hint: "نمایش چند محصول فروشگاه" },
  { type: "code", label: "کد", hint: "" },
  { type: "divider", label: "جداکننده", hint: "" },
];

const str = (v: unknown, max = 20_000) => (typeof v === "string" ? v.slice(0, max) : "");
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const pick = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(v as T) ? (v as T) : fallback);

export function newBlockId() {
  return Math.random().toString(36).slice(2, 10);
}

/** URLs allowed in links/images: http(s), site-relative paths, mailto and tel. */
export function safeUrl(value: unknown): string {
  const url = str(value, 2000).trim();
  if (!url) return "";
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  if (url.startsWith("#")) return url;
  return "";
}

export function emptyBlock(type: BlockType): Block {
  const id = newBlockId();
  switch (type) {
    case "heading":
      return { id, type, level: 2, text: "" };
    case "list":
      return { id, type, style: "bullet", items: [""] };
    case "image":
      return { id, type, url: "", alt: "", caption: "", width: "normal" };
    case "gallery":
      return { id, type, images: [] };
    case "quote":
      return { id, type, text: "", cite: "" };
    case "callout":
      return { id, type, tone: "info", title: "", text: "" };
    case "button":
      return { id, type, label: "", href: "", style: "action" };
    case "faq":
      return { id, type, items: [{ q: "", a: "" }] };
    case "video":
      return { id, type, url: "", caption: "" };
    case "code":
      return { id, type, code: "", lang: "" };
    case "table":
      return { id, type, header: true, rows: [["", ""], ["", ""]] };
    case "products":
      return { id, type, slugs: [], title: "" };
    case "divider":
      return { id, type };
    default:
      return { id, type: "paragraph", text: "" };
  }
}

/** Validates untrusted JSON (from the editor or DB) into well-formed blocks. Unknown types are dropped. */
export function parseBlocks(value: unknown): Block[] {
  const out: Block[] = [];
  for (const raw of arr(value).slice(0, 400)) {
    const b = obj(raw);
    const id = str(b.id, 40) || newBlockId();
    switch (b.type) {
      case "heading":
        out.push({ id, type: "heading", level: b.level === 3 ? 3 : 2, text: str(b.text, 300), anchor: str(b.anchor, 80) || undefined });
        break;
      case "paragraph":
        out.push({ id, type: "paragraph", text: str(b.text) });
        break;
      case "list":
        out.push({ id, type: "list", style: pick(b.style, ["bullet", "number", "check"] as const, "bullet"), items: arr(b.items).map((i) => str(i, 2000)).slice(0, 100) });
        break;
      case "image":
        out.push({ id, type: "image", url: safeUrl(b.url), alt: str(b.alt, 300), caption: str(b.caption, 500), width: pick(b.width, ["normal", "wide", "full"] as const, "normal") });
        break;
      case "gallery":
        out.push({
          id,
          type: "gallery",
          images: arr(b.images)
            .map((i) => ({ url: safeUrl(obj(i).url), alt: str(obj(i).alt, 300) }))
            .filter((i) => i.url)
            .slice(0, 30),
        });
        break;
      case "quote":
        out.push({ id, type: "quote", text: str(b.text, 3000), cite: str(b.cite, 200) });
        break;
      case "callout":
        out.push({ id, type: "callout", tone: pick(b.tone, ["info", "success", "warn", "danger"] as const, "info"), title: str(b.title, 200), text: str(b.text, 3000) });
        break;
      case "button":
        out.push({ id, type: "button", label: str(b.label, 120), href: safeUrl(b.href), style: pick(b.style, ["action", "primary", "outline"] as const, "action") });
        break;
      case "faq":
        out.push({ id, type: "faq", items: arr(b.items).map((i) => ({ q: str(obj(i).q, 500), a: str(obj(i).a, 4000) })).slice(0, 50) });
        break;
      case "video":
        out.push({ id, type: "video", url: safeUrl(b.url), caption: str(b.caption, 300) });
        break;
      case "code":
        out.push({ id, type: "code", code: str(b.code, 20_000), lang: str(b.lang, 20) });
        break;
      case "table":
        out.push({ id, type: "table", header: b.header !== false, rows: arr(b.rows).slice(0, 60).map((r) => arr(r).slice(0, 10).map((c) => str(c, 500))) });
        break;
      case "products":
        out.push({ id, type: "products", slugs: arr(b.slugs).map((s) => str(s, 120).trim()).filter(Boolean).slice(0, 12), title: str(b.title, 200) });
        break;
      case "divider":
        out.push({ id, type: "divider" });
        break;
    }
  }
  return out;
}

/** Converts the legacy markdown-ish text bodies (## heading, - list, blank-line paragraphs) into blocks. */
export function blocksFromText(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of text.replace(/\r/g, "").split(/\n{2,}/)) {
    const part = chunk.trim();
    if (!part) continue;
    const lines = part.split("\n").map((l) => l.trim());
    if (/^###\s+/.test(part)) blocks.push({ id: newBlockId(), type: "heading", level: 3, text: part.replace(/^###\s+/, "") });
    else if (/^##?\s+/.test(part)) blocks.push({ id: newBlockId(), type: "heading", level: 2, text: part.replace(/^##?\s+/, "") });
    else if (/^>\s?/.test(part)) blocks.push({ id: newBlockId(), type: "quote", text: lines.map((l) => l.replace(/^>\s?/, "")).join("\n"), cite: "" });
    else if (lines.every((l) => /^[-*•]\s+/.test(l))) blocks.push({ id: newBlockId(), type: "list", style: "bullet", items: lines.map((l) => l.replace(/^[-*•]\s+/, "")) });
    else if (lines.every((l) => /^[\d۰-۹]+[.)]\s+/.test(l))) blocks.push({ id: newBlockId(), type: "list", style: "number", items: lines.map((l) => l.replace(/^[\d۰-۹]+[.)]\s+/, "")) });
    else if (part === "---") blocks.push({ id: newBlockId(), type: "divider" });
    else blocks.push({ id: newBlockId(), type: "paragraph", text: part });
  }
  return blocks;
}

/** Blocks if present, otherwise derived from the legacy text body. */
export function contentBlocks(blocks: unknown, body: string): Block[] {
  const parsed = parseBlocks(blocks);
  return parsed.length ? parsed : blocksFromText(body || "");
}

export function plainText(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === "paragraph" || b.type === "heading" || b.type === "quote") return b.text;
      if (b.type === "list") return b.items.join(" ");
      if (b.type === "callout") return `${b.title} ${b.text}`;
      if (b.type === "faq") return b.items.map((i) => `${i.q} ${i.a}`).join(" ");
      return "";
    })
    .join(" ")
    .replace(/\*\*|\*|\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function readingMinutes(blocks: Block[]) {
  const words = plainText(blocks).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function slugifyFa(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u200c\s]+/g, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function headingAnchor(block: Extract<Block, { type: "heading" }>, index: number) {
  return block.anchor || slugifyFa(block.text) || `h-${index}`;
}

/** Embeddable video URL for Aparat or YouTube links; empty when the host is not allowed. */
export function videoEmbed(url: string): string {
  try {
    const u = new URL(url);
    if (/(^|\.)aparat\.com$/.test(u.hostname)) {
      const m = u.pathname.match(/\/v\/([\w-]+)/);
      return m ? `https://www.aparat.com/video/video/embed/videohash/${m[1]}/vt/frame` : "";
    }
    if (/(^|\.)youtube\.com$/.test(u.hostname)) {
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(v)}` : "";
    }
    if (u.hostname === "youtu.be") return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(u.pathname.slice(1))}`;
  } catch {
    return "";
  }
  return "";
}
