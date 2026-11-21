import { cn } from "@/lib/utils";

export const ART_PALETTES = [
  ["#0B1530", "#3B5BDB", "#9DB2FF"],
  ["#1B1F3B", "#D04A0D", "#FFB38A"],
  ["#062925", "#0F766E", "#7EE2D0"],
  ["#22104A", "#6D28D9", "#C9B6FF"],
  ["#2A1508", "#B45309", "#FCD9A5"],
  ["#071A3A", "#1D4ED8", "#A9C6FF"],
  ["#2B0A1C", "#BE185D", "#F9B4D4"],
  ["#0B2416", "#15803D", "#A7F0C1"],
] as const;

export function hashOf(value: string) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function paletteOf(seed: string) {
  return ART_PALETTES[hashOf(seed) % ART_PALETTES.length];
}

type Kind = "template" | "plugin" | "course" | "package" | "card" | "doc" | "print" | "article";

const KINDS: [RegExp, Kind, string][] = [
  [/قالب|تم |پوسته/, "template", "قالب سایت"],
  [/افزونه|پلاگین/, "plugin", "افزونه"],
  [/دوره|آموزش|کلاس/, "course", "دوره ویدیویی"],
  [/پکیج|سرویس|خدمت|راه‌اندازی/, "package", "سرویس"],
  [/کارت/, "card", "NFC"],
  [/چک‌لیست|کتاب|راهنما|فایل/, "doc", "فایل"],
];

const GENERIC = /^(قالب|افزونه|دوره|پکیج|سرویس|کارت|ست|پک|چک‌لیست|فروشگاهی|شرکتی|اتصال|راه‌اندازی|به|و|در|برای|ویزیت|هوشمند|اوراق|اداری)$/;

function kindOf(title: string, type: string): [Kind, string] {
  for (const [re, kind, label] of KINDS) if (re.test(title)) return [kind, label];
  return type === "physical" ? ["print", "چاپی"] : ["doc", "دیجیتال"];
}

function wordmark(title: string) {
  const words = title.replace(/[«»"'()]/g, "").trim().split(/\s+/).filter(Boolean);
  return words.find((w) => !GENERIC.test(w)) ?? words[words.length - 1] ?? "";
}

/**
 * Designed, deterministic cover for products and posts that have no photo yet. The composition
 * follows what the product is (template, plugin, course, service, card, document, printed item).
 */
export function ProductArt({ seed, title, type, label, className, kind: forced }: { seed: string; title: string; type: string; label?: string; className?: string; kind?: Kind }) {
  const [deep, mid, light] = paletteOf(seed);
  const h = hashOf(seed);
  const [guess, kindLabel] = kindOf(title, type);
  const kind = forced ?? guess;
  const mark = kind === "article" ? title : wordmark(title);
  const tilt = ((h % 5) - 2) * 0.8;
  return (
    <div
      className={cn("@container relative isolate overflow-hidden select-none", className)}
      style={{ background: `radial-gradient(130% 100% at ${25 + (h % 50)}% -10%, ${mid} 0%, ${deep} 64%)` }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `radial-gradient(${light} 1px, transparent 1.2px)`,
          backgroundSize: "18px 18px",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 10%, transparent 70%)",
        }}
      />
      <div className="absolute -bottom-[30%] -left-[20%] size-[80%] rounded-full blur-3xl" style={{ background: `${light}40` }} />
      <div className="absolute -top-[25%] -right-[15%] size-[55%] rounded-full blur-3xl" style={{ background: `${mid}aa` }} />

      <div className="absolute inset-0 flex items-center justify-center p-[11%]" style={{ transform: `rotate(${tilt}deg)` }}>
        {kind === "template" ? <Template mark={mark} light={light} mid={mid} /> : null}
        {kind === "plugin" ? <Plugin mark={mark} light={light} mid={mid} deep={deep} /> : null}
        {kind === "course" ? <Course mark={mark} light={light} /> : null}
        {kind === "package" ? <Package mark={mark} light={light} mid={mid} /> : null}
        {kind === "card" ? <MetalCard mark={mark} light={light} mid={mid} deep={deep} /> : null}
        {kind === "doc" ? <Doc mark={mark} light={light} /> : null}
        {kind === "print" ? <PrintStack mark={mark} light={light} mid={mid} /> : null}
        {kind === "article" ? <Article mark={mark} light={light} /> : null}
      </div>

      <span className="absolute right-[6%] bottom-[6%] rounded-full bg-black/25 px-[3.2cqw] py-[1.2cqw] text-[3.6cqw] font-bold text-white/90 ring-1 ring-white/15 backdrop-blur">
        {label || kindLabel}
      </span>
    </div>
  );
}

