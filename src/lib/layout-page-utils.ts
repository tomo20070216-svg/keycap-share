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

/** 一覧の1ページあたりの件数 */
export const LAYOUTS_PER_PAGE = 20;

/**
 * URLの ?page= の値を読む。省略・不正な値(数字でない・0以下・先頭0)は null(= 404にする)。
 * 省略時は1ページ目。
 */
export function parsePageParam(value: string | string[] | undefined): number | null {
  if (value === undefined) return 1;
  if (Array.isArray(value)) return null;
  if (!/^[1-9]\d{0,5}$/.test(value)) return null;
  return Number(value);
}

/** 総数から総ページ数を求める(0件でも1ページとする) */
export function totalPages(total: number, perPage = LAYOUTS_PER_PAGE): number {
  return Math.max(1, Math.ceil(total / perPage));
}
