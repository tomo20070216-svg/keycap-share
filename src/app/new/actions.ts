"use server";

import { isDevPagesEnabled } from "@/lib/dev-pages";
import { submitLayout, type SubmitResult } from "@/lib/layout-submit";

/**
 * エディタの「保存する」から呼ばれる Server Function(P5-1)。
 * 画面を通さず直接呼び出されても安全なよう、入力は submitLayout の中で必ず検証する。
 * testPost(一覧に出さないテスト投稿)は開発環境でだけ有効。本番では常に一覧に出す。
 */
export async function submitLayoutAction(input: unknown, testPost: boolean): Promise<SubmitResult> {
  const isListed = !(testPost === true && isDevPagesEnabled());
  return submitLayout(input, { isListed });
}
