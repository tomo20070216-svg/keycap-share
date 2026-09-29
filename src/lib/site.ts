/** サイト名(仮。正式名は未確定。docs/voice.md。人間の決定 2026-09-29) */
export const SITE_NAME = "keycap-share";

/**
 * サイトのURL(メタタグの絶対URLの土台 metadataBase に使う)。
 * - 本番(Vercel): VERCEL_PROJECT_PRODUCTION_URL(例: keycap-share.vercel.app)
 * - プレビュー(Vercel): VERCEL_BRANCH_URL(ブランチ用のURL)
 * - 手元: http://localhost:<PORT>
 */
export function getSiteUrl(env: Record<string, string | undefined> = process.env): URL {
  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) {
    return new URL(`https://${env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }
  const previewHost = env.VERCEL_BRANCH_URL ?? env.VERCEL_URL;
  if (env.VERCEL_ENV && previewHost) return new URL(`https://${previewHost}`);
  return new URL(`http://localhost:${env.PORT ?? "3000"}`);
}
