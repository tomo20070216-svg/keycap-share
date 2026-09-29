"use client";

import { useLinkStatus } from "next/link";

/**
 * <Link> の中に置くと、押してからページが切り替わるまでの間だけ文言を変える(押したのに反応がないように見えないように)。
 * ページ全体の loading.tsx を使うと、存在しないページでも 404 ではなく 200 が返るようになるため、リンク自体で知らせる。
 */
export function PendingLinkLabel({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useLinkStatus();
  return <span aria-live="polite">{pending ? pendingLabel : label}</span>;
}
