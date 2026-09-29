import { z } from "zod";
import { checkStarAllowed, recordSubmission } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * ⭐️(星)を付ける・外す(P7-6)。サーバー側でのみ使う。
 * 星の記録は stars(0005)。同じ接続元からは同じ配列に1つまで(DBの主キーで保証)。接続元はハッシュでだけ記録する。
 */

export const StarInputSchema = z.object({
  slug: z.string().min(1).max(64),
  on: z.boolean(),
});

export type StarResult = { ok: true; starCount: number; starred: boolean } | { ok: false; error: string };

export async function setStar(raw: unknown, ipHash: string): Promise<StarResult> {
  const parsed = StarInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "⭐️の操作の内容に誤りがあります。ページを再読み込みしてから、もう一度お試しください。" };
  const { slug, on } = parsed.data;

  const limited = await checkStarAllowed(ipHash);
  if (limited) return { ok: false, error: limited };

  const { data, error } = await createServerSupabase().rpc("set_star", { p_slug: slug, p_ip_hash: ipHash, p_on: on });
  if (error) {
    console.error("⭐️の保存に失敗しました", error);
    return { ok: false, error: "⭐️を保存できませんでした。時間をおいて、もう一度お試しください。" };
  }
  if (data === null) return { ok: false, error: "配列が見つかりませんでした。すでに削除されている可能性があります。" };
  await recordSubmission("star", ipHash, null);
  return { ok: true, starCount: data as number, starred: on };
}
