import type { Layer, Layout } from "@/lib/schemas";

/** 閲覧ページ用の、Supabaseに依存しない小さな関数 */

/**
 * URLのレイヤー番号(文字列)から、配列のレイヤーを探す。
 * 数字だけで書かれた番号(先頭の0なし)で、配列に存在するものだけを受け付ける。それ以外は null。
 */
export function findLayerByParam(layout: Layout, param: string): Layer | null {
  if (!/^(0|[1-9]\d{0,3})$/.test(param)) return null;
  const layerNumber = Number(param);
  return layout.layers.find((l) => l.layerNumber === layerNumber) ?? null;
}

/** 日付を日本時間の「2026/09/28」の形にする */
export function formatDateJa(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}
