import { timingSafeEqual } from "node:crypto";

/**
 * Vercel の定期実行(Cron)からの呼び出しかを確かめる(P6-6)。
 * Vercel は環境変数 CRON_SECRET の値を「Authorization: Bearer <値>」として送ってくる
 * (https://vercel.com/docs/cron-jobs/manage-cron-jobs 、確認日 2026-09-29)。
 * CRON_SECRET が設定されていなければ、だれからの呼び出しも受け付けない。
 */
export function isAuthorizedCron(authorization: string | null, cronSecret: string | undefined): boolean {
  if (!cronSecret || !authorization) return false;
  const expected = Buffer.from(`Bearer ${cronSecret}`, "utf8");
  const actual = Buffer.from(authorization, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
