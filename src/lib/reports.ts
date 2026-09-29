import { z } from "zod";
import { checkReportAllowed, recordSubmission, reportKey } from "@/lib/rate-limit";
import { REPORT_REASONS } from "@/lib/report-reasons";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * 問題の報告(P6-5)。サーバー側でのみ使う。報告は reports(0004)に記録し、ブラウザ側からは読めない。
 * 報告を受けた配列の削除は、毎回人間の承認を得てから行う(docs/operations.md)。
 */

export const ReportInputSchema = z.object({
  slug: z.string().min(1).max(64),
  reason: z.enum(REPORT_REASONS.map((r) => r.id) as [string, ...string[]]),
  comment: z.string().max(500).default(""),
});

export type ReportResult = { ok: true } | { ok: false; error: string };

export async function submitReport(raw: unknown, ipHash: string): Promise<ReportResult> {
  const parsed = ReportInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "報告の内容に誤りがあります。理由を選び、コメントは500文字以内にしてください。" };
  const { slug, reason, comment } = parsed.data;

  const db = createServerSupabase();
  const { data: layout, error: findError } = await db.from("layouts").select("id").eq("slug", slug).maybeSingle();
  if (findError) throw new Error(`配列の取得に失敗しました: ${findError.message}`);
  if (!layout) return { ok: false, error: "報告する配列が見つかりませんでした。すでに削除されている可能性があります。" };

  const limited = await checkReportAllowed(ipHash, layout.id);
  if (limited) return { ok: false, error: limited };

  const { error } = await db.from("reports").insert({ layout_id: layout.id, reason, comment: comment.trim(), ip_hash: ipHash });
  if (error) {
    console.error("報告の保存に失敗しました", error);
    return { ok: false, error: "報告を送れませんでした。時間をおいて、もう一度お試しください。" };
  }
  await recordSubmission("report", ipHash, reportKey(ipHash, layout.id));
  return { ok: true };
}
