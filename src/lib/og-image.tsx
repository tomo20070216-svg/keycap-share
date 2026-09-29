import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { KeymapDiagram, getKeymapDiagramSize } from "@/components/KeymapDiagram";
import { buildKeymapRenderModel } from "@/lib/keymap-render";
import { fitSingleLine } from "@/lib/label-fit";
import type { KeyboardPhysicalLayout, Layer, Layout } from "@/lib/schemas";
import { SITE_NAME } from "@/lib/site";

/**
 * OGP画像(Xのカードなどに出る 1200×630 の画像)の生成。
 * 画面と同じ KeymapDiagram 部品でキー配置図を描く(plan.md 方針3)。
 *
 * フォント(Noto Sans JP Bold、5.3MB)は丸ごと使う(P4-1の結論)。一度読み込んだら使い回す。
 * 画像のURLには配列の更新日時(v)を含め、URLが同じなら内容も同じなので CDN に長くキャッシュさせる。
 */

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
const PADDING = 40;
const FONT_NAME = "Noto Sans JP";

let fontPromise: Promise<Buffer> | null = null;
function loadFont(): Promise<Buffer> {
  fontPromise ??= readFile(join(process.cwd(), "public/fonts/NotoSansJP-Bold.ttf"));
  return fontPromise;
}

/** 画像URLに付ける版(配列の更新日時のミリ秒) */
export function ogImageVersion(layout: Layout): string {
  return String(Date.parse(layout.updatedAt));
}

/** OGP画像のURL(パス)。レイヤー番号を省略すると配列ページ用(通常レイヤー) */
export function ogImagePath(layout: Layout, layerNumber?: number): string {
  const base = layerNumber === undefined ? `/og/k/${layout.slug}` : `/og/k/${layout.slug}/${layerNumber}`;
  return `${base}?v=${ogImageVersion(layout)}`;
}

/** 配列ページ用の画像に描くレイヤー(番号が最小のレイヤー) */
export function baseLayerOf(layout: Layout): Layer {
  return [...layout.layers].sort((a, b) => a.layerNumber - b.layerNumber)[0];
}

export function OgImageContent({
  layout,
  keyboard,
  layer,
}: {
  layout: Layout;
  keyboard: KeyboardPhysicalLayout;
  layer: Layer;
}) {
  const innerWidth = OG_WIDTH - PADDING * 2;
  const title = fitSingleLine(layout.title, innerWidth, 52, 30);
  // 機種名・レイヤー名・投稿者名(投稿者名がない配列では出さない。人間の決定)
  const subtitle = [keyboard.name, layer.layerName, layout.authorName ? `投稿者: ${layout.authorName}` : null]
    .filter(Boolean)
    .join("  ·  ");
  const sub = fitSingleLine(subtitle, innerWidth, 26, 18);

  // キー配置図を、残りの領域に収まる大きさで描く
  const headerHeight = 130;
  const footerHeight = 34;
  const unitSize = getKeymapDiagramSize(buildKeymapRenderModel(keyboard, layer, { combos: layout.combos }), 1);
  const unit = Math.floor(
    Math.min(innerWidth / unitSize.width, (OG_HEIGHT - PADDING * 2 - headerHeight - footerHeight) / unitSize.height)
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: PADDING,
        backgroundColor: "#ffffff",
        color: "#18181b",
        fontFamily: FONT_NAME,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", height: headerHeight, justifyContent: "center", gap: 8 }}>
        <div style={{ fontSize: title.fontSize, fontWeight: 700, lineHeight: 1.2, whiteSpace: "nowrap" }}>{title.text}</div>
        <div style={{ fontSize: sub.fontSize, color: "#52525b", whiteSpace: "nowrap" }}>{sub.text}</div>
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "center" }}>
        <KeymapDiagram physicalLayout={keyboard} layer={layer} combos={layout.combos} unit={unit} fontFamily={FONT_NAME} />
      </div>
      <div style={{ display: "flex", height: footerHeight, justifyContent: "flex-end", alignItems: "flex-end" }}>
        <div style={{ fontSize: 20, color: "#71717a" }}>{SITE_NAME}</div>
      </div>
    </div>
  );
}

/**
 * OGP画像のレスポンス。URLの版(v)が今の配列と同じなら長期キャッシュ、違えば(古いURL・版なし)短いキャッシュ。
 */
export async function renderOgImage(params: {
  layout: Layout;
  keyboard: KeyboardPhysicalLayout;
  layer: Layer;
  requestedVersion: string | null;
}): Promise<ImageResponse> {
  const { layout, keyboard, layer, requestedVersion } = params;
  const cacheControl =
    requestedVersion === ogImageVersion(layout)
      ? "public, max-age=86400, s-maxage=31536000, immutable"
      : "public, max-age=0, s-maxage=60";
  return new ImageResponse(<OgImageContent layout={layout} keyboard={keyboard} layer={layer} />, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [{ name: FONT_NAME, data: await loadFont(), weight: 700, style: "normal" }],
    headers: { "Cache-Control": cacheControl },
  });
}
