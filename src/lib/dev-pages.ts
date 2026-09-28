import { notFound } from "next/navigation";

/**
 * 開発用の確認ページ(/dev/...)を本番で出さないためのチェック(人間の判断、2026-09-29)。
 * mainへのpushはVercelの本番に自動デプロイされるため、本番(VERCEL_ENV=production)では404にする。
 * 手元の開発サーバーや、main以外のブランチのプレビューデプロイでは表示する。
 */
export function isDevPagesEnabled(): boolean {
  return process.env.VERCEL_ENV !== "production";
}

/** ページ・レイアウト用: 本番では404(not-found)にする */
export function assertDevPagesEnabled(): void {
  if (!isDevPagesEnabled()) notFound();
}
