"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { setStarAction } from "@/app/k/[slug]/star-actions";
import { getEditKey } from "@/lib/edit-keys";
import { isStarred, setStarred, subscribeStarred } from "@/lib/starred";

/**
 * 配列ページの⭐️ボタン(P7-6)。押すと⭐️を付け、もう一度押すと外す。
 * このブラウザに編集用の秘密キーがある配列(=自分の投稿)には付けられない。
 * 付けたかどうかはブラウザに記録する(サーバーの描画では「付けていない」で描き、ブラウザで直す)。
 */
export function StarButton({ slug, initialCount }: { slug: string; initialCount: number }) {
  const starred = useSyncExternalStore(subscribeStarred, () => isStarred(slug), () => false);
  const isOwner = useSyncExternalStore(
    () => () => {},
    () => getEditKey(slug) !== null,
    () => false
  );
  const [count, setCount] = useState(initialCount);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    if (isOwner || isPending) return;
    const on = !starred;
    const before = count;
    // 先に見た目を変え、失敗したら戻す
    setStarred(slug, on);
    setCount(Math.max(0, before + (on ? 1 : -1)));
    setMessage(null);
    startTransition(async () => {
      const result = await setStarAction({ slug, on }).catch(() => null);
      if (!result || !result.ok) {
        setStarred(slug, !on);
        setCount(before);
        setMessage(result?.error ?? "⭐️を保存できませんでした。通信状態を確かめて、もう一度お試しください。");
        return;
      }
      setCount(result.starCount);
      if (on && result.starCount <= before) {
        // 同じ回線(同じ接続元)から、すでに⭐️が付いていた
        setMessage("この回線からは、すでに⭐️が付いています。");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={isOwner}
        aria-pressed={starred}
        aria-label={isOwner ? `⭐️ ${count}(自分の配列には付けられません)` : starred ? `⭐️を外す(今 ${count})` : `⭐️を付ける(今 ${count})`}
        data-testid="star-button"
        className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-bold transition-colors ${
          starred ? "border-amber-400 bg-amber-100 text-amber-900 hover:bg-amber-200" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span aria-hidden className={starred ? "" : "grayscale"}>
          ⭐️
        </span>
        <span data-testid="star-count">{count}</span>
      </button>
      {isOwner && <span className="text-xs text-zinc-500">自分の配列には⭐️を付けられません</span>}
      {message && (
        <span role="status" className="text-xs text-zinc-700">
          {message}
        </span>
      )}
    </div>
  );
}
