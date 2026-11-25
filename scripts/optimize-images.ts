// Run from the repository root: node --import tsx scripts/optimize-images.ts
// Mirror slot names under scripts/image-src/ using JPEG, PNG or SVG originals.
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const WIDE = new Set([
  "home/hero-1",
  "home/hero-2",
  "home/promo-shop",
  "home/promo-sale",
  "services/hero",
  "pricing/hero",
  "about/studio",
  "blog/ghimat-tarahi-site",
  "blog/foroushgah-ya-site-moarefi",
  "blog/seo-bad-az-tarahi",
]);

function dimensions(slot: string): [number, number] {
  if (slot === "brand/favicon") return [220, 220];
  if (slot.startsWith("brand/")) return [800, 220];
  if (slot.startsWith("logos/")) return [600, 200];
  if (slot.startsWith("avatars/")) return [512, 512];
  if (slot.startsWith("empty/")) return [1200, 800];
  if (slot.startsWith("og/")) return [1200, 630];
  if (WIDE.has(slot) || slot.startsWith("home/") || slot.startsWith("blog/") || slot.startsWith("about/") || slot.endsWith("/hero")) return [1280, 720];
  return [1152, 864];
}

async function optimize() {
  const root = "scripts/image-src";
  for (const file of await readdir(root, { recursive: true })) {
    if (!/\.(png|jpe?g|svg)$/i.test(file)) continue;
    const slot = file.replace(/\.[^.]+$/, "");
    const source = path.join(root, file);
    const dest = path.join("public/images", slot + ".webp");
    await mkdir(path.dirname(dest), { recursive: true });
    const meta = await sharp(source).metadata();
    const [targetW, targetH] = dimensions(slot);
    const width = Math.min(targetW, meta.width ?? targetW);
    await sharp(source).rotate().resize({ width, height: targetH, fit: "cover", withoutEnlargement: true }).webp({ quality: 86 }).toFile(dest);
  }
}
optimize().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
