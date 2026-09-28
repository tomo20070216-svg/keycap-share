import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { KeymapDiagram } from "@/components/KeymapDiagram";
import { isDevPagesEnabled } from "@/lib/dev-pages";
import { buildKeymapRenderModel } from "@/lib/keymap-render";
import { getKeyboard, getLayoutBySlug } from "@/lib/layout-repository";
import { getKeymapDiagramSize } from "@/components/KeymapDiagram";

/**
 * 開発用(P2-8): 画面表示と同じ KeymapDiagram 部品から、OGP用のPNG(1200×630)を作れることを確認する。
 * Supabaseから配列を取得し、通常レイヤー(番号が最小のレイヤー)を描く。本番のOGP画像はフェーズ4で作る。
 * ルート(route.tsx)には /dev のレイアウトが効かないため、ここで本番かどうかを確認する。
 */

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(_request: Request, context: RouteContext<"/dev/og/[slug]">) {
  if (!isDevPagesEnabled()) return new Response("Not Found", { status: 404 });

  const { slug } = await context.params;
  const layout = await getLayoutBySlug(slug);
  const keyboard = layout ? await getKeyboard(layout.keyboardId) : null;
  if (!layout || !keyboard) return new Response("Not Found", { status: 404 });

  const layer = [...layout.layers].sort((a, b) => a.layerNumber - b.layerNumber)[0];
  // 図が画像の幅・高さに収まるよう、キー1つ分の大きさを決める
  const unitSize = getKeymapDiagramSize(buildKeymapRenderModel(keyboard, layer, { combos: layout.combos }), 1);
  const unit = Math.floor(Math.min((WIDTH - 80) / unitSize.width, (HEIGHT - 170) / unitSize.height));

  const font = await readFile(join(process.cwd(), "public/fonts/NotoSansJP-Bold.ttf"));
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
          gap: 20,
          backgroundColor: "#ffffff",
          fontFamily: "Noto Sans JP",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: "#18181b" }}>{layout.title}</div>
          <div style={{ fontSize: 22, color: "#52525b" }}>{`${keyboard.name} — ${layer.layerName}`}</div>
        </div>
        <KeymapDiagram
          physicalLayout={keyboard}
          layer={layer}
          combos={layout.combos}
          unit={unit}
          fontFamily="Noto Sans JP"
        />
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: [{ name: "Noto Sans JP", data: font, weight: 700, style: "normal" }],
    }
  );
}
