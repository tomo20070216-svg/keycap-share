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

/** 一覧の並べ替え(P7-7): 新着順(省略時)・人気順(⭐️の多い順) */
export type LayoutSort = "new" | "popular";

/** URLの ?sort= の値を読む。省略は新着順、"popular" は人気順。それ以外は null(= 404にする) */
export function parseSortParam(value: string | string[] | undefined): LayoutSort | null {
  if (value === undefined) return "new";
  return value === "popular" ? "popular" : null;
}

/**
 * URLの ?keyboard= の値を読む(機種での絞り込み。フェーズ8)。省略は「すべて」(null)、
 * 対応している機種の id ならその id。それ以外は false(= 404にする)
 */
export function parseKeyboardParam(value: string | string[] | undefined, supportedIds: string[]): string | null | false {
  if (value === undefined) return null;
  return typeof value === "string" && supportedIds.includes(value) ? value : false;
}

/** 一覧のURL(機種・並べ替え・ページ)。すべての機種・新着順・1ページ目は省略する */
export function listHref(
  basePath: string,
  options: { page?: number; sort?: LayoutSort; keyboard?: string | null } = {}
): string {
  const params = new URLSearchParams();
  if (options.keyboard) params.set("keyboard", options.keyboard);
  if (options.sort === "popular") params.set("sort", "popular");
  if (options.page && options.page > 1) params.set("page", String(options.page));
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** 総数から総ページ数を求める(0件でも1ページとする) */
export function totalPages(total: number, perPage = LAYOUTS_PER_PAGE): number {
  return Math.max(1, Math.ceil(total / perPage));
}

/**
 * URLのタグ名を読む。URLエンコードされたまま渡ってきた場合も、デコード済みの場合も同じ結果にする。
 * タグの長さの上限(20文字)を超える・空・不正なエンコードは null(= 404にする)。
 */
export function decodeTagParam(param: string): string | null {
  let tag = param;
  if (/%[0-9A-Fa-f]{2}/.test(tag)) {
    try {
      tag = decodeURIComponent(tag);
    } catch {
      return null;
    }
  }
  tag = tag.trim();
  if (tag.length === 0 || [...tag].length > 20) return null;
  return tag;
}
