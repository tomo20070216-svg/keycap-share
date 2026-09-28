import { cache } from "react";
import { getKeyboard, getLayoutBySlug } from "@/lib/layout-repository";
import type { KeyboardPhysicalLayout, Layout } from "@/lib/schemas";

/**
 * 閲覧ページ用のデータ取得。
 * React の cache で、同じリクエスト内の重複した取得(ページ本体とメタデータなど)を1回にまとめる。
 */
export const getLayoutPageData = cache(
  async (slug: string): Promise<{ layout: Layout; keyboard: KeyboardPhysicalLayout } | null> => {
    const layout = await getLayoutBySlug(slug);
    if (!layout) return null;
    const keyboard = await getKeyboard(layout.keyboardId);
    if (!keyboard) return null;
    return { layout, keyboard };
  }
);
