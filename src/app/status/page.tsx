import type { Metadata } from "next";
import { CRON_LATE_AFTER_HOURS, cronHealth, formatDateTimeJa } from "@/lib/cron-status";
import { listCronRuns } from "@/lib/cron-runs";

/**
 * 定期実行の状態(P7-12)。「最後に動いた日時」と最近の記録を表示する。
 * 運用の確認用のページなので、どこからもリンクせず、検索エンジンにも載せない(docs/operations.md)。
 */

export const metadata: Metadata = {
  title: "サイトの状態",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const HEALTH_LABEL = {
  ok: { text: "✅ 正常", className: "border-emerald-300 bg-emerald-50 text-emerald-900" },
  late: {
    text: `⚠️ 遅れています(${CRON_LATE_AFTER_HOURS}時間以上動いていません)`,
    className: "border-amber-300 bg-amber-50 text-amber-900",
  },
  failed: { text: "❌ 最後の実行でデータベースにアクセスできませんでした", className: "border-red-300 bg-red-50 text-red-900" },
  never: { text: "まだ一度も動いていません", className: "border-zinc-300 bg-zinc-50 text-zinc-800" },
} as const;

export default async function StatusPage() {
  const runs = await listCronRuns(7);
  const health = cronHealth(runs[0] ?? null);
  const label = HEALTH_LABEL[health];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">サイトの状態</h1>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">定期実行(Supabase の自動停止対策)</h2>
        <p className="text-sm text-zinc-600">
          毎日お昼の12時台(日本時間)に1回、データベースにアクセスして、無料プランの自動停止を防いでいます。
        </p>
        <div data-testid="cron-health" data-health={health} className={`rounded-md border px-4 py-3 ${label.className}`}>
          <div className="text-sm">
            {"最後に動いた日時: "}
            <span data-testid="cron-last-run" className="font-bold">
              {runs[0] ? `${formatDateTimeJa(runs[0].ranAt)}(日本時間)` : "記録なし"}
            </span>
          </div>
          <div className="mt-1 font-bold">{label.text}</div>
        </div>
      </section>
      {runs.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-base font-bold">最近の記録(新しい順、最大7件)</h2>
          <ul data-testid="cron-runs" className="flex flex-col gap-1 text-sm">
            {runs.map((run) => (
              <li key={run.id} className="flex gap-4">
                <span className="tabular-nums">{formatDateTimeJa(run.ranAt)}</span>
                <span>{run.ok ? "成功" : "失敗"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
