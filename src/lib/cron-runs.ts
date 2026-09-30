import { supabase } from "@/lib/supabase";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * 定期実行の記録(P7-12、0006 の cron_runs)。
 * 書き込み・削除はサーバー側(secret key)、読み取りは公開用クライアント(ブラウザと同じ権限)で行う。
 */

export type CronRun = { id: number; ok: boolean; ranAt: string };

/** 記録を残す日数。これより古い記録は、書き込むときに消す */
export const CRON_RUNS_KEEP_DAYS = 30;

/** 定期実行が動いたことを記録し、古い記録を消す。書き込んだ記録の id を返す */
export async function recordCronRun(ok: boolean): Promise<number> {
  const db = createServerSupabase();
  const { data, error } = await db.from("cron_runs").insert({ job: "keepalive", ok }).select("id").single();
  if (error) throw new Error(`定期実行の記録に失敗しました: ${error.message}`);
  const cutoff = new Date(Date.now() - CRON_RUNS_KEEP_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { error: pruneError } = await db.from("cron_runs").delete().eq("job", "keepalive").lt("ran_at", cutoff);
  if (pruneError) console.error("古い定期実行の記録を消せませんでした", pruneError);
  return data.id;
}

/** 最近の記録(新しい順) */
export async function listCronRuns(limit = 7): Promise<CronRun[]> {
  const { data, error } = await supabase
    .from("cron_runs")
    .select("id, ok, ran_at")
    .eq("job", "keepalive")
    .order("ran_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`定期実行の記録の取得に失敗しました: ${error.message}`);
  return data.map((r) => ({ id: r.id, ok: r.ok, ranAt: new Date(r.ran_at).toISOString() }));
}
