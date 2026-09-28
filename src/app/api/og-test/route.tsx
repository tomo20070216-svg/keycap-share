import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const fontData = await readFile(
    join(process.cwd(), "public/fonts/NotoSansJP-Bold.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111827",
          color: "#ffffff",
          fontFamily: "Noto Sans JP",
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 700 }}>
          分割キーボード配列共有
        </div>
        <div style={{ fontSize: 32, marginTop: 24, color: "#9ca3af" }}>
          Keychron Orca echo — なぜこの配置にしたか
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Noto Sans JP",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
