"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { getEditKey } from "@/lib/edit-keys";

/**
 * このブラウザに編集用の秘密キーが保存されている配列(=自分の投稿)にだけ、「編集する」ボタンを出す(P6-3)。
 * サーバー側では秘密キーが分からないので、ブラウザで表示を決める(サーバーの描画では出さない)。
 */
export function OwnerEditLink({ slug }: { slug: string }) {
  const hasKey = useSyncExternalStore(
    () => () => {},
    () => getEditKey(slug) !== null,
    () => false
  );
  if (!hasKey) {
    // このブラウザに鍵がないだけで、ボタンを消すとなぜ編集できないか伝わらない。
    // 投稿者が別の端末・ブラウザで開いた場合に気づけるよう、ヒントを残す
    return (
      <span data-testid="owner-edit-hint" className="text-xs text-zinc-500">
        このブラウザには編集用の鍵がありません。投稿者の方は、保存時に表示された編集用URLを開いてください。
      </span>
    );
  }
  return (
    <Link
      href={`/k/${slug}/edit`}
      data-testid="owner-edit-link"
      className="inline-block rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-bold text-white hover:bg-zinc-700"
    >
      編集する
    </Link>
  );
}
