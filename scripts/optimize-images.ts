// Run from the repository root: node --import tsx scripts/optimize-images.ts
// Mirror slot names under scripts/image-src/ using JPEG, PNG or SVG originals.
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

function dimensions(slot: string): [number, number] {
  if (slot === "brand/favicon") return [220,220];
  if (slot.startsWith("brand/")) return [800,220];
  if (slot.startsWith("logos/")) return [600,200];
  if (slot.startsWith("avatars/")) return [512,512];
  if (slot.startsWith("empty/")) return [1200,800];
  if (slot.startsWith("og/")) return [1200,630];
  if (slot.startsWith("home/hero")) return [1920,1200];
  if (slot.startsWith("home/")) return [1600,800];
  if (slot.endsWith("/hero")) return [2400,1200];
  if (slot.startsWith("about/")) return [2000,1250];
  if (slot.startsWith("blog/")) return [1600,900];
  return [1600,1200];
}

async function optimize() {
  const root = "scripts/image-src";
  for (const file of await readdir(root, {recursive:true})) {
    if (!/\.(png|jpe?g|svg)$/i.test(file)) continue;
    const slot = file.replace(/\.[^.]+$/, "");
    const dest = path.join("public/images", slot + ".webp");
    await mkdir(path.dirname(dest), {recursive:true});
    await sharp(path.join(root,file)).rotate().resize(...dimensions(slot)).webp({quality:86}).toFile(dest);
  }
}
optimize().catch(error => { console.error(error); process.exitCode = 1; });
