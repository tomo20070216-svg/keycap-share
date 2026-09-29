import { cache } from "react";
import { getKeyboard, getLayoutBySlug, getLayoutSummaryById } from "@/lib/layout-repository";
import type { KeyboardPhysicalLayout, Layout } from "@/lib/schemas";

/**
 * 閲覧ページ用のデータ取得。
 * React の cache で、同じリクエスト内の重複した取得(ページ本体とメタデータなど)を1回にまとめる。
 */
export const getLayoutPageData = cache(
  async (
    slug: string
  ): Promise<{ layout: Layout; keyboard: KeyboardPhysicalLayout; forkedFrom: { slug: string; title: string } | null } | null> => {
    const layout = await getLayoutBySlug(slug);
    if (!layout) return null;
    const keyboard = await getKeyboard(layout.keyboardId);
    if (!keyboard) return null;
    // 「コピーして編集」で作られた配列なら、元にした配列(削除されていれば null)
    const forkedFrom = layout.forkedFromLayoutId ? await getLayoutSummaryById(layout.forkedFromLayoutId) : null;
    return { layout, keyboard, forkedFrom };
  }
);

/** 一覧に出てくる配列の機種をまとめて取得する(機種ごとに1回だけ) */
export async function getKeyboardsFor(layouts: Layout[]): Promise<Map<string, KeyboardPhysicalLayout>> {
  const ids = [...new Set(layouts.map((l) => l.keyboardId))];
  const keyboards = await Promise.all(ids.map((id) => getKeyboard(id)));
  return new Map(keyboards.flatMap((k) => (k ? [[k.id, k] as const] : [])));
}
