import type { Metadata } from "next";
import { layoutPath } from "@/components/LayoutView";
import { OG_HEIGHT, OG_WIDTH, ogImagePath } from "@/lib/og-image";
import type { KeyboardPhysicalLayout, Layer, Layout } from "@/lib/schemas";
import { SITE_NAME } from "@/lib/site";

/**
 * 配列ページ・レイヤーページのメタタグ(XのカードやOGP)。
 * Xのクローラーは JavaScript を実行しないため、サーバー側で出力する(plan.md 方針2)。
 * URLは相対パスで書き、ルートレイアウトの metadataBase で絶対URLになる。
 */
export function buildLayoutMetadata(
  layout: Layout,
  keyboard: KeyboardPhysicalLayout,
  layer?: Layer
): Metadata {
  const title = layer
    ? `${layout.title} — ${layer.layerName}(${keyboard.name})`
    : `${layout.title}(${keyboard.name})`;
  const description = layout.description?.trim()
    ? layout.description.trim().slice(0, 150)
    : `${keyboard.name}のキー配列です。`;
  const url = layoutPath(layout.slug, layer?.layerNumber);
  const image = {
    url: ogImagePath(layout, layer?.layerNumber),
    width: OG_WIDTH,
    height: OG_HEIGHT,
    alt: `${layout.title} のキー配置図(${keyboard.name}${layer ? `、${layer.layerName}` : ""})`,
  };
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "ja_JP",
      title,
      description,
      url,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