const glass = "border border-white/20 bg-white/[0.09] shadow-[0_30px_60px_-24px_rgba(0,0,0,0.7)] backdrop-blur-[3px]";

function Template({ mark, light, mid }: { mark: string; light: string; mid: string }) {
  return (
    <div className={cn("relative h-[84%] w-full overflow-hidden rounded-[3.5cqw]", glass)}>
      <div className="flex items-center gap-[1.2cqw] border-b border-white/15 px-[3cqw] py-[2cqw]">
        <span className="size-[1.8cqw] rounded-full bg-[#ff6b6b]/80" />
        <span className="size-[1.8cqw] rounded-full bg-[#ffd166]/80" />
        <span className="size-[1.8cqw] rounded-full bg-[#06d6a0]/80" />
        <span className="ms-[2cqw] h-[2cqw] w-[38%] rounded-full bg-white/15" />
      </div>
      <div className="p-[3.5cqw]">
        <div className="flex items-start justify-between gap-[3cqw]">
          <div className="min-w-0">
            <p className="font-display text-[11cqw] leading-[1.05] font-black text-white">{mark}</p>
            <span className="mt-[2.2cqw] block h-[1.8cqw] w-[30cqw] rounded-full bg-white/30" />
            <span className="mt-[1.4cqw] block h-[1.8cqw] w-[22cqw] rounded-full bg-white/15" />
            <span className="mt-[3cqw] inline-block h-[5cqw] w-[17cqw] rounded-full" style={{ background: light }} />
          </div>
          <div className="aspect-square w-[26cqw] shrink-0 rounded-[2.5cqw]" style={{ background: `linear-gradient(150deg, ${light}, ${mid})` }} />
        </div>
        <div className="mt-[4cqw] grid grid-cols-4 gap-[2cqw]">
          {[0.3, 0.2, 0.25, 0.15].map((o, i) => (
            <span key={i} className="aspect-[3/4] rounded-[1.6cqw] bg-white" style={{ opacity: o }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Plugin({ mark, light, mid, deep }: { mark: string; light: string; mid: string; deep: string }) {
  return (
    <div className="relative flex w-full flex-col items-center">
      <div
        className="relative grid aspect-square w-[46cqw] place-items-center rounded-[13cqw] shadow-[0_34px_60px_-20px_rgba(0,0,0,0.75)]"
        style={{ background: `linear-gradient(145deg, ${light} 0%, ${mid} 48%, ${deep} 100%)` }}
      >
        <div className="absolute inset-0 rounded-[13cqw] bg-[linear-gradient(160deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0)_42%)]" />
        <svg viewBox="0 0 48 48" className="relative size-[52%] text-white drop-shadow" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8v8M30 8v8M12 16h24v8a12 12 0 0 1-24 0v-8ZM24 36v6" />
        </svg>
      </div>
      <div className={cn("mt-[6cqw] flex w-[78%] items-center justify-between rounded-[4cqw] px-[4cqw] py-[3cqw]", glass)}>
        <span className="truncate font-display text-[7cqw] font-black text-white">{mark}</span>
        <span className="relative h-[6cqw] w-[11cqw] shrink-0 rounded-full" style={{ background: light }}>
          <span className="absolute top-1/2 left-[0.8cqw] size-[4.4cqw] -translate-y-1/2 rounded-full bg-white shadow" />
        </span>
      </div>
    </div>
  );
}

function Course({ mark, light }: { mark: string; light: string }) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-[3.5cqw]", glass)}>
      <div className="relative grid aspect-video place-items-center bg-black/25">
        <p className="absolute top-[4cqw] right-[4.5cqw] font-display text-[9.5cqw] leading-none font-black text-white">{mark}</p>
        <span className="grid size-[17cqw] place-items-center rounded-full bg-white shadow-[0_12px_30px_-6px_rgba(0,0,0,0.6)]">
          <svg viewBox="0 0 24 24" className="size-[45%] -translate-x-[6%]" fill={light === "#FFFFFF" ? "#000" : "#0B1530"}>
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" />
          </svg>
        </span>
        <span className="absolute inset-x-[4cqw] bottom-[3cqw] h-[1.4cqw] rounded-full bg-white/20">
          <span className="block h-full w-[38%] rounded-full" style={{ background: light }} />
        </span>
      </div>
      <div className="space-y-[2cqw] p-[3.5cqw]">
        {[72, 58, 64].map((w, i) => (
          <div key={i} className="flex items-center gap-[2.5cqw]">
            <span className="grid size-[5cqw] shrink-0 place-items-center rounded-full text-[2.8cqw] font-black text-white" style={{ background: i === 0 ? light : "rgba(255,255,255,0.15)", color: i === 0 ? "#0B1530" : undefined }}>
              {["۱", "۲", "۳"][i]}
            </span>
            <span className="h-[1.8cqw] rounded-full bg-white/25" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Package({ mark, light, mid }: { mark: string; light: string; mid: string }) {
  return (
    <div className="relative h-[78%] w-[82%]">
      {[2, 1, 0].map((i) => (
        <div
          key={i}
          className={cn("absolute inset-x-0 rounded-[4cqw]", glass)}
          style={{ top: `${i * 7}cqw`, bottom: `${(2 - i) * 7}cqw`, transform: `scale(${1 - i * 0.07})`, opacity: 1 - i * 0.25 }}
        />
      ))}
      <div className="absolute inset-x-0 top-[14cqw] bottom-0 flex flex-col justify-between rounded-[4cqw] p-[5cqw]" style={{ background: `linear-gradient(150deg, ${light} 0%, ${mid} 100%)` }}>
        <span className="flex gap-[1.5cqw]">
          {[1, 2, 3].map((d) => (
            <span key={d} className="grid size-[6cqw] place-items-center rounded-full bg-white/85">
              <svg viewBox="0 0 24 24" className="size-[60%]" fill="none" stroke="#0B1530" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12.5 4.5 4.5L19 7.5" />
              </svg>
            </span>
          ))}
        </span>
        <p className="font-display text-[11cqw] leading-none font-black text-[#0B1530]">{mark}</p>
      </div>
    </div>
  );
}

function MetalCard({ mark, light, mid, deep }: { mark: string; light: string; mid: string; deep: string }) {
  return (
    <div className="relative aspect-[1.586] w-[86%]" style={{ transform: "rotate(-8deg)" }}>
      <div className="absolute inset-0 translate-x-[4cqw] translate-y-[5cqw] rounded-[4.5cqw] bg-black/35 blur-[3cqw]" />
      <div className="absolute inset-0 overflow-hidden rounded-[4.5cqw]" style={{ background: `linear-gradient(125deg, ${light} 0%, ${mid} 38%, ${deep} 100%)` }}>
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_32%,rgba(255,255,255,0)_60%,rgba(255,255,255,0.18)_75%,rgba(255,255,255,0)_90%)]" />
        <span className="absolute top-[6cqw] left-[6cqw] h-[8cqw] w-[11cqw] rounded-[1.8cqw] bg-[linear-gradient(135deg,#f6e7b0,#c9a54a)] shadow-inner" />
        <svg viewBox="0 0 24 24" className="absolute top-[5.5cqw] right-[6cqw] size-[10cqw] text-white/85" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M7 8.5a5 5 0 0 1 0 7M10.5 6a9 9 0 0 1 0 12M14 3.5a13 13 0 0 1 0 17" />
        </svg>
        <p className="absolute right-[6cqw] bottom-[6cqw] font-display text-[9cqw] leading-none font-black text-white">{mark}</p>
        <span className="absolute bottom-[7cqw] left-[6cqw] h-[1.6cqw] w-[20cqw] rounded-full bg-white/40" />
      </div>
    </div>
  );
}

function Doc({ mark, light }: { mark: string; light: string }) {
  return (
    <div className="relative h-[86%] w-[64%]">
      <div className="absolute inset-0 translate-x-[5cqw] -translate-y-[2cqw] rotate-6 rounded-[3.5cqw] bg-white/15" />
      <div className="absolute inset-0 rounded-[3.5cqw] bg-white p-[5cqw] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
        <p className="font-display text-[8.5cqw] leading-none font-black text-[#0B1530]">{mark}</p>
        <div className="mt-[4cqw] space-y-[2.6cqw]">
          {[80, 64, 72, 54, 68].map((w, i) => (
            <div key={i} className="flex items-center gap-[2cqw]">
              <span className="grid size-[4.2cqw] shrink-0 place-items-center rounded-[1.2cqw]" style={{ background: i < 3 ? light : "#E4E6EE" }}>
                {i < 3 ? (
                  <svg viewBox="0 0 24 24" className="size-[70%]" fill="none" stroke="#0B1530" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12.5 4.5 4.5L19 7.5" />
                  </svg>
                ) : null}
              </span>
              <span className="h-[1.6cqw] rounded-full bg-[#0B1530]/15" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrintStack({ mark, light, mid }: { mark: string; light: string; mid: string }) {
  return (
    <div className="relative h-[80%] w-[70%]">
      <div className="absolute inset-0 -translate-x-[8cqw] translate-y-[3cqw] -rotate-12 rounded-[2.5cqw] bg-white/70 shadow-xl" />
      <div className="absolute inset-0 translate-x-[6cqw] rotate-6 rounded-[2.5cqw] shadow-xl" style={{ background: light }} />
      <div className="absolute inset-0 flex flex-col justify-between rounded-[2.5cqw] bg-white p-[5cqw] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
        <span className="flex items-center gap-[2cqw]">
          <span className="size-[7cqw] rounded-full" style={{ background: `linear-gradient(135deg, ${light}, ${mid})` }} />
          <span className="h-[1.8cqw] w-[20cqw] rounded-full bg-[#0B1530]/20" />
        </span>
        <span className="space-y-[1.8cqw]">
          <span className="block h-[1.4cqw] w-full rounded-full bg-[#0B1530]/10" />
          <span className="block h-[1.4cqw] w-[80%] rounded-full bg-[#0B1530]/10" />
          <span className="block h-[1.4cqw] w-[60%] rounded-full bg-[#0B1530]/10" />
        </span>
        <p className="font-display text-[9cqw] leading-none font-black" style={{ color: mid }}>{mark}</p>
      </div>
    </div>
  );
}

function Article({ mark, light }: { mark: string; light: string }) {
  return (
    <div className="w-full text-center">
      <p className="line-clamp-3 font-display text-[7cqw] leading-[1.4] font-black text-white [text-wrap:balance]">{mark}</p>
      <span className="mx-auto mt-[4cqw] block h-[1.4cqw] w-[24cqw] rounded-full" style={{ background: light }} />
    </div>
  );
}
