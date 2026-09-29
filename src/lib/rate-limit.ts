import { createHash } from "node:crypto";
import { DUPLICATE_WINDOW_MINUTES, decideReport, decideSubmission, hashIp } from "@/lib/spam-rules";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * 投稿数の制限(P6-4)のDBの読み書き。サーバー側でのみ使う。
 * 記録は submission_events(0004)。接続元はハッシュにして保存する。
 */

export type EventKind = "layout_create" | "report";

/** リクエストのヘッダーから接続元のIPアドレスを取り出す(Vercel では x-forwarded-for の先頭) */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/** IPアドレスのハッシュに使う salt。サーバーだけが持つ secret key から作る(新しい環境変数を増やさないため) */
function ipSalt(): string {
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("SUPABASE_SECRET_KEY が設定されていません");
  return createHash("sha256").update(`ip-salt:${secret}`, "utf8").digest("hex");
}

export function ipHashFor(ip: string): string {
  return hashIp(ip, ipSalt());
}

async function countSince(kind: EventKind, ipHash: string, sinceMs: number): Promise<number> {
  const db = createServerSupabase();
  const { count, error } = await db
    .from("submission_events")
    .select("id", { count: "exact", head: true })
    .eq("kind", kind)
    .eq("ip_hash", ipHash)
    .gte("created_at", new Date(Date.now() - sinceMs).toISOString());
  if (error) throw new Error(`投稿の記録の取得に失敗しました: ${error.message}`);
  return count ?? 0;
}

/** 受け付けてよいか。受け付けないときはエラー文を返す */
export async function checkSubmissionAllowed(kind: EventKind, ipHash: string, content: string | null): Promise<string | null> {
  const [lastHour, lastDay] = await Promise.all([
    countSince(kind, ipHash, 60 * 60 * 1000),
    countSince(kind, ipHash, 24 * 60 * 60 * 1000),
  ]);
  let duplicateRecent = false;
  if (content) {
    const db = createServerSupabase();
    const { count, error } = await db
      .from("submission_events")
      .select("id", { count: "exact", head: true })
      .eq("kind", kind)
      .eq("content_hash", content)
      .gte("created_at", new Date(Date.now() - DUPLICATE_WINDOW_MINUTES * 60 * 1000).toISOString());
    if (error) throw new Error(`投稿の記録の取得に失敗しました: ${error.message}`);
    duplicateRecent = (count ?? 0) > 0;
  }
  return decideSubmission({ lastHour, lastDay, duplicateRecent });
}

/**
 * 問題の報告を受け付けてよいか(P6-5)。同じ接続元からの件数と、同じ配列への報告(1日1回まで)を見る。
 * 同じ配列かどうかは、配列のIDと接続元のハッシュから作ったハッシュ(content_hash)で見分ける。
 */
export async function checkReportAllowed(ipHash: string, layoutId: string): Promise<string | null> {
  const [lastHour, lastDay] = await Promise.all([
    countSince("report", ipHash, 60 * 60 * 1000),
    countSince("report", ipHash, 24 * 60 * 60 * 1000),
  ]);
  const db = createServerSupabase();
  const { count, error } = await db
    .from("submission_events")
    .select("id", { count: "exact", head: true })
    .eq("kind", "report")
    .eq("content_hash", reportKey(ipHash, layoutId))
    .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
  if (error) throw new Error(`報告の記録の取得に失敗しました: ${error.message}`);
  return decideReport({ lastHour, lastDay, alreadyReported: (count ?? 0) > 0 });
}

/** 同じ人が同じ配列を報告したかを見分けるためのキー */
export function reportKey(ipHash: string, layoutId: string): string {
  return createHash("sha256").update(`report:${ipHash}:${layoutId}`, "utf8").digest("hex");
}

/** 受け付けた投稿・報告を記録する */
export async function recordSubmission(kind: EventKind, ipHash: string, content: string | null): Promise<void> {
  const db = createServerSupabase();
  const { error } = await db.from("submission_events").insert({ kind, ip_hash: ipHash, content_hash: content });
  if (error) console.error("投稿の記録に失敗しました", error);
}
