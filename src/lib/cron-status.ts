/**
 * 定期実行の記録の「判断・表示」だけを行う純粋な関数(P7-12)。DBの読み書きは cron-runs.ts。
 */

/** これより長く動いていなければ「遅れています」(1日1回の実行 + 無料プランの実行時刻のずれ 1時間 + 余裕) */
export const CRON_LATE_AFTER_HOURS = 26;

export type CronHealth = "ok" | "late" | "failed" | "never";

/** 最後の記録から、今の状態を決める */
export function cronHealth(last: { ok: boolean; ranAt: string } | null, now: Date = new Date()): CronHealth {
  if (!last) return "never";
  if (now.getTime() - Date.parse(last.ranAt) > CRON_LATE_AFTER_HOURS * 60 * 60 * 1000) return "late";
  return last.ok ? "ok" : "failed";
}

/** 日時を日本時間の「2026/09/30 12:07」の形にする */
export function formatDateTimeJa(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}
