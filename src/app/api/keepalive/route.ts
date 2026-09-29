import { isAuthorizedCron } from "@/lib/cron-auth";
import { supabase } from "@/lib/supabase";

/**
 * Supabase の自動停止対策(P6-6)。Supabase の無料プランは1週間アクセスがないと一時停止するため、
 * Vercel の定期実行(vercel.json の crons、1日1回)でこのルートを呼び、DBに軽くアクセスする。
 * Vercel からの呼び出し(CRON_SECRET の合言葉付き)以外は受け付けない。
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request.headers.get("authorization"), process.env.CRON_SECRET)) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { error } = await supabase.from("keyboards").select("id").limit(1);
  if (error) {
    console.error("keepalive: DBへのアクセスに失敗しました", error);
    return Response.json({ ok: false }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
  return Response.json({ ok: true, checkedAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
