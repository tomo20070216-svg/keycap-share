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
  if (!hasKey) return null;
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
