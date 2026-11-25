import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const alt = "دکتر سایت";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [regular, bold] = await Promise.all([
    readFile(path.join(process.cwd(), "assets/Vazirmatn-Regular.ttf")),
    readFile(path.join(process.cwd(), "assets/Vazirmatn-Bold.ttf")),
  ]);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F7F7F2",
          color: "#102E33",
          padding: 72,
          fontFamily: "Vazirmatn",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#075D60", fontSize: 28 }}>
          <div style={{ width: 18, height: 18, borderRadius: 99, background: "#075D60" }} />
          دکتر سایت
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 84, fontWeight: 700, lineHeight: 1.15 }}>
          <span>ما کد می‌نویسیم،</span>
          <span>
            <span style={{ color: "#075D60" }}>نه</span> قالب
          </span>
        </div>
        <div style={{ fontSize: 28, color: "#075D60" }}>doctor-site.ir</div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Vazirmatn", data: regular, weight: 400, style: "normal" },
        { name: "Vazirmatn", data: bold, weight: 700, style: "normal" },
      ],
    },
  );
}
