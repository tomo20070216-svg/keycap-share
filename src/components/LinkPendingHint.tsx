"use client";

import { useLinkStatus } from "next/link";

/**
 * <Link> の中に置くと、押してから次の画面が出るまでの間だけ、小さな回る印と「読み込み中」を出す(P7-11)。
 * 読み上げソフト向けに aria-live で知らせる。
 */
export function LinkPendingHint({ label = "読み込み中…" }: { label?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span aria-live="polite" className="inline-flex items-center">
      {pending && (
        <span className="ml-1.5 inline-flex items-center gap-1 text-xs font-normal opacity-80">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
          {label}
        </span>
      )}
    </span>
  );
}
