import { hashEditSecret, verifyEditSecret } from "@/lib/edit-secret";
import { validateSubmission } from "@/lib/layout-submission";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * 配列の編集・削除(P6-2)。サーバー側でのみ使う(secret key で DB の関数を呼ぶため)。
 * 秘密キーの照合は DB の関数(0004)の中でも行うので、キーが違えば何も変わらない。
 */

export type EditResult = { ok: true } | { ok: false; errors: string[] };

const WRONG_SECRET = "編集用のキーが正しくありません。保存したときに表示された編集用URLから開き直してください。";

/** 秘密キーがこの配列のものか(編集ページを開くときの確認用) */
export async function checkEditSecret(slug: string, secret: string): Promise<boolean> {
  if (!secret) return false;
  const db = createServerSupabase();
  const { data, error } = await db
    .from("layouts")
    .select("layout_secrets ( edit_secret_hash )")
    .eq("slug", slug)
    .maybeSingle<{ layout_secrets: { edit_secret_hash: string } | null }>();
  if (error) throw new Error(`配列の取得に失敗しました: ${error.message}`);
  const hash = data?.layout_secrets?.edit_secret_hash;
  return !!hash && verifyEditSecret(secret, hash);
}

/** 秘密キーを照合して、配列の内容を置き換える。機種と「元にした配列」は変えない */
export async function updateLayoutWithSecret(slug: string, secret: string, raw: unknown): Promise<EditResult> {
  const validation = validateSubmission(raw);
  if (!validation.ok) return validation;
  const input = validation.input;
  const db = createServerSupabase();
  const { error } = await db.rpc("replace_layout_content", {
    p_slug: slug,
    p_edit_secret_hash: hashEditSecret(secret),
    p_title: input.title,
    p_description: input.description ?? null,
    p_author_name: input.authorName ?? null,
    p_tags: input.tags,
    p_layers: input.layers,
    p_combos: input.combos,
    p_macros: input.macros,
  });
  if (!error) return { ok: true };
  if (error.message.includes("invalid_edit_secret")) return { ok: false, errors: [WRONG_SECRET] };
  console.error("配列の更新に失敗しました", error);
  return { ok: false, errors: ["保存に失敗しました。時間をおいて、もう一度保存してください。入力内容はこのブラウザに下書きとして残っています。"] };
}

/** 秘密キーを照合して、配列を削除する */
export async function deleteLayoutWithSecret(slug: string, secret: string): Promise<EditResult> {
  const db = createServerSupabase();
  const { data, error } = await db.rpc("delete_layout_with_secret", {
    p_slug: slug,
    p_edit_secret_hash: hashEditSecret(secret),
  });
  if (error) {
    console.error("配列の削除に失敗しました", error);
    return { ok: false, errors: ["削除に失敗しました。時間をおいて、もう一度お試しください。"] };
  }
  return data === true ? { ok: true } : { ok: false, errors: [WRONG_SECRET] };
}
